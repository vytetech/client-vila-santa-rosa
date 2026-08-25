import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { ADMIN_COOKIE, createContext } from "./context";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { createAdminToken } from "./admin-tokens";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Security headers (defense in depth against common web attacks)
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https://tile.openstreetmap.org https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.facebook.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());

/**
 * Admin magic link — the owner generates a fresh link (this URL is only
 * shared privately via WhatsApp/e-mail). Visiting it with a valid key
 * sets the admin cookie and lands on the dashboard, no login screen.
 */
const LOGIN_PAGE = (erro = "") => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel — Vila Santa Rosa</title>
<style>body{font-family:system-ui;background:#fdf6f3;color:#3c2a2a;display:grid;place-items:center;min-height:100vh;margin:0;padding:1rem}
.card{background:#fff;border-radius:1rem;padding:2rem;max-width:22rem;width:100%;box-shadow:0 8px 30px #0001}
h1{font-size:1.3rem;margin:0 0 1rem}
input{width:100%;box-sizing:border-box;padding:.7rem;margin:.35rem 0;border:1px solid #e5c9c9;border-radius:.5rem;font-size:1rem}
button{width:100%;padding:.75rem;margin-top:.8rem;background:#c73e72;color:#fff;border:0;border-radius:.5rem;font-size:1rem;cursor:pointer}
.erro{color:#c0392b;font-size:.9rem;margin:.5rem 0}</style></head><body>
<form class="card" method="POST" action="/admin-access">
<h1>🔐 Painel Vila Santa Rosa</h1>
${erro ? `<p class="erro">${erro}</p>` : ""}
<input name="user" placeholder="Usuário" autocomplete="username" required>
<input name="pass" type="password" placeholder="Senha" autocomplete="current-password" required>
<button type="submit">Entrar</button>
</form></body></html>`;

/** Painel admin — login clássico com usuário e senha. */
app.get("/admin-access", (c) => c.html(LOGIN_PAGE()));

app.post("/admin-access", async (c) => {
  const body = await c.req.parseBody();
  const user = String(body.user ?? "");
  const pass = String(body.pass ?? "");

  // Senha configurada por variável de ambiente (ADMIN_PASS) — sem ela, o acesso
  // fica BLOQUEADO até o proprietário definir a senha.
  if (env.adminPass && user === env.adminUser && pass === env.adminPass) {
    const token = await createAdminToken();
    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    const sameSite = cookieOpts.sameSite === "None" ? "None" : "Lax";
    const secure = cookieOpts.secure ? "; Secure" : "";
    c.header("Set-Cookie", `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=${sameSite}${secure}`);
    return c.redirect("/admin");
  }
  return c.html(LOGIN_PAGE("Usuário ou senha incorretos."), 401);
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
