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

// Get groups the current user is a member of
router.get('/user/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Getting groups for user:', userId);
        const result = await pool.query(`
            SELECT g.*, 
                   COUNT(gm2.user_id) as member_count
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
            LEFT JOIN group_members gm2 ON g.id = gm2.group_id
            GROUP BY g.id
            ORDER BY g.name
        `, [userId]);
        console.log('User groups found:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user groups:', err);
        res.status(500).json({ error: 'Error fetching user groups' });
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

// Get chat messages for a group
router.get('/:id/messages', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const result = await pool.query(`
            SELECT gm.*, u.name as user_name, u.email as user_email
            FROM group_messages gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY gm.created_at DESC
            LIMIT 100
        `, [groupId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Post a message to a group
router.post('/:id/messages', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await pool.query(
            'INSERT INTO group_messages (group_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
            [groupId, req.user.id, message.trim()]
        );

        // Get user info for response
        const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
        const response = {
            ...result.rows[0],
            user_name: userResult.rows[0]?.name,
            user_email: userResult.rows[0]?.email
        };

        res.status(201).json(response);
    } catch (err) {
        console.error('Error posting message:', err);
        res.status(500).json({ error: 'Error posting message' });
    }
});

// Get group reviews (for chat display)
router.get('/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const result = await pool.query(`
            SELECT r.*, u.name as user_name, u.email as user_email
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.group_id = $1
            ORDER BY r.created_at DESC
            LIMIT 50
        `, [groupId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching group reviews:', err);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Edit a message
router.put('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        // Check if user owns the message
        const checkResult = await pool.query(
            'SELECT * FROM group_messages WHERE id = $1 AND user_id = $2',
            [messageId, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }

        const result = await pool.query(
            'UPDATE group_messages SET message = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [message.trim(), messageId, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).json({ error: 'Error editing message' });
    }
});

// Delete a message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Check if user owns the message
        const checkResult = await pool.query(
            'SELECT * FROM group_messages WHERE id = $1 AND user_id = $2',
            [messageId, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        await pool.query('DELETE FROM group_messages WHERE id = $1', [messageId]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ error: 'Error deleting message' });
    }
});

module.exports = router;
