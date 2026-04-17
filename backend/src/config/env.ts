import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Resolve which .env file to load based on NODE_ENV.
// Always use .env.<stage> to avoid conflicts with dotenvx auto-loading .env
const stage = process.env.NODE_ENV || "production";
const envFile = `.env.${stage}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("production"),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // AI provider (optional — required when AI module is enabled)
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_PROVIDER_MODEL: z.string().default("gpt-4o-mini"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
