const { Pool } = require('pg');
const logger = require('./logger');

class Database {
    constructor() {
        this.pool = null;
        this.isDevelopmentMode = !process.env.DB_HOST;
    }

    async connect() {
        // Skip database connection in development mode if no DB_HOST is set
        if (this.isDevelopmentMode) {
            logger.info('Running in development mode without database connection');
            return;
        }

        try {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'xiaomi_unlock',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            logger.info('Database connection established');
        } catch (error) {
            logger.error('Database connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            logger.info('Database connection closed');
        }
    }

    async query(text, params) {
        if (this.isDevelopmentMode) {
            logger.warn('Database queries disabled in development mode');
            return { rows: [], rowCount: 0 };
        }

        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            logger.error('Query error:', { text, error: error.message });
            throw error;
        }
    }

    async getClient() {
        if (this.isDevelopmentMode) {
            logger.warn('Database client requests disabled in development mode');
            return null;
        }
        return await this.pool.connect();
    }
}

module.exports = new Database();