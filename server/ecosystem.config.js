module.exports = {
    apps: [{
        name: 'xiaomi-unlock-server',
        script: 'src/app.js',
        instances: process.env.PM2_INSTANCES || 'max', // Use all CPU cores
        exec_mode: 'cluster',
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: process.env.PORT || 3000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        kill_timeout: 5000,
        listen_timeout: 8000,
        shutdown_with_message: true,

        // Advanced PM2 features
        node_args: '--max-old-space-size=1024',

        // Monitoring
        pmx: true,

        // Log rotation
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Health check
        health_check_grace_period: 3000,

        // Environment specific configurations
        env_staging: {
            NODE_ENV: 'staging',
            PORT: 3001,
            DB_NAME: 'xiaomi_unlock_staging'
        },

        env_test: {
            NODE_ENV: 'test',
            PORT: 3002,
            DB_NAME: 'xiaomi_unlock_test'
        }
    }],

    // Deployment configuration
    deploy: {
        production: {
            user: 'ubuntu',
            host: ['your-production-server.com'],
            ref: 'origin/main',
            repo: 'https://github.com/yourusername/xiaomi-unlock-server.git',
            path: '/var/www/xiaomi-unlock-server',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci --only=production && npm run migrate:prod && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            'ssh_options': 'StrictHostKeyChecking=no'
        },

        staging: {
            user: 'ubuntu',
            host: ['your-staging-server.com'],
            ref: 'origin/develop',
            repo: 'https://github.com/yourusername/xiaomi-unlock-server.git',
            path: '/var/www/xiaomi-unlock-server-staging',
            'post-deploy': 'npm ci && npm run migrate && pm2 reload ecosystem.config.js --env staging'
        }
    }
};