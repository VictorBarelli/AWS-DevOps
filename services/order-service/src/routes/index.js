/**
 * Order Service Routes
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const orderRoutes = require('./orders');

router.use('/', healthRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
