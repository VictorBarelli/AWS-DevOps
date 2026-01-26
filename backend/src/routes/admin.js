const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stats
router.get('/stats', async (req, res) => {
    try {
        // Top 10 liked games
        const result = await pool.query(`
            SELECT game_name as name, COUNT(*) as count 
            FROM matches 
            GROUP BY game_name 
            ORDER BY count DESC 
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all matches from all users
router.get('/all-matches', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, u.name as user_name, u.email as user_email
            FROM matches m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all custom games
router.get('/custom-games', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cg.*, u.name as created_by_name
            FROM custom_games cg
            LEFT JOIN users u ON cg.created_by = u.id
            ORDER BY cg.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create custom game
router.post('/custom-games', async (req, res) => {
    try {
        const { name, image, genres, rating, description, released } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const result = await pool.query(`
            INSERT INTO custom_games (name, image, genres, rating, description, released, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, image || null, genres || [], rating || 4.0, description || null, released || null, req.user.id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete custom game
router.delete('/custom-games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM custom_games WHERE id = $1', [id]);
        res.json({ message: 'Jogo excluído' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
