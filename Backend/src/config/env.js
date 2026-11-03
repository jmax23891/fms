
const { z } = require('zod');

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1),

    // Aiven PostgreSQL CA certificate path
    DATABASE_CA_CERT_PATH: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(32),

    ACCESS_TOKEN_TTL: z.string().default('15m'),

    REFRESH_TOKEN_DAYS: z.coerce.number()
        .int()
        .min(1)
        .max(60)
        .default(14),

    INVITATION_PEPPER: z.string().min(24),

    CORS_ORIGIN: z.string()
        .default('http://localhost:5500'),

    COOKIE_NAME: z.string().default('sfs_refresh'),

    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none'])
        .default('lax'),

    COOKIE_SECURE: z.enum(['true', 'false'])
        .default('false')
        .transform(v => v === 'true'),

    SEED_DEPARTMENT_NAME: z.string().default('General')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        'Invalid environment configuration:',
        parsed.error.flatten().fieldErrors
    );

    process.exit(1);
}

module.exports = parsed.data;
