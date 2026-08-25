import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    if (!env.databaseUrl) {
      throw new Error(
        "Banco de dados não configurado: defina DATABASE_URL nas variáveis do Railway.",
      );
    }
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}
