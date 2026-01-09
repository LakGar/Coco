/**
 * Apple Client Secret Generator
 * 
 * This script generates a JWT token that serves as the Apple Client Secret.
 * Run this script to generate a new secret (it expires after 6 months).
 * 
 * Usage:
 * node utils/supabase/apple-secret-generator.js
 * 
 * You'll need:
 * - Your Team ID (from Apple Developer Portal)
 * - Your Key ID (from the key you created)
 * - Your .p8 key file path
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Replace these with your actual values
const TEAM_ID = 'YOUR_TEAM_ID'; // Found in Apple Developer Portal > Membership
const KEY_ID = 'YOUR_KEY_ID'; // Found in the key you created
const KEY_FILE_PATH = './path/to/your/AuthKey_XXXXXXXX.p8'; // Path to your downloaded .p8 file
const CLIENT_ID = 'com.yourcompany.coco.web'; // Your Services ID

// Read the private key
const privateKey = fs.readFileSync(path.resolve(KEY_FILE_PATH), 'utf8');

// Create the JWT payload
const payload = {
  iss: TEAM_ID,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months from now
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
};

// Sign the JWT
const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  keyid: KEY_ID,
});

console.log('\n=== Apple Client Secret ===');
console.log(token);
console.log('\n=== Configuration ===');
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Team ID: ${TEAM_ID}`);
console.log(`Key ID: ${KEY_ID}`);
console.log('\nCopy the token above and use it as your Client Secret in Supabase.');
console.log('Note: This secret expires in 6 months. You\'ll need to regenerate it.');

