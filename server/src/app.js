const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./utils/database');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/device');
const unlockRoutes = require('./routes/unlock');
const { errorHandler } = require('./middleware/errorHandler');
const { validateHMAC } = require('./middleware/hmacValidator');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS ?.split(','):true,
    credentials: true
}));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Number of requests
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // Per 15 minutes (in seconds)
});

const rateLimiterMiddleware = async(req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
        });
    }
};

app.use(rateLimiterMiddleware);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HMAC validation for all API routes
app.use('/api', validateHMAC);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || 'v1'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/unlock', unlockRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
    try {
        await database.connect();
        logger.info('Database connected successfully');

        app.listen(PORT, () => {
            logger.info(`Xiaomi Unlock Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async() => {
    logger.info('SIGTERM received, shutting down gracefully');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGINT', async() => {
    logger.info('SIGINT received, shutting down gracefully');
    await database.disconnect();
    process.exit(0);
});

startServer();

module.exports = app;