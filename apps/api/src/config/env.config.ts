export const envConfig = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || './tasks.sqlite',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
