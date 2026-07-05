const webpush = require('web-push');

console.log('Generating VAPID Keys...\n');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('========================================================================');
console.log('PUBLIC KEY:');
console.log(vapidKeys.publicKey);
console.log('========================================================================');
console.log('PRIVATE KEY:');
console.log(vapidKeys.privateKey);
console.log('========================================================================\n');
console.log('Add the following to your .env.local file and Vercel Environment Variables:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('VAPID_SUBJECT="mailto:contact@nur-e-qulb.com"');
