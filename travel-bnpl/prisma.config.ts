import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not read .env files on its own.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` / `validate` do not contact the DB, so a placeholder
    // keeps them working in CI and cloud sessions without a database.
    url:
      process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
