module.exports = {
  apps: [
    {
      name: "physiohub-research",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
    },
  ],
}
