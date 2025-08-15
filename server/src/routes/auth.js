const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/auth/request-key
 * @desc    Request authentication key for device unlock
 * @access  Public (with HMAC validation)
 */
router.post('/request-key', [
    body('deviceInfo').isObject().withMessage('Device info is required'),
    body('deviceInfo.serialNumber').isLength({ min: 1 }).withMessage('Serial number is required'),
    body('deviceInfo.chipset').isIn(['qualcomm', 'mediatek', 'xiaomi']).withMessage('Invalid chipset'),
    body('deviceInfo.mode').isIn(['edl', 'brom', 'mi_assistant']).withMessage('Invalid device mode'),
    body('deviceInfo.deviceId').optional().isLength({ min: 1 }),
    body('deviceInfo.bootloader').optional().isString(),
    body('deviceInfo.manufacturer').optional().isString(),
    body('deviceInfo.model').optional().isString(),
    body('deviceInfo.androidVersion').optional().isString()
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { deviceInfo } = req.body;
    const clientId = req.clientId;

    // Generate device ID if not provided
    if (!deviceInfo.deviceId) {
        deviceInfo.deviceId = crypto.generateSecureRandom(16);
    }

    // Add client ID to device info
    deviceInfo.clientId = clientId;

    try {
        // Generate auth key
        const authKey = crypto.generateAuthKey(deviceInfo);

        // Generate device-specific bypass tokens
        let bypassTokens = {};

        switch (deviceInfo.mode) {
            case 'edl':
                if (deviceInfo.chipset === 'qualcomm') {
                    bypassTokens = crypto.generateXiaomiEDLBypass(deviceInfo);
                }
                break;
            case 'brom':
                if (deviceInfo.chipset === 'mediatek') {
                    bypassTokens = crypto.generateMTKBypass(deviceInfo);
                }
                break;
            case 'mi_assistant':
                bypassTokens = crypto.generateXiaomiEDLBypass(deviceInfo);
                break;
        }

        logger.info('Auth key requested', {
            deviceId: deviceInfo.deviceId,
            serialNumber: deviceInfo.serialNumber,
            chipset: deviceInfo.chipset,
            mode: deviceInfo.mode,
            clientId: clientId
        });

        res.json({
            success: true,
            authKey: authKey,
            deviceId: deviceInfo.deviceId,
            bypassTokens: bypassTokens,
            expiresIn: process.env.AUTH_KEY_EXPIRY || 300,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error generating auth key:', error);
        throw createError('Failed to generate authentication key', 500);
    }
}));

/**
 * @route   POST /api/auth/verify-key
 * @desc    Verify authentication key
 * @access  Public (with HMAC validation)
 */
router.post('/verify-key', [
    body('authKey').isLength({ min: 1 }).withMessage('Auth key is required'),
    body('deviceId').isLength({ min: 1 }).withMessage('Device ID is required')
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { authKey, deviceId } = req.body;

    try {
        // Verify the auth key
        const decoded = crypto.verifyAuthKey(authKey);

        // Check if the device ID matches
        if (decoded.deviceId !== deviceId) {
            throw createError('Device ID mismatch', 401);
        }

        logger.info('Auth key verified', {
            deviceId: deviceId,
            clientId: req.clientId
        });

        res.json({
            success: true,
            valid: true,
            deviceInfo: {
                deviceId: decoded.deviceId,
                serialNumber: decoded.serialNumber,
                chipset: decoded.chipset,
                mode: decoded.mode
            },
            expiresAt: new Date(decoded.exp * 1000).toISOString()
        });

    } catch (error) {
        logger.warn('Auth key verification failed:', {
            deviceId: deviceId,
            clientId: req.clientId,
            error: error.message
        });

        res.json({
            success: true,
            valid: false,
            reason: error.message
        });
    }
}));

/**
 * @route   POST /api/auth/refresh-key
 * @desc    Refresh authentication key
 * @access  Public (with HMAC validation)
 */
router.post('/refresh-key', [
    body('authKey').isLength({ min: 1 }).withMessage('Current auth key is required'),
    body('deviceId').isLength({ min: 1 }).withMessage('Device ID is required')
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { authKey, deviceId } = req.body;

    try {
        // Verify the current auth key
        const decoded = crypto.verifyAuthKey(authKey);

        if (decoded.deviceId !== deviceId) {
            throw createError('Device ID mismatch', 401);
        }

        // Generate new auth key with same device info
        const newAuthKey = crypto.generateAuthKey(decoded);

        logger.info('Auth key refreshed', {
            deviceId: deviceId,
            clientId: req.clientId
        });

        res.json({
            success: true,
            authKey: newAuthKey,
            expiresIn: process.env.AUTH_KEY_EXPIRY || 300,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error refreshing auth key:', error);
        throw createError('Failed to refresh authentication key', 401);
    }
}));

module.exports = router;