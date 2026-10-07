// Vitest setup: provide required env vars for tests that import server modules.
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-for-ci-only-32chars!!";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "mysql://root@localhost:3306/test";
