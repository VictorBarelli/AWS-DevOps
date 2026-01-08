/**
 * Request ID Middleware
 */

const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    res.set('X-Request-ID', req.requestId);
    next();
}

module.exports = { requestId };
