import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import type { Messenger } from "./messengers/types.js";
import { createApiRouter } from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Shared server state ---
let activeMessenger: Messenger | null = null;

export function getActiveMessenger(): Messenger | null {
  return activeMessenger;
}

export function setActiveMessenger(m: Messenger): void {
  activeMessenger = m;
}

// --- Express app ---
const app = express();

const noCacheHtml: express.RequestHandler = (_req, res, next) => {
  if (_req.path === "/" || _req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
};

const publicDir = path.join(__dirname, "public");
const srcPublicDir = path.resolve(__dirname, "..", "src", "public");
app.use(noCacheHtml);
app.use(express.static(publicDir));
app.use(express.static(srcPublicDir));
app.use("/api", createApiRouter(() => activeMessenger));
app.use(express.json());

export default app;
