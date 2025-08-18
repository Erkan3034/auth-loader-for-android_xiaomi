const { Pool } = require('pg');
const logger = require('./logger');

class Database {
    constructor() {
        this.pool = null;
        this.isDevelopmentMode = !process.env.DB_HOST;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }

    async connect() {
        // Skip database connection in development mode if no DB_HOST is set
        if (this.isDevelopmentMode) {
            logger.info('Running in development mode without database connection');
            return;
        }

        return this.connectWithRetry();
    }

    async connectWithRetry() {
        try {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'xiaomi_unlock',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD,
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
                statement_timeout: 30000,
                query_timeout: 30000,
                ssl: process.env.DB_SSL === 'true' ? {
                    rejectUnauthorized: false
                } : false,
                application_name: 'xiaomi-unlock-server'
            });

            // Connection event handlers
            this.pool.on('connect', (client) => {
                logger.info('Database client connected', {
                    processID: client.processID,
                    connectionCount: this.pool.totalCount
                });
            });

            this.pool.on('error', (err) => {
                logger.error('Database pool error:', err);
                this.isConnected = false;
            });

            this.pool.on('remove', () => {
                logger.debug('Database client removed from pool');
            });

            // Test the connection
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW(), version()');
            client.release();

            this.isConnected = true;
            this.connectionRetries = 0;

            logger.info('Database connection established', {
                timestamp: result.rows[0].now,
                version: result.rows[0].version,
                poolSize: this.pool.totalCount,
                ssl: !!this.pool.options.ssl
            });

        } catch (error) {
            this.connectionRetries++;
            logger.error(`Database connection failed (attempt ${this.connectionRetries}/${this.maxRetries}):`, error);

            if (this.connectionRetries < this.maxRetries) {
                const retryDelay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
                logger.info(`Retrying database connection in ${retryDelay}ms...`);

                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.connectWithRetry();
            } else {
                logger.error('Max database connection retries exceeded');
                throw error;
            }
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