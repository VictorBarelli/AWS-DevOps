/**
 * Error Handling Middleware
 */

const logger = require('../utils/logger');

/**
 * Handle 404 Not Found
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        requestId: req.requestId
    });
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        requestId: req.requestId,
        path: req.originalUrl,
        method: req.method
    });

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: isDev ? err.message : 'An unexpected error occurred',
        requestId: req.requestId,
        ...(isDev && { stack: err.stack })
    });
}

module.exports = { notFoundHandler, errorHandler };
