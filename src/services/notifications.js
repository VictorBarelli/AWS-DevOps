import api from './api';

const VAPID_PUBLIC_KEY = 'BGVYomEA5oGAhFoXcJ-heXZ3Kv-UGhdCazzmzWJbFmvxcHgvnl2M6zVG_5aoa61vnei1gTwkZg87XrhqGUA8eQI';

/**
 * Converts VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        throw new Error('This browser does not support desktop notification');
    }

    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Permission not granted for Notification');
    }
    return permission;
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    });

    console.log('📌 Push Subscription:', JSON.stringify(subscription));

    // Send subscription to backend
    await api.post('/notifications/subscribe', { subscription });

    return subscription;
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeFromPushNotifications() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
        // Optionally notify backend to remove subscription
    }
}

/**
 * Check if user is already subscribed
 */
export async function checkSubscriptionStatus() {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return !!subscription;
}
