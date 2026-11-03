
const express = require('express');
const path = require('node:path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.disable('x-powered-by');

app.use(helmet({
    crossOriginResourcePolicy: {
        policy: 'cross-origin'
    }
}));

app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map(s => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token'
    ]
}));

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

// Login rate limiting
app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        error: {
            code: 'LOGIN_RATE_LIMIT',
            message: 'Too many unsuccessful sign-in attempts. Please wait 15 minutes before trying again.'
        }
    })
}));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'student-feedback-system-api'
    });
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api', require('./routes/directory.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/feedback', require('./routes/reply.routes'));
app.use('/api/replies', require('./routes/reply.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

// Serve frontend
app.use(express.static(
    path.join(__dirname, '../../Frontend')
));

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
