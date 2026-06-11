import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env.mjs";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "./resolve-database-url";

const connectionString = resolveDatabaseUrl(env.DATABASE_URL);

if (!connectionString) {
  console.log("🔴 no database URL");
}

/** Serverless: one connection per lambda; pooler handles concurrency. */
const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(client, { schema });

export default db;
