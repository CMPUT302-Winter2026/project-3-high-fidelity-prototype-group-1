import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function validateDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Configure it before starting the app.");
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const placeholderHosts = new Set(["host"]);
    const placeholderUsernames = new Set(["user", "username"]);
    const placeholderPasswords = new Set(["password"]);
    const placeholderDatabases = new Set(["database", "db"]);

    const databaseName = parsedUrl.pathname.replace(/^\//, "").toLowerCase();
    const hostname = parsedUrl.hostname.toLowerCase();
    const username = decodeURIComponent(parsedUrl.username).toLowerCase();
    const password = decodeURIComponent(parsedUrl.password).toLowerCase();

    if (
      placeholderHosts.has(hostname) ||
      placeholderUsernames.has(username) ||
      placeholderPasswords.has(password) ||
      placeholderDatabases.has(databaseName)
    ) {
      throw new Error(
        "DATABASE_URL is still using placeholder values. Replace USER, PASSWORD, HOST, and DATABASE with your real PostgreSQL connection details."
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("DATABASE_URL is not a valid connection string.");
    }

    throw error;
  }
}

function shouldValidateDatabaseUrl() {
  return (
    process.env.NEXT_PHASE !== "phase-production-build" &&
    process.env.npm_lifecycle_event !== "build"
  );
}

if (shouldValidateDatabaseUrl()) {
  validateDatabaseUrl();
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
