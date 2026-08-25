import "dotenv/config";

/**
 * Variáveis de ambiente — Railway.
 *
 * Obrigatórias em produção:
 *   DATABASE_URL   — URL MySQL fornecida pelo Railway
 *
 * Opcionais (login com Kimi — o site e o painel admin funcionam sem elas):
 *   APP_ID, APP_SECRET, KIMI_AUTH_URL, KIMI_OPEN_URL
 *   SMTP_HOST/PORT/USER/PASS/FROM — e-mails de redefinição de senha
 */
function optional(name: string): string {
  return process.env[name] ?? "";
}

function optionalPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  // Lida apenas quando uma rota acessa o banco — o site público
  // (páginas estáticas pré-renderizadas) abre mesmo sem ela.
  databaseUrl: optional("DATABASE_URL"),
  // Login do painel admin por /admin-access. Defina em variáveis de ambiente
  // se for usar esse fluxo; contas admin do banco continuam funcionando.
  adminUser: optional("ADMIN_USER") || "admin",
  adminPass: optional("ADMIN_PASS") || "",
  adminSessionTtlMinutes: optionalPositiveInt("ADMIN_SESSION_TTL_MINUTES", 120),
  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
