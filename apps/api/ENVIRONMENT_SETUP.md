# Environment Setup

This application requires environment variables to be configured. You can set them up in several ways:

## Option 1: Create a .env file (Recommended for development)

Create a `.env` file in the `apps/api` directory with the following content:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=./tasks.sqlite
```

**Important**: The `.env` file is already in `.gitignore` to prevent committing sensitive information.

## Option 2: Set environment variables directly

You can set environment variables directly in your shell:

```bash
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
export PORT=3000
export DATABASE_URL="./tasks.sqlite"
```

## Option 3: Use the default values

The application has default values configured in `src/config/env.config.ts`, but it's recommended to set your own `JWT_SECRET` for security.

## Security Notes

- **Never commit your actual JWT_SECRET to version control**
- Use a strong, random string for JWT_SECRET in production
- Consider using a secrets management service in production environments
- The default JWT_SECRET is only for development purposes

## Starting the Application

After setting up your environment variables, start the application with:

```bash
npm run start
```

The application will automatically load the `.env` file if it exists, or use the default values.
