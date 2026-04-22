import { beforeAll } from "vitest";

// Env must be loaded before any app import — env.ts reads .env.test via NODE_ENV
process.env.NODE_ENV = "test";

// Force load .env.test early so all modules pick up the right vars
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

