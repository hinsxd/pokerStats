import "dotenv/config";
import type { Config } from "drizzle-kit";
export default {
  schema: "./src/db/schema.mjs",
  out: "./drizzle",
  driver: "better-sqlite",
} satisfies Config;
