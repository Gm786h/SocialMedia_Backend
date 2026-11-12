require('dotenv').config({ quiet: true });

const required = ['JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}
if (!process.env.DATABASE_URL && !process.env.DB_NAME) {
  throw new Error('Database is not configured. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Tables are created automatically on startup unless DB_SYNC=false.
  dbSync: process.env.DB_SYNC !== 'false',
  // Comma-separated list of allowed origins; "*" (default) allows any origin.
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
