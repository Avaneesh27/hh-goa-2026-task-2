import "dotenv/config";
import express from "express";
import http, { createServer } from "http";

import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Python RAG Backend Proxy ─────────────────────────────────────────────────
  // IMPORTANT: Registered BEFORE body parsers so the raw stream is intact
  // for piping multipart/form-data (voice queries) and JSON to FastAPI.
  const RAG_BACKEND = process.env.RAG_BACKEND_URL || "http://localhost:8000";

  const proxyToBackend = (req: express.Request, res: express.Response) => {
    const targetUrl = new URL(req.originalUrl, RAG_BACKEND);
    const options: import("http").RequestOptions = {
      hostname: targetUrl.hostname,
      port: Number(targetUrl.port) || 8000,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: { ...req.headers, host: targetUrl.host },
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", (err) => {
      console.error("[RAG proxy error]", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "RAG backend unavailable", detail: err.message });
      }
    });
    if (req.method !== "GET" && req.method !== "HEAD") {
      req.pipe(proxyReq, { end: true });
    } else {
      proxyReq.end();
    }
  };

  // Proxy /health → FastAPI backend
  app.all("/health", proxyToBackend);

  // Proxy /api/* except /api/trpc → FastAPI backend
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/trpc")) return next(); // let tRPC handle it
    proxyToBackend(req, res);
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // Configure body parser with larger size limit for file uploads (after proxy)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler to catch malformed URIs or uncaught route errors
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof URIError) {
      res.status(400).send("Bad Request: Malformed URI");
      return;
    }
    console.error("Unhandled server error:", err);
    res.status(500).send("Internal Server Error");
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[RAG Proxy] /api/* and /health → ${RAG_BACKEND}`);
  });
}

startServer().catch(console.error);
