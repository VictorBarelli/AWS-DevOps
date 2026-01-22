const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM matches WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        const matches = result.rows.map(m => ({
            id: m.game_id,
            name: m.game_name,
            image: m.game_image,
            genres: m.game_genres,
            rating: parseFloat(m.game_rating),
            superLiked: m.super_liked
        }));

        res.json({ matches });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Failed to get matches' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { game } = req.body;

        if (!game || !game.id || !game.name) {
            return res.status(400).json({ error: 'Game data required' });
        }

        await pool.query(
            `INSERT INTO matches (user_id, game_id, game_name, game_image, game_genres, game_rating, super_liked)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, game_id) DO NOTHING`,
            [
                req.user.id,
                game.id,
                game.name,
                game.image,
                game.genres || [],
                game.rating || 0,
                game.superLiked || false
            ]
        );

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Save match error:', error);
        res.status(500).json({ error: 'Failed to save match' });
    }
});

router.delete('/:gameId', authenticateToken, async (req, res) => {
    try {
        const { gameId } = req.params;

        await pool.query(
            'DELETE FROM matches WHERE user_id = $1 AND game_id = $2',
            [req.user.id, gameId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete match error:', error);
        res.status(500).json({ error: 'Failed to delete match' });
    }
});

module.exports = router;
