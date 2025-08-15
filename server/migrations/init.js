const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'xiaomi_unlock',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

const migrations = [{
        name: 'create_devices_table',
        sql: `
            CREATE TABLE IF NOT EXISTS devices (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) UNIQUE NOT NULL,
                serial_number VARCHAR(255) NOT NULL,
                chipset VARCHAR(50) NOT NULL CHECK (chipset IN ('qualcomm', 'mediatek', 'xiaomi')),
                mode VARCHAR(50) NOT NULL CHECK (mode IN ('edl', 'brom', 'mi_assistant')),
                bootloader VARCHAR(255),
                hardware_id VARCHAR(255),
                manufacturer VARCHAR(100) DEFAULT 'Unknown',
                model VARCHAR(100) DEFAULT 'Unknown',
                android_version VARCHAR(50),
                client_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
            CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
            CREATE INDEX IF NOT EXISTS idx_devices_client_id ON devices(client_id);
            CREATE INDEX IF NOT EXISTS idx_devices_chipset_mode ON devices(chipset, mode);
        `
    },
    {
        name: 'create_unlock_operations_table',
        sql: `
            CREATE TABLE IF NOT EXISTS unlock_operations (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) NOT NULL,
                operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('frp_unlock', 'edl_bypass', 'bootloader_unlock', 'mi_unlock')),
                auth_key_hash VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
                client_id VARCHAR(255) NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_unlock_operations_device_id ON unlock_operations(device_id);
            CREATE INDEX IF NOT EXISTS idx_unlock_operations_client_id ON unlock_operations(client_id);
            CREATE INDEX IF NOT EXISTS idx_unlock_operations_status ON unlock_operations(status);
            CREATE INDEX IF NOT EXISTS idx_unlock_operations_started_at ON unlock_operations(started_at);
            CREATE INDEX IF NOT EXISTS idx_unlock_operations_operation_type ON unlock_operations(operation_type);
        `
    },
    {
        name: 'create_api_logs_table',
        sql: `
            CREATE TABLE IF NOT EXISTS api_logs (
                id SERIAL PRIMARY KEY,
                client_id VARCHAR(255) NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL,
                status_code INTEGER NOT NULL,
                response_time INTEGER,
                ip_address INET,
                user_agent TEXT,
                request_body JSONB,
                response_body JSONB,
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_api_logs_client_id ON api_logs(client_id);
            CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
            CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);
        `
    },
    {
        name: 'create_auth_keys_table',
        sql: `
            CREATE TABLE IF NOT EXISTS auth_keys (
                id SERIAL PRIMARY KEY,
                key_hash VARCHAR(255) UNIQUE NOT NULL,
                device_id VARCHAR(255) NOT NULL,
                client_id VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                used_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_auth_keys_device_id ON auth_keys(device_id);
            CREATE INDEX IF NOT EXISTS idx_auth_keys_client_id ON auth_keys(client_id);
            CREATE INDEX IF NOT EXISTS idx_auth_keys_expires_at ON auth_keys(expires_at);
            CREATE INDEX IF NOT EXISTS idx_auth_keys_is_active ON auth_keys(is_active);
        `
    },
    {
        name: 'create_updated_at_triggers',
        sql: `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
            CREATE TRIGGER update_devices_updated_at 
                BEFORE UPDATE ON devices 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            DROP TRIGGER IF EXISTS update_unlock_operations_updated_at ON unlock_operations;
            CREATE TRIGGER update_unlock_operations_updated_at 
                BEFORE UPDATE ON unlock_operations 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
    }
];

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('Starting database migrations...');

        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Get already executed migrations
        const result = await client.query('SELECT name FROM schema_migrations');
        const executedMigrations = result.rows.map(row => row.name);

        // Execute pending migrations
        for (const migration of migrations) {
            if (!executedMigrations.includes(migration.name)) {
                console.log(`Executing migration: ${migration.name}`);

                await client.query('BEGIN');
                try {
                    await client.query(migration.sql);
                    await client.query(
                        'INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]
                    );
                    await client.query('COMMIT');
                    console.log(`✓ Migration ${migration.name} completed`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
            } else {
                console.log(`✓ Migration ${migration.name} already executed`);
            }
        }

        console.log('All migrations completed successfully!');

    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('Database setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigrations };