import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const uploadsDir = path.resolve(
    process.env.UPLOAD_DIR || path.join(distPath, "images/uploads"),
  );

  app.get("/images/uploads/:file", (c) => {
    const file = c.req.param("file");
    if (!/^[a-z0-9-]+(?:\.[a-z0-9]+)?\.(?:jpg|jpeg|png|webp)$/i.test(file)) {
      return c.json({ error: "Not Found" }, 404);
    }

    const filePath = path.join(uploadsDir, path.basename(file));
    try {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      return c.body(content, 200, { "Content-Type": contentType });
    } catch {
      return c.json({ error: "Not Found" }, 404);
    }
  });

  // The PWA manifest must be served explicitly: some hosts/storage layers
  // filter the ".webmanifest" extension, so we read it from disk directly.
  app.get("/manifest.webmanifest", (c) => {
    try {
      const content = fs.readFileSync(path.resolve(distPath, "manifest.webmanifest"), "utf-8");
      return c.body(content, 200, { "Content-Type": "application/manifest+json" });
    } catch {
      return c.json({ error: "Not Found" }, 404);
    }
  });

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
