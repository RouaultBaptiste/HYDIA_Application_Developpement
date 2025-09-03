import dotenv from 'dotenv';
import { z } from 'zod';

// Charger les variables d'environnement
dotenv.config();

// Schéma de validation des variables d'environnement
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_SECRET_KEY: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  ENCRYPTION_KEY: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:8080,http://localhost:5173,http://localhost:3000,http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt,jpg,jpeg,png,gif'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),

  // Frontend/Backend URLs
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),

  // Sessions/Cookies
  SESSION_COOKIE_NAME: z.string().default('hydia_sess'),
  SESSION_COOKIE_DOMAIN: z.string().default('localhost'),
  SESSION_SECRET: z.string().min(32).default('development-session-secret-32-bytes-min'),

  // Feature flags
  FEATURE_DOCUMENTS: z.string().transform(v => v === 'true').default('false'),

  // MCP config
  SUPABASE_MCP_CONFIG: z.string().default('./supabase/mcp_ids.json'),

  // Optional
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

// Validation des variables d'environnement
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // En environnement de test, on fournit des valeurs par défaut
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Using default values for testing environment');
      return envSchema.parse({
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://example.supabase.co',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
        SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || 'test-secret-key',
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-min-32-chars',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars-long-111'
      });
    } else {
      console.error('❌ Invalid environment variables:', error);
      process.exit(1);
    }
  }
};

const env = parseEnv();

// Configuration exportée
export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    apiVersion: env.API_VERSION,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    secretKey: env.SUPABASE_SECRET_KEY,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    encryptionKey: env.ENCRYPTION_KEY,
    corsOrigin: env.CORS_ORIGIN.split(','),
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    allowedOrigins: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  },
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
  },
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },
  urls: {
    frontend: env.FRONTEND_URL,
    backend: env.BACKEND_URL,
  },
  session: {
    cookieName: env.SESSION_COOKIE_NAME,
    cookieDomain: env.SESSION_COOKIE_DOMAIN,
    secret: env.SESSION_SECRET,
  },
  features: {
    documents: env.FEATURE_DOCUMENTS,
  },
  mcp: {
    supabaseConfigPath: env.SUPABASE_MCP_CONFIG,
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  redis: {
    url: env.REDIS_URL,
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
  },
} as const;

export default config;
