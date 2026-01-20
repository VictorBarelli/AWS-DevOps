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

        // Fetch user from DB to get role
        // We use the 'sub' claim as the stable ID, which matches 'id' in our users table if we are using UUIDs?
        // Wait, our users table uses SERIAL integer IDs.
        // But Cognito uses UUIDs.
        // We need to map Cognito subject (UUID) to our user.
        // In previous Supabase migration, we might have been using UUIDs?
        // Let's check db.js again.
        // db.js says `id SERIAL PRIMARY KEY`.
        // This is a problem. Cognito IDs are strings (UUIDs).
        // We need to either change `id` to TEXT/UUID or add a `cognito_id` column.
        // OR, we look up by Email.

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [payload.email]);

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        } else {
            // User from Cognito not in DB yet.
            // For now, treat as guest/user.
            req.user = {
                email: payload.email,
                role: 'user',
                cognito_sub: payload.sub
            };
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
