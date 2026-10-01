import 'dotenv/config';
import { z } from 'zod';

// Strict environment variable validation - fails fast on missing required vars
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  
  // Database (supports PostgreSQL or SQLite)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Email (Nodemailer)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? Number(val) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@splitwise.app'),
  
  // Google OAuth (optional - can use email/password login)
  GOOGLE_CLIENT_ID: z.string().optional(),
  
  // OneSignal Push Notifications (optional - app works without push)
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_REST_API_KEY: z.string().optional(),
  
  // Storage (S3-compatible for receipts) - all optional
  S3_ENDPOINT: z.preprocess(
    val => val === '' ? undefined : val,
    z.string().url().optional()
  ),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('splitwise-receipts'),
  S3_PUBLIC_URL: z.preprocess(
    val => val === '' ? undefined : val,
    z.string().url().optional()
  ),
  
  // App URLs
  APP_URL: z.string().url().default('http://localhost:3000'),
  WEB_APP_URL: z.string().url().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

// Parse and validate environment variables on module load
// This throws immediately if any required variable is missing or invalid
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration. Check the errors above.');
  }
};

export const env = parseEnv();

// Type-safe environment access throughout the app
export type Env = z.infer<typeof envSchema>;
