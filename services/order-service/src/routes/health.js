/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const dynamodb = require('../utils/dynamodb');

const startTime = Date.now();

router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000)
    });
});

router.get('/ready', async (req, res) => {
    let dbStatus = 'unknown';

    try {
        await dynamodb.checkConnection();
        dbStatus = 'up';
    } catch (error) {
        dbStatus = `down: ${error.message}`;
    }

    const isReady = dbStatus === 'up';

    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not ready',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        dependencies: {
            dynamodb: dbStatus
        }
    });
});

module.exports = router;
