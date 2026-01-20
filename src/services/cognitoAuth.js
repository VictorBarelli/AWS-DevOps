import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_IP1GCfvgO',
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '2ubtd7k3usq2p5fr5gbtssqho1'
};

const userPool = new CognitoUserPool(poolData);

const COGNITO_DOMAIN = 'https://gameswipe-auth.auth.us-east-1.amazoncognito.com';
const REDIRECT_URI = window.location.origin;

class CognitoAuthService {
    getCurrentUser() {
        return userPool.getCurrentUser();
    }

    getSession() {
        return new Promise((resolve, reject) => {
            const user = this.getCurrentUser();
            if (!user) {
                resolve(null);
                return;
            }
            user.getSession((err, session) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(session);
            });
        });
    }

    async getIdToken() {
        const session = await this.getSession();
        return session?.getIdToken()?.getJwtToken();
    }

    async getUserInfo() {
        const user = this.getCurrentUser();
        if (!user) return null;

        return new Promise((resolve, reject) => {
            user.getSession((err, session) => {
                if (err) {
                    reject(err);
                    return;
                }
                user.getUserAttributes((err, attributes) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const userInfo = {};
                    attributes.forEach(attr => {
                        userInfo[attr.getName()] = attr.getValue();
                    });
                    resolve(userInfo);
                });
            });
        });
    }

    signUp(email, password, name) {
        return new Promise((resolve, reject) => {
            const attributeList = [
                new CognitoUserAttribute({ Name: 'email', Value: email }),
                new CognitoUserAttribute({ Name: 'name', Value: name })
            ];

            userPool.signUp(email, password, attributeList, null, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }

    confirmSignUp(email, code) {
        return new Promise((resolve, reject) => {
            const user = new CognitoUser({ Username: email, Pool: userPool });
            user.confirmRegistration(code, true, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }

    signIn(email, password) {
        return new Promise((resolve, reject) => {
            const user = new CognitoUser({ Username: email, Pool: userPool });
            const authDetails = new AuthenticationDetails({
                Username: email,
                Password: password
            });

            user.authenticateUser(authDetails, {
                onSuccess: (result) => resolve(result),
                onFailure: (err) => reject(err),
                newPasswordRequired: (userAttributes) => {
                    reject({ code: 'NewPasswordRequired', userAttributes });
                }
            });
        });
    }

    signOut() {
        const user = this.getCurrentUser();
        if (user) {
            user.signOut();
        }
    }

    // Google OAuth
    getGoogleSignInUrl() {
        const params = new URLSearchParams({
            client_id: poolData.ClientId,
            response_type: 'code',
            scope: 'email openid profile',
            redirect_uri: REDIRECT_URI,
            identity_provider: 'Google'
        });
        return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
    }

    signInWithGoogle() {
        window.location.href = this.getGoogleSignInUrl();
    }

    // Handle OAuth callback
    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) return null;

        try {
            const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: poolData.ClientId,
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            });

            const tokens = await response.json();

            // Clear the URL
            window.history.replaceState({}, document.title, window.location.pathname);

            return tokens;
        } catch (error) {
            console.error('OAuth callback error:', error);
            return null;
        }
    }
}

export const cognitoAuth = new CognitoAuthService();
export default cognitoAuth;
