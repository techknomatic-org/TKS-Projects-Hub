module.exports = {
  apps: [
    {
      name: 'tks-backend',
      script: './backend/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'mysql://root:Sai@1234@localhost:3306/tks_tracking',
        JWT_SECRET: 'tks_jwt_secret_key_change_me_in_prod',
        AZURE_CLIENT_ID: 'a667ed28-9786-4ada-964e-604da9fdcccd',
        AZURE_TENANT_ID: 'e27ea0e3-d544-492a-bdfc-778865bdeeae',
        BYPASS_MICROSOFT_AUTH: 'false',
      },
      error_file: './backend/logs/pm2-error.log',
      out_file: './backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
