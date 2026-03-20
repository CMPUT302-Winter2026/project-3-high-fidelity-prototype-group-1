import { existsSync } from "node:fs";
import process from "node:process";
import { defineConfig } from "prisma/config";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts"
  }
});
