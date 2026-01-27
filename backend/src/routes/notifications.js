const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { sendNotification } = require('../services/pushService');
const auth = require('../middleware/auth');

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Save subscription to DB (upsert based on endpoint)
        const query = `
            INSERT INTO push_subscriptions (user_id, endpoint, keys)
            VALUES ($1, $2, $3)
            ON CONFLICT (endpoint) 
            DO UPDATE SET user_id = $1, keys = $3
            RETURNING id
        `;

        await pool.query(query, [userId, subscription.endpoint, JSON.stringify(subscription.keys)]);

        console.log(`User ${userId} subscribed to push notifications`);
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Send a test notification (Internal or Debug usage)
router.post('/test-push', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all subscriptions for this user
        const result = await pool.query(
            'SELECT * FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No subscriptions found for this user' });
        }

        const notificationPayload = {
            title: 'Test Notification',
            body: 'Isso é um teste de notificação do GameSwipe! 🎮',
            icon: '/icon-192x192.png',
            data: {
                url: '/'
            }
        };

        const promises = result.rows.map(sub => {
            const subscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };
            return sendNotification(subscription, notificationPayload);
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;

        res.json({
            message: `Sent ${successCount} notifications`,
            results
        });

    } catch (error) {
        console.error('Error sending test push:', error);
        res.status(500).json({ error: 'Failed to send test push' });
    }
});

module.exports = router;
