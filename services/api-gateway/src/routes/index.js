/**
 * API Gateway Routes
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const proxyRoutes = require('./proxy');
const { authenticate } = require('../middleware/auth');

// Health check routes (no auth required)
router.use('/', healthRoutes);

// Proxy routes to downstream services
router.use('/api/auth', proxyRoutes.createProxy('AUTH_SERVICE_URL', false));
router.use('/api/users', authenticate, proxyRoutes.createProxy('USER_SERVICE_URL'));
router.use('/api/orders', authenticate, proxyRoutes.createProxy('ORDER_SERVICE_URL'));
router.use('/api/notifications', authenticate, proxyRoutes.createProxy('NOTIFICATION_SERVICE_URL'));

module.exports = router;
