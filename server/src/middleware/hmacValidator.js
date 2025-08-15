const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const { createError } = require('./errorHandler');

const validateHMAC = (req, res, next) => {
    try {
        // Skip HMAC validation for health check
        if (req.path === '/health') {
            return next();
        }

        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];
        const clientId = req.headers['x-client-id'];

        if (!signature || !timestamp || !clientId) {
            logger.warn('Missing required headers for HMAC validation', {
                ip: req.ip,
                path: req.path,
                headers: {
                    signature: !!signature,
                    timestamp: !!timestamp,
                    clientId: !!clientId
                }
            });
            throw createError('Missing required authentication headers', 401);
        }

        // Check timestamp to prevent replay attacks (5-minute window)
        const now = Math.floor(Date.now() / 1000);
        const requestTime = parseInt(timestamp);
        const timeDiff = Math.abs(now - requestTime);

        if (timeDiff > 300) { // 5 minutes
            logger.warn('Request timestamp outside valid window', {
                ip: req.ip,
                path: req.path,
                timeDiff: timeDiff
            });
            throw createError('Request timestamp outside valid window', 401);
        }

        // Prepare data for HMAC verification
        const method = req.method;
        const path = req.path;
        const body = req.method !== 'GET' ? JSON.stringify(req.body) : '';
        const dataToSign = `${method}${path}${body}${timestamp}${clientId}`;

        // Verify HMAC signature
        if (!crypto.verifyHMAC(dataToSign, signature)) {
            logger.warn('Invalid HMAC signature', {
                ip: req.ip,
                path: req.path,
                clientId: clientId
            });
            throw createError('Invalid request signature', 401);
        }

        // Add client info to request for downstream use
        req.clientId = clientId;
        req.requestTimestamp = requestTime;

        logger.debug('HMAC validation successful', {
            clientId: clientId,
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateHMAC
};