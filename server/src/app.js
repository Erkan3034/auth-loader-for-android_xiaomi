const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./utils/database');
const security = require('./middleware/security');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/device');
const unlockRoutes = require('./routes/unlock');
const { errorHandler } = require('./middleware/errorHandler');
const { validateHMAC } = require('./middleware/hmacValidator');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (important for production behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(security.getHelmetConfig());
app.use(compression());
app.use(hpp()); // HTTP Parameter Pollution protection
app.use(mongoSanitize()); // NoSQL injection protection

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ?
        (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false) : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'X-Timestamp', 'X-Signature'],
    maxAge: 86400 // 24 hours
}));

// Rate limiting
app.use(security.globalRateLimit());
app.use('/api', security.apiRateLimit());
app.use('/api/auth', security.authRateLimit());

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

// Test endpoint for debugging
app.get('/test', (req, res) => {
    res.json({
        message: 'Test endpoint working',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        method: req.method,
        path: req.path
    });
});

// Simple device register test (without database)
app.post('/api/device/test-register', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Test device registration successful',
            data: req.body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Test registration failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Simple device register endpoint (bypassing all middleware)
app.post('/api/device/simple-register', (req, res) => {
    try {
        const deviceData = {
            id: Date.now(),
            device_id: req.body.deviceId || 'test-device',
            serial_number: req.body.serialNumber || 'TEST123',
            chipset: req.body.chipset || 'qualcomm',
            mode: req.body.mode || 'edl',
            client_id: 'test-client',
            created_at: new Date(),
            updated_at: new Date()
        };

        res.status(201).json({
            success: true,
            message: 'Device registered successfully (simple endpoint)',
            device: deviceData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Simple registration failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
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