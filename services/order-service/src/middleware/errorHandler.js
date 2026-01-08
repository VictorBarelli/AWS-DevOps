/**
 * Error Handler Middleware
 */

const logger = require('../utils/logger');

function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
}

function errorHandler(err, req, res, next) {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
}

module.exports = { notFoundHandler, errorHandler };
