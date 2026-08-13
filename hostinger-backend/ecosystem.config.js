// PM2 Production Configuration for Hostinger VPS
module.exports = {
  apps: [
    {
      name: 'fishcare-api',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Staging runs the same code on a separate port/app name
      // (pm2 start ecosystem.config.js --name fishcare-api-staging --env staging)
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3002
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_file: './logs/combined.log',
      time: true,
      // Restart after crash with exponential backoff
      exp_backoff_restart_delay: 100,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    }
  ]
};
