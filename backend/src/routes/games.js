const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all custom games (public endpoint for the feed)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, image, genres, rating, description, released, created_at
            FROM custom_games
            ORDER BY created_at DESC
        `);

        // Format to match RAWG API format
        const games = result.rows.map(g => ({
            id: `custom_${g.id}`,
            name: g.name,
            image: g.image,
            rating: parseFloat(g.rating) || 4.0,
            genres: g.genres || [],
            released: g.released,
            isCustom: true
        }));

        res.json({ games });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
