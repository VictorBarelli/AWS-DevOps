const webpush = require('web-push');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@gameswipe.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push initialized');
} else {
    console.warn('⚠️ Web Push NOT initialized: Missing VAPID keys');
}

/**
 * Send a push notification to a subscription
 * @param {Object} subscription - User subscription object
 * @param {Object} data - Notification data (title, body, etc.)
 */
const sendNotification = async (subscription, data) => {
    try {
        const payload = JSON.stringify(data);
        await webpush.sendNotification(subscription, payload);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendNotification
};
