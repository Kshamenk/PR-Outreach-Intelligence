import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./db";

async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");

  try {
    await pool.query(sql);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
