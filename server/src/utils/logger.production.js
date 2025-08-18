const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for structured logging
const structuredFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const logEntry = {
            timestamp,
            level,
            message,
            service: service || 'xiaomi-unlock-server',
            ...meta
        };
        return JSON.stringify(logEntry);
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${service || 'xiaomi-unlock-server'}] ${level}: ${message} ${metaStr}`;
    })
);

// Daily rotate file transport configuration
const dailyRotateFileOptions = {
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    auditFile: path.join(logDir, '.audit.json'),
    format: structuredFormat
};

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: structuredFormat,
    defaultMeta: {
        service: 'xiaomi-unlock-server',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.API_VERSION || 'v1'
    },
    transports: [
        // Error logs
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'error-%DATE%.log'),
            level: 'error'
        }),

        // Combined logs
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'combined-%DATE%.log')
        }),

        // Access logs (for HTTP requests)
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'access-%DATE%.log'),
            level: 'http'
        }),

        // Security logs
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'security-%DATE%.log'),
            level: 'warn'
        })
    ],

    // Handle exceptions and rejections
    exceptionHandlers: [
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'exceptions-%DATE%.log')
        })
    ],

    rejectionHandlers: [
        new DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, 'rejections-%DATE%.log')
        })
    ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
} else {
    // In production, only log errors to console
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'error'
    }));
}

// Add custom logging methods
logger.security = (message, meta = {}) => {
    logger.warn(message, {...meta, category: 'security' });
};

logger.performance = (message, meta = {}) => {
    logger.info(message, {...meta, category: 'performance' });
};

logger.audit = (message, meta = {}) => {
    logger.info(message, {...meta, category: 'audit' });
};

// Performance monitoring
logger.startTimer = (label) => {
    const start = Date.now();
    return {
        done: (message, meta = {}) => {
            const duration = Date.now() - start;
            logger.performance(message || `${label} completed`, {
                ...meta,
                duration: `${duration}ms`,
                label
            });
        }
    };
};

module.exports = logger;