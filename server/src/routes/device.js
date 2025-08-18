const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Device = require('../models/Device');
const logger = require('../utils/logger');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/device/register
 * @desc    Register a new device
 * @access  Public (with HMAC validation)
 */
router.post('/register', [
    body('deviceId').isLength({ min: 1 }).withMessage('Device ID is required'),
    body('serialNumber').isLength({ min: 1 }).withMessage('Serial number is required'),
    body('chipset').isIn(['qualcomm', 'mediatek', 'xiaomi']).withMessage('Invalid chipset'),
    body('mode').isIn(['edl', 'brom', 'mi_assistant']).withMessage('Invalid device mode'),
    body('bootloader').optional().isString(),
    body('hardwareId').optional().isString(),
    body('manufacturer').optional().isString(),
    body('model').optional().isString(),
    body('androidVersion').optional().isString()
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const deviceData = {
        ...req.body,
        clientId: req.clientId
    };

    try {
        // Development mode - skip database operations
        if (process.env.NODE_ENV === 'development' && !process.env.DB_HOST) {
            logger.info('Running in development mode without database');

            const mockDevice = {
                id: Date.now(),
                device_id: deviceData.deviceId,
                serial_number: deviceData.serialNumber,
                chipset: deviceData.chipset,
                mode: deviceData.mode,
                client_id: req.clientId,
                created_at: new Date(),
                updated_at: new Date()
            };

            logger.info('Mock device created', {
                deviceId: mockDevice.device_id,
                clientId: req.clientId
            });

            return res.status(201).json({
                success: true,
                device: mockDevice,
                message: 'Device registered successfully (development mode)'
            });
        }

        // Production mode - use database
        const existingDevice = await Device.findByDeviceId(deviceData.deviceId);

        if (existingDevice) {
            const updatedDevice = await Device.updateLastSeen(deviceData.deviceId);
            logger.info('Device already registered, updated last seen', {
                deviceId: deviceData.deviceId,
                clientId: req.clientId
            });

            return res.json({
                success: true,
                device: updatedDevice,
                message: 'Device already registered'
            });
        }

        const device = await Device.create(deviceData);
        logger.info('New device registered', {
            deviceId: device.device_id,
            serialNumber: device.serial_number,
            chipset: device.chipset,
            mode: device.mode,
            clientId: req.clientId
        });

        res.status(201).json({
            success: true,
            device: device,
            message: 'Device registered successfully'
        });

    } catch (error) {
        logger.error('Error registering device:', error);
        throw createError('Failed to register device', 500);
    }
}));

/**
 * @route   GET /api/device/:deviceId
 * @desc    Get device information
 * @access  Public (with HMAC validation)
 */
router.get('/:deviceId', asyncHandler(async(req, res) => {
    const { deviceId } = req.params;

    try {
        const device = await Device.findByDeviceId(deviceId);

        if (!device) {
            throw createError('Device not found', 404);
        }

        // Only return device if it belongs to the requesting client
        if (device.client_id !== req.clientId) {
            throw createError('Device not found', 404);
        }

        res.json({
            success: true,
            device: device
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error getting device:', error);
        throw createError('Failed to get device information', 500);
    }
}));

/**
 * @route   GET /api/device/serial/:serialNumber
 * @desc    Get device by serial number
 * @access  Public (with HMAC validation)
 */
router.get('/serial/:serialNumber', asyncHandler(async(req, res) => {
    const { serialNumber } = req.params;

    try {
        const device = await Device.findBySerialNumber(serialNumber);

        if (!device) {
            throw createError('Device not found', 404);
        }

        // Only return device if it belongs to the requesting client
        if (device.client_id !== req.clientId) {
            throw createError('Device not found', 404);
        }

        res.json({
            success: true,
            device: device
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error getting device by serial:', error);
        throw createError('Failed to get device information', 500);
    }
}));

/**
 * @route   GET /api/device
 * @desc    Get devices for client
 * @access  Public (with HMAC validation)
 */
router.get('/', [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const devices = await Device.getDevicesByClient(req.clientId, limit, offset);

        res.json({
            success: true,
            devices: devices,
            pagination: {
                limit: limit,
                offset: offset,
                count: devices.length
            }
        });

    } catch (error) {
        logger.error('Error getting client devices:', error);
        throw createError('Failed to get devices', 500);
    }
}));

/**
 * @route   PUT /api/device/:deviceId/ping
 * @desc    Update device last seen timestamp
 * @access  Public (with HMAC validation)
 */
router.put('/:deviceId/ping', asyncHandler(async(req, res) => {
    const { deviceId } = req.params;

    try {
        const device = await Device.findByDeviceId(deviceId);

        if (!device) {
            throw createError('Device not found', 404);
        }

        if (device.client_id !== req.clientId) {
            throw createError('Device not found', 404);
        }

        const updatedDevice = await Device.updateLastSeen(deviceId);

        res.json({
            success: true,
            device: updatedDevice,
            message: 'Device ping updated'
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error updating device ping:', error);
        throw createError('Failed to update device', 500);
    }
}));

/**
 * @route   GET /api/device/stats/summary
 * @desc    Get device statistics (admin endpoint)
 * @access  Public (with HMAC validation)
 */
router.get('/stats/summary', asyncHandler(async(req, res) => {
    try {
        const stats = await Device.getDeviceStats();

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        logger.error('Error getting device stats:', error);
        throw createError('Failed to get device statistics', 500);
    }
}));

module.exports = router;