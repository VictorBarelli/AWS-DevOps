const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all public reviews (community feed)
router.get('/feed', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.is_public = true
            ORDER BY r.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM reviews WHERE is_public = true'
        );

        res.json({
            reviews: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            totalPages: Math.ceil(countResult.rows[0].count / limit)
        });
    } catch (err) {
        console.error('Error fetching reviews feed:', err);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Get reviews for a specific game
router.get('/game/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const result = await pool.query(`
            SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.game_id = $1 AND r.is_public = true
            ORDER BY r.created_at DESC
        `, [gameId]);

        // Calculate average rating
        const avgResult = await pool.query(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as count
            FROM reviews WHERE game_id = $1 AND is_public = true
        `, [gameId]);

        res.json({
            reviews: result.rows,
            averageRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
            totalReviews: parseInt(avgResult.rows[0].count)
        });
    } catch (err) {
        console.error('Error fetching game reviews:', err);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Get user's own reviews
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM reviews
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Create or update a review
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { game_id, game_name, game_image, rating, comment, is_public = true } = req.body;

        if (!game_id || !game_name || !rating) {
            return res.status(400).json({ error: 'game_id, game_name, and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Upsert - insert or update if exists
        const result = await pool.query(`
            INSERT INTO reviews (user_id, game_id, game_name, game_image, rating, comment, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, game_id) 
            DO UPDATE SET rating = $5, comment = $6, is_public = $7, updated_at = NOW()
            RETURNING *
        `, [req.user.id, game_id, game_name, game_image, rating, comment, is_public]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating review:', err);
        res.status(500).json({ error: 'Error creating review' });
    }
});

// Delete a review
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or not authorized' });
        }

        res.json({ message: 'Review deleted' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Error deleting review' });
    }
});

module.exports = router;
