const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT g.*, 
                   COUNT(gm.user_id) as member_count
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            GROUP BY g.id
            ORDER BY g.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'Error fetching groups' });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const groupResult = await pool.query(
            'SELECT * FROM groups WHERE slug = $1',
            [slug]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const group = groupResult.rows[0];

        const reviewsResult = await pool.query(`
            SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.group_id = $1
            ORDER BY r.created_at DESC
            LIMIT 50
        `, [group.id]);

        const memberResult = await pool.query(
            'SELECT COUNT(*) FROM group_members WHERE group_id = $1',
            [group.id]
        );

        res.json({
            ...group,
            reviews: reviewsResult.rows,
            memberCount: parseInt(memberResult.rows[0].count)
        });
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).json({ error: 'Error fetching group' });
    }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        await pool.query(`
            INSERT INTO group_members (group_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (group_id, user_id) DO NOTHING
        `, [groupId, userId]);

        await pool.query(`
            UPDATE groups 
            SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1)
            WHERE id = $1
        `, [groupId]);

        res.json({ message: 'Joined group successfully' });
    } catch (err) {
        console.error('Error joining group:', err);
        res.status(500).json({ error: 'Error joining group' });
    }
});

router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        await pool.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, userId]
        );

        await pool.query(`
            UPDATE groups 
            SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1)
            WHERE id = $1
        `, [groupId]);

        res.json({ message: 'Left group successfully' });
    } catch (err) {
        console.error('Error leaving group:', err);
        res.status(500).json({ error: 'Error leaving group' });
    }
});

router.get('/user/my', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT g.*
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = $1
            ORDER BY gm.joined_at DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user groups:', err);
        res.status(500).json({ error: 'Error fetching groups' });
    }
});

router.post('/:id/review', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const { game_id, game_name, game_image, rating, comment } = req.body;

        if (!game_id || !game_name || !rating) {
            return res.status(400).json({ error: 'game_id, game_name, and rating are required' });
        }

        const memberCheck = await pool.query(
            'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.user.id]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You must join the group first' });
        }

        const result = await pool.query(`
            INSERT INTO reviews (user_id, game_id, game_name, game_image, rating, comment, is_public, group_id)
            VALUES ($1, $2, $3, $4, $5, $6, true, $7)
            ON CONFLICT (user_id, game_id) 
            DO UPDATE SET rating = $5, comment = $6, group_id = $7, updated_at = NOW()
            RETURNING *
        `, [req.user.id, game_id, game_name, game_image, rating, comment, groupId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error posting group review:', err);
        res.status(500).json({ error: 'Error posting review' });
    }
});

module.exports = router;
