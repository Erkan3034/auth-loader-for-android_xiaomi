const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

class SecurityMiddleware {
    constructor() {
        this.setupRateLimiting();
        this.setupSlowDown();
    }

    // Enhanced Helmet configuration
    getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true,
            referrerPolicy: { policy: 'same-origin' }
        });
    }

    // Advanced rate limiting
    setupRateLimiting() {
        // Global rate limiter
        this.globalLimiter = new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
            blockDuration: 900, // Block for 15 minutes
        });

        // API specific rate limiter (stricter)
        this.apiLimiter = new RateLimiterMemory({
            keyGenerator: (req) => `${req.ip}:${req.path}`,
            points: 20, // 20 requests
            duration: 60, // per minute
            blockDuration: 300, // Block for 5 minutes
        });

        // Auth endpoint limiter (very strict)
        this.authLimiter = new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 5, // 5 attempts
            duration: 900, // per 15 minutes
            blockDuration: 3600, // Block for 1 hour
        });
    }

    // Slow down repeated requests
    setupSlowDown() {
        this.speedLimiter = slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 50, // allow 50 requests per 15 minutes at full speed
            delayMs: 500, // slow down by 500ms per request after delayAfter
            maxDelayMs: 20000, // maximum delay of 20 seconds
        });
    }

    // Global rate limiting middleware
    globalRateLimit() {
        return async(req, res, next) => {
            try {
                await this.globalLimiter.consume(req.ip);
                next();
            } catch (rejRes) {
                logger.warn('Global rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    remainingPoints: rejRes.remainingPoints,
                    msBeforeNext: rejRes.msBeforeNext
                });

                res.status(429).json({
                    error: 'Too many requests from this IP, please try again later.',
                    retryAfter: Math.round(rejRes.msBeforeNext / 1000)
                });
            }
        };
    }

    // API specific rate limiting
    apiRateLimit() {
        return async(req, res, next) => {
            try {
                await this.apiLimiter.consume(`${req.ip}:${req.path}`);
                next();
            } catch (rejRes) {
                logger.warn('API rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    remainingPoints: rejRes.remainingPoints,
                    msBeforeNext: rejRes.msBeforeNext
                });

                res.status(429).json({
                    error: 'Too many API requests for this endpoint.',
                    retryAfter: Math.round(rejRes.msBeforeNext / 1000)
                });
            }
        };
    }

    // Auth endpoint rate limiting
    authRateLimit() {
        return async(req, res, next) => {
            try {
                await this.authLimiter.consume(req.ip);
                next();
            } catch (rejRes) {
                logger.warn('Auth rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    remainingPoints: rejRes.remainingPoints,
                    msBeforeNext: rejRes.msBeforeNext
                });

                res.status(429).json({
                    error: 'Too many authentication attempts. Account temporarily locked.',
                    retryAfter: Math.round(rejRes.msBeforeNext / 1000)
                });
            }
        };
    }

    // Request validation middleware
    validateRequest() {
        return (req, res, next) => {
            // Check for suspicious patterns
            const suspiciousPatterns = [
                /(<script|javascript:|vbscript:|onload=|onerror=)/i,
                /(union|select|insert|delete|drop|create|alter|exec)/i,
                /(\.\.|\/etc\/passwd|\/windows\/system32)/i
            ];

            const checkString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(checkString)) {
                    logger.warn('Suspicious request detected', {
                        ip: req.ip,
                        path: req.path,
                        userAgent: req.get('User-Agent'),
                        pattern: pattern.toString()
                    });

                    return res.status(400).json({
                        error: 'Invalid request format'
                    });
                }
            }

            next();
        };
    }

    // IP whitelist middleware (for admin endpoints)
    ipWhitelist(allowedIPs = []) {
        return (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress;

            if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
                logger.warn('Unauthorized IP access attempt', {
                    ip: clientIP,
                    path: req.path
                });

                return res.status(403).json({
                    error: 'Access denied from this IP address'
                });
            }

            next();
        };
    }

    // Request size limiter
    requestSizeLimiter(maxSize = '10mb') {
        return (req, res, next) => {
            const contentLength = parseInt(req.get('content-length'));
            const maxSizeBytes = this.parseSize(maxSize);

            if (contentLength && contentLength > maxSizeBytes) {
                logger.warn('Request size exceeded', {
                    ip: req.ip,
                    path: req.path,
                    size: contentLength,
                    maxSize: maxSizeBytes
                });

                return res.status(413).json({
                    error: 'Request entity too large'
                });
            }

            next();
        };
    }

    // Parse size string to bytes
    parseSize(sizeStr) {
        const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
        const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

        if (!match) return 0;

        const size = parseFloat(match[1]);
        const unit = match[2] || 'b';

        return Math.floor(size * units[unit]);
    }
}

module.exports = new SecurityMiddleware();