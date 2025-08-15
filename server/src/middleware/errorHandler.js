const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Default error response
    let error = {
        message: 'Internal Server Error',
        status: 500
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error = {
            message: 'Validation Error',
            details: err.details,
            status: 400
        };
    } else if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Invalid token',
            status: 401
        };
    } else if (err.name === 'TokenExpiredError') {
        error = {
            message: 'Token expired',
            status: 401
        };
    } else if (err.code === '23505') { // PostgreSQL unique violation
        error = {
            message: 'Resource already exists',
            status: 409
        };
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        error = {
            message: 'Referenced resource not found',
            status: 400
        };
    } else if (err.status && err.message) {
        error = {
            message: err.message,
            status: err.status
        };
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && error.status === 500) {
        error.message = 'Internal Server Error';
        delete error.details;
    }

    res.status(error.status).json({
        error: error.message,
        ...(error.details && { details: error.details }),
        timestamp: new Date().toISOString(),
        path: req.path
    });
};

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const createError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

module.exports = {
    errorHandler,
    asyncHandler,
    createError
};