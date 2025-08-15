const database = require('../utils/database');
const logger = require('../utils/logger');

class UnlockOperation {
    static async create(operationData) {
        const query = `
            INSERT INTO unlock_operations (
                device_id, operation_type, auth_key_hash, status, 
                client_id, started_at, metadata
            ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
            RETURNING *
        `;

        const values = [
            operationData.deviceId,
            operationData.operationType,
            operationData.authKeyHash,
            operationData.status || 'started',
            operationData.clientId,
            operationData.metadata || {}
        ];

        try {
            const result = await database.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating unlock operation:', error);
            throw error;
        }
    }

    static async updateStatus(operationId, status, errorMessage = null, completedAt = null) {
        let query = 'UPDATE unlock_operations SET status = $1, updated_at = NOW()';
        const values = [status];
        let paramCount = 1;

        if (errorMessage) {
            paramCount++;
            query += `, error_message = $${paramCount}`;
            values.push(errorMessage);
        }

        if (completedAt || status === 'completed' || status === 'failed') {
            paramCount++;
            query += `, completed_at = $${paramCount}`;
            values.push(completedAt || new Date());
        }

        paramCount++;
        query += ` WHERE id = $${paramCount} RETURNING *`;
        values.push(operationId);

        try {
            const result = await database.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Error updating unlock operation status:', error);
            throw error;
        }
    }

    static async findById(operationId) {
        const query = `
            SELECT uo.*, d.serial_number, d.model, d.manufacturer
            FROM unlock_operations uo
            LEFT JOIN devices d ON uo.device_id = d.device_id
            WHERE uo.id = $1
        `;

        try {
            const result = await database.query(query, [operationId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error finding unlock operation by ID:', error);
            throw error;
        }
    }

    static async findByDeviceId(deviceId, limit = 10) {
        const query = `
            SELECT * FROM unlock_operations 
            WHERE device_id = $1 
            ORDER BY started_at DESC 
            LIMIT $2
        `;

        try {
            const result = await database.query(query, [deviceId, limit]);
            return result.rows;
        } catch (error) {
            logger.error('Error finding unlock operations by device ID:', error);
            throw error;
        }
    }

    static async getOperationStats(timeframe = '24 hours') {
        const query = `
            SELECT 
                COUNT(*) as total_operations,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN status = 'started' OR status = 'in_progress' THEN 1 END) as in_progress,
                operation_type,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
            FROM unlock_operations 
            WHERE started_at >= NOW() - INTERVAL '${timeframe}'
            GROUP BY operation_type
            ORDER BY total_operations DESC
        `;

        try {
            const result = await database.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Error getting operation stats:', error);
            throw error;
        }
    }

    static async getRecentOperations(clientId = null, limit = 50, offset = 0) {
        let query = `
            SELECT uo.*, d.serial_number, d.model, d.manufacturer
            FROM unlock_operations uo
            LEFT JOIN devices d ON uo.device_id = d.device_id
        `;
        const values = [];
        let paramCount = 0;

        if (clientId) {
            paramCount++;
            query += ` WHERE uo.client_id = $${paramCount}`;
            values.push(clientId);
        }

        paramCount++;
        query += ` ORDER BY uo.started_at DESC LIMIT $${paramCount}`;
        values.push(limit);

        if (offset > 0) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            values.push(offset);
        }

        try {
            const result = await database.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Error getting recent operations:', error);
            throw error;
        }
    }

    static async cleanupOldOperations(daysOld = 30) {
        const query = `
            DELETE FROM unlock_operations 
            WHERE started_at < NOW() - INTERVAL '${daysOld} days'
            AND status IN ('completed', 'failed')
        `;

        try {
            const result = await database.query(query);
            logger.info(`Cleaned up ${result.rowCount} old unlock operations`);
            return result.rowCount;
        } catch (error) {
            logger.error('Error cleaning up old operations:', error);
            throw error;
        }
    }
}

module.exports = UnlockOperation;