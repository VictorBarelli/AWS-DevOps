/**
 * Order Routes - CRUD with DynamoDB
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const dynamodb = require('../utils/dynamodb');
const logger = require('../utils/logger');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'oracle-devops-dev-orders';

// =============================================================================
// Helper Functions
// =============================================================================

function getUserId(req) {
    return req.headers['x-user-id'];
}

// =============================================================================
// Routes
// =============================================================================

/**
 * Create new order
 */
router.post('/', async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User ID required' });
        }

        const { items, shipping_address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Bad Request', message: 'Items are required' });
        }

        // Calculate total
        const total = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const order = {
            order_id: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
            created_at: new Date().toISOString(),
            user_id: userId,
            status: 'pending',
            items: items,
            total: Math.round(total * 100) / 100,
            shipping_address: shipping_address || {},
            updated_at: new Date().toISOString()
        };

        await dynamodb.putItem(TABLE_NAME, order);

        logger.info(`Order created: ${order.order_id}`);

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
});

/**
 * Get order by ID
 */
router.get('/:orderId', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = getUserId(req);

        const orders = await dynamodb.queryByOrderId(TABLE_NAME, orderId);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        }

        const order = orders[0];

        // Check ownership
        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
});

/**
 * Get orders for current user
 */
router.get('/', async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User ID required' });
        }

        const orders = await dynamodb.queryByUserId(TABLE_NAME, userId);

        res.json({
            orders: orders || [],
            count: orders ? orders.length : 0
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Update order status
 */
router.patch('/:orderId', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = getUserId(req);

        // Valid statuses
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Get existing order
        const orders = await dynamodb.queryByOrderId(TABLE_NAME, orderId);
        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        }

        const order = orders[0];

        // Check ownership
        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        // Update
        const updatedOrder = await dynamodb.updateItem(TABLE_NAME, {
            order_id: orderId,
            created_at: order.created_at
        }, {
            status: status,
            updated_at: new Date().toISOString()
        });

        logger.info(`Order updated: ${orderId} -> ${status}`);

        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
});

/**
 * Cancel order
 */
router.delete('/:orderId', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = getUserId(req);

        // Get existing order
        const orders = await dynamodb.queryByOrderId(TABLE_NAME, orderId);
        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        }

        const order = orders[0];

        // Check ownership
        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        // Can only cancel pending/confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Can only cancel pending or confirmed orders'
            });
        }

        // Soft cancel
        await dynamodb.updateItem(TABLE_NAME, {
            order_id: orderId,
            created_at: order.created_at
        }, {
            status: 'cancelled',
            updated_at: new Date().toISOString()
        });

        logger.info(`Order cancelled: ${orderId}`);

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
