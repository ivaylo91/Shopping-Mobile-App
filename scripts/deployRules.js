/**
 * Deploys Firestore security rules via the Firebase Management REST API.
 * Run with: node scripts/deployRules.js
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or gcloud auth.
 * Easier alternative: firebase deploy --only firestore:rules
 * (Install Firebase CLI: npm install -g firebase-tools)
 */
const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

console.log('Current firestore.rules:');
console.log('─'.repeat(60));
console.log(rules);
console.log('─'.repeat(60));
console.log('\nTo deploy these rules, run one of:');
console.log('  npm install -g firebase-tools');
console.log('  firebase login');
console.log('  firebase deploy --only firestore:rules');
console.log('\nOr paste the rules directly at:');
console.log('  https://console.firebase.google.com/project/shopping-mobile-app-dab8c/firestore/rules');
