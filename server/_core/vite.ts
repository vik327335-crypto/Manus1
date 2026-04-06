import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Middleware to strip HMR client from HTML
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data: any) {
      if (typeof data === 'string' && data.includes('@vite/client')) {
        // Remove @vite/client script tags
        data = data.replace(/<script[^>]*@vite\/client[^>]*><\/script>/g, '')
                   .replace(/<script[^>]*type="module"[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '')
                   .replace(/<script[^>]*src="\/@vite\/client"[^>]*type="module"[^>]*><\/script>/g, '');
      }
      return originalSend.call(this, data);
    };
    next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);
      // Strip HMR client from page
      page = page.replace(/<script[^>]*@vite\/client[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*type="module"[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*src="\/@vite\/client"[^>]*type="module"[^>]*><\/script>/g, '');
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
