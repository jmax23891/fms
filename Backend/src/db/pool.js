const fs = require('node:fs');
const { Pool } = require('pg');
const env = require('../config/env');

let ssl;

if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_CA_CERT_PATH) {
        throw new Error('DATABASE_CA_CERT_PATH is required in production');
    }

    ssl = {
        ca: fs.readFileSync(env.DATABASE_CA_CERT_PATH, 'utf8'),
        rejectUnauthorized: true
    };
}

const connectionString = new URL(process.env.DATABASE_URL);

// Ensure the explicit CA configuration is used.
connectionString.searchParams.delete('sslmode');
connectionString.searchParams.delete('sslrootcert');
connectionString.searchParams.delete('sslcert');
connectionString.searchParams.delete('sslkey');

const pool = new Pool({
    connectionString: connectionString.toString(),
    ssl,
    max: 10,
    idleTimeoutMillis: 30000
});

pool.on('error', err => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;