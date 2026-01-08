/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();

const startTime = Date.now();

/**
 * Liveness probe - is the service running?
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000)
    });
});

/**
 * Readiness probe - is the service ready to accept traffic?
 */
router.get('/ready', async (req, res) => {
    const checks = {
        auth: await checkService(process.env.AUTH_SERVICE_URL),
        user: await checkService(process.env.USER_SERVICE_URL),
        order: await checkService(process.env.ORDER_SERVICE_URL),
        notification: await checkService(process.env.NOTIFICATION_SERVICE_URL)
    };

    const allHealthy = Object.values(checks).every(c => c.status === 'up');

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ready' : 'degraded',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        dependencies: checks
    });
});

/**
 * Check if a downstream service is healthy
 */
async function checkService(url) {
    if (!url) {
        return { status: 'unknown', message: 'URL not configured' };
    }

    try {
        const axios = require('axios');
        const response = await axios.get(`${url}/health`, { timeout: 2000 });
        return { status: 'up', latency: response.headers['x-response-time'] };
    } catch (error) {
        return { status: 'down', error: error.message };
    }
}

module.exports = router;
