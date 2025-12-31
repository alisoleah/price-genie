import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema',
  out: './migrations',
  dialect: 'postgresql',
  driver: 'pg',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
