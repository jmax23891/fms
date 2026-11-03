
const fs = require('node:fs');
const { Pool } = require('pg');
const env = require('../config/env');

let ssl;

if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_CA_CERT_PATH) {
        throw new Error(
            'DATABASE_CA_CERT_PATH is required in production'
        );
    }

    ssl = {
        ca: fs.readFileSync(
            env.DATABASE_CA_CERT_PATH,
            'utf8'
        ),
        rejectUnauthorized: true
    };
}

const connectionUrl = new URL(env.DATABASE_URL);

// Prevent connection-string SSL options from overriding
// our explicitly configured CA certificate.
[
    'sslmode',
    'sslrootcert',
    'sslcert',
    'sslkey'
].forEach(key => connectionUrl.searchParams.delete(key));

const pool = new Pool({
    connectionString: connectionUrl.toString(),
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', err => {
    console.error(
        'Unexpected PostgreSQL pool error:',
        err.message
    );
});

module.exports = pool;
