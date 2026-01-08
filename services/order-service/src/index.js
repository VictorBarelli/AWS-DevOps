/**
 * Order Service - Main Application
 * Express application for order management with DynamoDB
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestId } = require('./middleware/requestId');

const app = express();
const PORT = process.env.PORT || 8083;

// Security
app.use(helmet());
app.use(cors());

// Request processing
app.use(express.json());
app.use(requestId);
app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
}));

// Routes
app.use('/', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Order Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    server.close(() => process.exit(0));
});

module.exports = app;
