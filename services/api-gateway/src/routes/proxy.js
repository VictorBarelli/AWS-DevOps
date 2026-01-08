/**
 * Proxy Routes - Forward requests to downstream services
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Create a proxy middleware for a downstream service
 */
function createProxy(serviceEnvVar, requiresAuth = true) {
    return async (req, res, next) => {
        const serviceUrl = process.env[serviceEnvVar];

        if (!serviceUrl) {
            logger.error(`Service URL not configured: ${serviceEnvVar}`);
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'Downstream service not configured'
            });
        }

        try {
            // Build the target URL
            const targetPath = req.originalUrl.replace(/^\/api\/[^/]+/, '');
            const targetUrl = `${serviceUrl}${targetPath || '/'}`;

            logger.info(`Proxying ${req.method} ${req.originalUrl} -> ${targetUrl}`);

            // Forward the request
            const response = await axios({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': req.requestId,
                    'X-Forwarded-For': req.ip,
                    ...(req.user && { 'X-User-ID': req.user.sub })
                },
                timeout: 30000,
                validateStatus: () => true // Don't throw on non-2xx
            });

            // Forward response headers
            if (response.headers['content-type']) {
                res.set('Content-Type', response.headers['content-type']);
            }

            res.status(response.status).send(response.data);

        } catch (error) {
            logger.error(`Proxy error: ${error.message}`);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'Service unavailable',
                    message: 'Unable to connect to downstream service'
                });
            }

            if (error.code === 'ETIMEDOUT') {
                return res.status(504).json({
                    error: 'Gateway timeout',
                    message: 'Downstream service did not respond in time'
                });
            }

            next(error);
        }
    };
}

module.exports = { createProxy };
