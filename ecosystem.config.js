module.exports = {
  apps: [
    {
      name: "weather-cronjob",
      script: "./cronjob.js",
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
      // 크론잡이므로 재시작 전략 설정
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,
    },
  ],
};
