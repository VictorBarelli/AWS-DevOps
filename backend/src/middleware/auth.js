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

        const email = payload.email || payload['cognito:username'] || payload.sub;
        const name = payload.name || payload['cognito:username'] || 'User';

        if (!email) {
            console.error('No identifier found in token payload:', payload);
            return res.status(403).json({ error: 'No identifier in token' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            req.user = result.rows[0];

            // If we have a better name in the token, update the DB
            if (payload.name && req.user.name !== payload.name) {
                await pool.query('UPDATE users SET name = $1 WHERE id = $2', [payload.name, req.user.id]);
                req.user.name = payload.name;
                console.log(`Updated user name: ${payload.name}`);
            }
        } else {
            const newUser = await pool.query(
                "INSERT INTO users (email, password_hash, name, role) VALUES ($1, 'cognito_oauth_user', $2, 'user') RETURNING *",
                [email, name]
            );
            req.user = newUser.rows[0];
            console.log(`Created new user in DB: ${email} (${name})`);
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
