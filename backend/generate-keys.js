const webpush = require('web-push');

// VAPID keys should be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();

console.log(JSON.stringify(vapidKeys, null, 2));
