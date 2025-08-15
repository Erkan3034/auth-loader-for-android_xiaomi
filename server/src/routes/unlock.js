const express = require('express');
const { body, query, validationResult } = require('express-validator');
const UnlockOperation = require('../models/UnlockOperation');
const Device = require('../models/Device');
const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/unlock/start
 * @desc    Start an unlock operation
 * @access  Public (with HMAC validation)
 */
router.post('/start', [
    body('deviceId').isLength({ min: 1 }).withMessage('Device ID is required'),
    body('authKey').isLength({ min: 1 }).withMessage('Auth key is required'),
    body('operationType').isIn(['frp_unlock', 'edl_bypass', 'bootloader_unlock', 'mi_unlock']).withMessage('Invalid operation type'),
    body('metadata').optional().isObject()
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { deviceId, authKey, operationType, metadata } = req.body;

    try {
        // Verify auth key
        const decoded = crypto.verifyAuthKey(authKey);

        if (decoded.deviceId !== deviceId) {
            throw createError('Device ID mismatch', 401);
        }

        // Check if device exists and belongs to client
        const device = await Device.findByDeviceId(deviceId);
        if (!device || device.client_id !== req.clientId) {
            throw createError('Device not found', 404);
        }

        // Create auth key hash for logging (don't store the actual key)
        const authKeyHash = crypto.generateHMAC(authKey);

        // Create unlock operation record
        const operation = await UnlockOperation.create({
            deviceId: deviceId,
            operationType: operationType,
            authKeyHash: authKeyHash,
            status: 'started',
            clientId: req.clientId,
            metadata: metadata || {}
        });

        // Update device last seen
        await Device.updateLastSeen(deviceId);

        logger.info('Unlock operation started', {
            operationId: operation.id,
            deviceId: deviceId,
            operationType: operationType,
            clientId: req.clientId
        });

        res.status(201).json({
            success: true,
            operation: {
                id: operation.id,
                deviceId: operation.device_id,
                operationType: operation.operation_type,
                status: operation.status,
                startedAt: operation.started_at
            },
            message: 'Unlock operation started'
        });

    } catch (error) {
        if (error.message.includes('Invalid or expired auth key')) {
            throw createError('Invalid or expired authentication key', 401);
        }
        logger.error('Error starting unlock operation:', error);
        throw createError('Failed to start unlock operation', 500);
    }
}));

/**
 * @route   PUT /api/unlock/:operationId/status
 * @desc    Update unlock operation status
 * @access  Public (with HMAC validation)
 */
router.put('/:operationId/status', [
    body('status').isIn(['in_progress', 'completed', 'failed']).withMessage('Invalid status'),
    body('errorMessage').optional().isString(),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('metadata').optional().isObject()
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { operationId } = req.params;
    const { status, errorMessage, progress, metadata } = req.body;

    try {
        // Find the operation
        const operation = await UnlockOperation.findById(operationId);

        if (!operation) {
            throw createError('Operation not found', 404);
        }

        if (operation.client_id !== req.clientId) {
            throw createError('Operation not found', 404);
        }

        // Update operation status
        const completedAt = (status === 'completed' || status === 'failed') ? new Date() : null;
        const updatedOperation = await UnlockOperation.updateStatus(
            operationId,
            status,
            errorMessage,
            completedAt
        );

        logger.info('Unlock operation status updated', {
            operationId: operationId,
            status: status,
            progress: progress,
            clientId: req.clientId
        });

        res.json({
            success: true,
            operation: {
                id: updatedOperation.id,
                deviceId: updatedOperation.device_id,
                operationType: updatedOperation.operation_type,
                status: updatedOperation.status,
                startedAt: updatedOperation.started_at,
                completedAt: updatedOperation.completed_at,
                errorMessage: updatedOperation.error_message
            },
            message: 'Operation status updated'
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error updating operation status:', error);
        throw createError('Failed to update operation status', 500);
    }
}));

/**
 * @route   GET /api/unlock/:operationId
 * @desc    Get unlock operation details
 * @access  Public (with HMAC validation)
 */
router.get('/:operationId', asyncHandler(async(req, res) => {
    const { operationId } = req.params;

    try {
        const operation = await UnlockOperation.findById(operationId);

        if (!operation) {
            throw createError('Operation not found', 404);
        }

        if (operation.client_id !== req.clientId) {
            throw createError('Operation not found', 404);
        }

        res.json({
            success: true,
            operation: {
                id: operation.id,
                deviceId: operation.device_id,
                operationType: operation.operation_type,
                status: operation.status,
                startedAt: operation.started_at,
                completedAt: operation.completed_at,
                errorMessage: operation.error_message,
                metadata: operation.metadata,
                device: {
                    serialNumber: operation.serial_number,
                    model: operation.model,
                    manufacturer: operation.manufacturer
                }
            }
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error getting operation:', error);
        throw createError('Failed to get operation details', 500);
    }
}));

/**
 * @route   GET /api/unlock/device/:deviceId
 * @desc    Get unlock operations for a device
 * @access  Public (with HMAC validation)
 */
router.get('/device/:deviceId', [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw createError('Validation failed', 400);
    }

    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Check if device belongs to client
        const device = await Device.findByDeviceId(deviceId);
        if (!device || device.client_id !== req.clientId) {
            throw createError('Device not found', 404);
        }

        const operations = await UnlockOperation.findByDeviceId(deviceId, limit);

        res.json({
            success: true,
            operations: operations.map(op => ({
                id: op.id,
                operationType: op.operation_type,
                status: op.status,
                startedAt: op.started_at,
                completedAt: op.completed_at,
                errorMessage: op.error_message
            })),
            deviceId: deviceId
        });

    } catch (error) {
        if (error.status === 404) {
            throw error;
        }
        logger.error('Error getting device operations:', error);
        throw createError('Failed to get device operations', 500);
    }
}));

/**
 * @route   GET /api/unlock/history
 * @desc    Get unlock operation history for client
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
        const operations = await UnlockOperation.getRecentOperations(req.clientId, limit, offset);

        res.json({
            success: true,
            operations: operations.map(op => ({
                id: op.id,
                deviceId: op.device_id,
                operationType: op.operation_type,
                status: op.status,
                startedAt: op.started_at,
                completedAt: op.completed_at,
                errorMessage: op.error_message,
                device: {
                    serialNumber: op.serial_number,
                    model: op.model,
                    manufacturer: op.manufacturer
                }
            })),
            pagination: {
                limit: limit,
                offset: offset,
                count: operations.length
            }
        });

    } catch (error) {
        logger.error('Error getting operation history:', error);
        throw createError('Failed to get operation history', 500);
    }
}));

/**
 * @route   GET /api/unlock/stats/summary
 * @desc    Get unlock operation statistics
 * @access  Public (with HMAC validation)
 */
router.get('/stats/summary', [
    query('timeframe').optional().isIn(['1 hour', '24 hours', '7 days', '30 days']).withMessage('Invalid timeframe')
], asyncHandler(async(req, res) => {
    const timeframe = req.query.timeframe || '24 hours';

    try {
        const stats = await UnlockOperation.getOperationStats(timeframe);

        res.json({
            success: true,
            stats: stats,
            timeframe: timeframe
        });

    } catch (error) {
        logger.error('Error getting operation stats:', error);
        throw createError('Failed to get operation statistics', 500);
    }
}));

module.exports = router;