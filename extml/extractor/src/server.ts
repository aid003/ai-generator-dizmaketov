import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { extractFromUrl } from "./core";

let currentHttpServer: http.Server | null = null;
let currentIO: SocketIOServer | null = null;

export const startServer = (port = 5500) => {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

  currentHttpServer = server;
  currentIO = io;

  const OUTPUT_DIR = path.resolve(__dirname, "../output");

  app.use((req, _, next) => {
    console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
    next();
  });

  app.use((_, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.use(express.json());

  let registeredStaticSites: string[] = [];

  const clearOldRoutes = () => {
    if (!app._router) return;
    app._router.stack = app._router.stack.filter((layer: any) => {
      if (!layer || !layer.regexp) return true;
      const regexStr = layer.regexp.source;
      return !registeredStaticSites.some((site) =>
        regexStr.includes(`\\/${site}\\/?`)
      );
    });
  };

  const registerStaticSites = () => {
    clearOldRoutes();
    registeredStaticSites = [];

    fs.readdirSync(OUTPUT_DIR, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isDirectory()) return;
      const siteName = entry.name;
      const fullPath = path.join(OUTPUT_DIR, siteName);
      const indexFile = path.join(fullPath, "index.html");

      if (!fs.existsSync(indexFile)) {
        console.warn(`⚠️ index.html not found in ${fullPath}, skipping`);
        return;
      }

      console.log(`✅ Registering static site: /${siteName} → ${fullPath}`);

      const router = express.Router();

      router.get("/", (req, res) => {
        if (!req.originalUrl.endsWith("/")) {
          return res.redirect(302, `${req.originalUrl}/`);
        }
        res.sendFile("index.html", { root: fullPath }, (err) => {
          if (err) {
            console.error(
              `❌ Error sending index.html from ${fullPath}:`,
              err.message
            );
            res.status(500).send("Error loading page");
          }
        });
      });

      router.use(
        express.static(fullPath, {
          index: "index.html",
          extensions: ["html"],
          cacheControl: false,
          etag: false,
          maxAge: 0,
        })
      );

      app.use(`/${siteName}`, router);
      registeredStaticSites.push(siteName);
    });
  };

  registerStaticSites();

  fs.watch(OUTPUT_DIR, { recursive: true }, (event, filename) => {
    console.log(`🌀 Change detected in output/: ${event} — ${filename}`);
    registerStaticSites();
  });

  io.of("/scraper").on("connection", (socket) => {
    console.log("🔌 New client connected");
    socket.on("startExtract", async (options) => {
      const {
        url,
        depth,
        idleTime,
        checkInterval,
        maxTimeout,
        allowanceInterval,
        hardTimeout,
      } = options;
      if (
        !url ||
        depth === undefined ||
        idleTime === undefined ||
        checkInterval === undefined ||
        maxTimeout === undefined ||
        allowanceInterval === undefined ||
        hardTimeout === undefined
      ) {
        return socket.emit("error", "Missing parameters");
      }
      try {
        socket.emit("extractStarted", { url, depth });
        extractFromUrl(url, depth, {
          onLog: (msg) => socket.emit("log", msg),
          onFinish: (hostFolder) => socket.emit("done", hostFolder),
          onError: (err) => socket.emit("error", err.message),
          idleTime,
          checkInterval,
          maxTimeout,
          allowanceInterval,
          hardTimeout,
        });
      } catch (err: any) {
        socket.emit("error", err.message);
      }
    });
    socket.on("availableSites", () => {
      try {
        const sites = fs
          .readdirSync(OUTPUT_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        socket.emit("availableSites", sites);
      } catch (err: any) {
        socket.emit("error", err.message);
      }
    });
    socket.on("reloadServer", (ack) => {
      try {
        registerStaticSites();
        console.log("🔁 Routes reloaded successfully");
        ack({ success: true });
      } catch (err: any) {
        console.error("Error reloading routes:", err);
        ack({ success: false });
      }
    });
  });

  server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log("📂 Available sites:");
    fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .forEach((e) => console.log(`→ http://localhost:${port}/${e.name}`));
  });
};
