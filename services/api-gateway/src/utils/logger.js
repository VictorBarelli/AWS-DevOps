/**
 * Winston Logger Configuration
 */

const winston = require('winston');

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'api-gateway' },
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? logFormat
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
        })
    ]
});

module.exports = logger;
