module.exports = {
  apps: [
    {
      name: "weather-cronjob",
      script: "./src/cron/weather.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,
    },
    {
      name: "backup-cronjob",
      script: "./src/cron/backup.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/backup-err.log",
      out_file: "./logs/backup-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,
    },
  ],
};
