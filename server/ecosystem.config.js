module.exports = {
  apps: [
    {
      name: "gestion-equipment",
      script: "./dist/src/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        JWT_SECRET: "756db242d8e02a23f30bfd1e89c8d3256600d19d15db53ff61b0dd5e8099614f6454533b12fac21a00925defb2801f5fc1fad49f6c924c500487c23618f29a33",
        TOKEN_EXPIRY: "7d",
        // Add database connection strings as needed
        AUTH_DATABASE_URL: "postgresql://postgres:Insight_h38UNZq64@Localhost:5432/auth_db?schema=public"
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      restart_delay: 3000,
    },
  ],
};

