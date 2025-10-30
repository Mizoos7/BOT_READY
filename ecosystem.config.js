module.exports = {
    apps: [{
        name: 'ai-photo-analyzer',
        script: 'server/index.js',
        cwd: '/var/www/ai-photo-analyzer',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
