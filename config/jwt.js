const crypto = require('crypto');

const configuredSecret = process.env.JWT_SECRET;
if (configuredSecret && (configuredSecret.length < 32 || /replace|placeholder|<|>/.test(configuredSecret))) {
  throw new Error('JWT_SECRET must be a private random value with at least 32 characters.');
}
if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured before running in production.');
}

if (!configuredSecret) {
  console.warn('⚠️ [Auth] JWT_SECRET is not configured; using an ephemeral development secret. Set a private secret in .env.');
}

module.exports = configuredSecret || crypto.randomBytes(32).toString('hex');
