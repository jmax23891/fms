const { Pool } = require('pg');
const env = require('../config/env');
const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined, max: 10, idleTimeoutMillis: 30000 });
pool.on('error', err => console.error('Unexpected PostgreSQL pool error:', err.message));
module.exports = pool;
