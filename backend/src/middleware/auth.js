const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { pool } = require('../db');

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID,
});

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const payload = await verifier.verify(token);

        console.log('Token payload:', JSON.stringify(payload, null, 2));

        const email = payload.email ||
            payload['cognito:username'] ||
            payload.identities?.[0]?.userId ||
            payload.sub;

        if (!email) {
            console.error('No email found in token payload:', payload);
            return res.status(403).json({ error: 'No email in token' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        } else {
            const newUser = await pool.query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, 'cognito_oauth_user', 'user') RETURNING *",
                [email]
            );
            req.user = newUser.rows[0];
            console.log(`Created new user in DB: ${email}`);
        }

        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({ error: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

module.exports = { authenticateToken, requireAdmin };
