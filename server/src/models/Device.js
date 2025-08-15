const database = require('../utils/database');
const logger = require('../utils/logger');

class Device {
    static async create(deviceData) {
        const query = `
            INSERT INTO devices (
                device_id, serial_number, chipset, mode, bootloader, 
                hardware_id, manufacturer, model, android_version, 
                client_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *
        `;

        const values = [
            deviceData.deviceId,
            deviceData.serialNumber,
            deviceData.chipset,
            deviceData.mode,
            deviceData.bootloader || null,
            deviceData.hardwareId || null,
            deviceData.manufacturer || 'Unknown',
            deviceData.model || 'Unknown',
            deviceData.androidVersion || null,
            deviceData.clientId
        ];

        try {
            const result = await database.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating device:', error);
            throw error;
        }
    }

    static async findByDeviceId(deviceId) {
        const query = 'SELECT * FROM devices WHERE device_id = $1';

        try {
            const result = await database.query(query, [deviceId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error finding device by ID:', error);
            throw error;
        }
    }

    static async findBySerialNumber(serialNumber) {
        const query = 'SELECT * FROM devices WHERE serial_number = $1';

        try {
            const result = await database.query(query, [serialNumber]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error finding device by serial number:', error);
            throw error;
        }
    }

    static async updateLastSeen(deviceId) {
        const query = 'UPDATE devices SET last_seen = NOW() WHERE device_id = $1 RETURNING *';

        try {
            const result = await database.query(query, [deviceId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error updating device last seen:', error);
            throw error;
        }
    }

    static async getDevicesByClient(clientId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM devices 
            WHERE client_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;

        try {
            const result = await database.query(query, [clientId, limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting devices by client:', error);
            throw error;
        }
    }

    static async getDeviceStats() {
        const query = `
            SELECT 
                COUNT(*) as total_devices,
                COUNT(DISTINCT client_id) as unique_clients,
                mode,
                chipset,
                COUNT(*) as count
            FROM devices 
            GROUP BY mode, chipset
            ORDER BY count DESC
        `;

        try {
            const result = await database.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Error getting device stats:', error);
            throw error;
        }
    }
}

module.exports = Device;