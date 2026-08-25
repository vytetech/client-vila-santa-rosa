import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";
import { adminTokens } from "@db/schema";
import { eq } from "drizzle-orm";
import { adminTokenTtlMs } from "./lib/admin-session";

const processSigningSecret = randomBytes(32).toString("hex");

/** Segredo usado para assinar tokens quando NÃO há banco configurado. */
function signingSecret(): string {
  return env.appSecret || env.databaseUrl || processSigningSecret;
}

/** Token assinado (stateless): hex(expiração).hex(assinatura). */
function createSignedToken(): string {
  const exp = Date.now() + adminTokenTtlMs();
  const sig = createHmac("sha256", signingSecret())
    .update(String(exp))
    .digest("hex");
  return `${exp.toString(16)}.${sig}`;
}

function validateSignedToken(token: string): boolean {
  const [expHex, sig] = token.split(".");
  if (!/^[0-9a-f]+$/.test(expHex ?? "") || !/^[a-f0-9]{64}$/.test(sig ?? "")) {
    return false;
  }
  const expected = createHmac("sha256", signingSecret())
    .update(String(parseInt(expHex, 16)))
    .digest("hex");
  if (expected.length !== sig.length) return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return parseInt(expHex, 16) > Date.now();
}

/** Create a one-off admin access token with a short configurable TTL. */
export async function createAdminToken(): Promise<string> {
  // Sem banco de dados configurado: token assinado em memória, sem persistência
  // após restart. Em produção Railway, DATABASE_URL deve estar configurado.
  if (!env.databaseUrl) {
    return createSignedToken();
  }
  try {
    const token = randomBytes(24).toString("hex");
    await getDb().insert(adminTokens).values({
      token,
      expiresAt: new Date(Date.now() + adminTokenTtlMs()),
    });
    return token;
  } catch {
    // Banco indisponível → cai no modo assinado.
    return createSignedToken();
  }
}

/** Validate a token; returns true if it exists and is not expired. */
export async function validateAdminToken(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{48}$/.test(token)) {
    // Formato assinado (stateless).
    return validateSignedToken(token);
  }
  if (!env.databaseUrl) return false;
  try {
    const rows = await getDb()
      .select()
      .from(adminTokens)
      .where(eq(adminTokens.token, token))
      .limit(1);
    if (!rows.length) return false;
    return rows[0].expiresAt.getTime() > Date.now();
  } catch {
    return false;
  }
}
