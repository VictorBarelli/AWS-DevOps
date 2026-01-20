// AWS Cognito Authentication Service
const COGNITO_DOMAIN = 'gameswipe-auth.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '2ubtd7k3usq2p5fr5gbtssqho1';
const REDIRECT_URI = window.location.origin;

export const cognitoAuth = {
    // Sign in with Google OAuth
    signInWithGoogle() {
        const authUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?` +
            `client_id=${CLIENT_ID}&` +
            `response_type=code&` +
            `scope=email+openid+profile&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `identity_provider=Google`;

        window.location.href = authUrl;
    },

    // Exchange authorization code for tokens
    async exchangeCodeForTokens(code) {
        const tokenUrl = `https://${COGNITO_DOMAIN}/oauth2/token`;

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await response.json();

        // Store tokens
        localStorage.setItem('cognito_id_token', tokens.id_token);
        localStorage.setItem('cognito_access_token', tokens.access_token);
        if (tokens.refresh_token) {
            localStorage.setItem('cognito_refresh_token', tokens.refresh_token);
        }

        return tokens;
    },

    // Get stored ID token
    getStoredToken() {
        return localStorage.getItem('cognito_id_token');
    },

    // Decode JWT token to get user info
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    },

    // Get current user from stored token
    getCurrentUser() {
        const token = this.getStoredToken();
        if (!token) return null;

        const decoded = this.decodeToken(token);
        if (!decoded) return null;

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
            this.signOut();
            return null;
        }

        return {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || decoded.email?.split('@')[0],
            picture: decoded.picture
        };
    },

    // Sign out
    signOut() {
        localStorage.removeItem('cognito_id_token');
        localStorage.removeItem('cognito_access_token');
        localStorage.removeItem('cognito_refresh_token');

        // Optionally redirect to Cognito logout
        // window.location.href = `https://${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
    },

    // Check for OAuth callback code in URL
    getAuthCodeFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('code');
    },

    // Clear URL parameters after processing
    clearUrlParams() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

export default cognitoAuth;
