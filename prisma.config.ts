// Prisma 7 configuration: all connection URLs live here, not in schema.prisma.
//
// DATABASE_URL = Transaction Pooler (for the running Next.js app)
// DIRECT_URL   = Direct connection  (for `prisma db push` / `prisma migrate`)
//
// Why two URLs?
//   The pooler (PgBouncer) is optimised for serverless / short-lived connections
//   but does NOT support DDL statements used during migrations. The direct URL
//   bypasses the pooler for Prisma CLI commands.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI uses this URL — prefer DIRECT_URL so migrations bypass pgBouncer.
    // Falls back to DATABASE_URL if DIRECT_URL is not set (e.g. in CI).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
