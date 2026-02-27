import { Router } from "express";
import { loadSettings, saveSettings, getSettingsStatus, type Settings } from "../services/settings.js";
import { startAuth, submitCode, submitPassword, getAuthState, resetAuth, hasTelegramSession } from "../services/telegramAuth.js";

export function createSettingsRouter(): Router {
  const router = Router();

  // GET /status — returns which services are configured (booleans only)
  router.get("/status", (_req, res) => {
    const status = getSettingsStatus();
    // Add Telegram session info
    (status.telegram as any).authenticated = hasTelegramSession();
    res.json(status);
  });

  // POST /openai — save OpenAI credentials
  router.post("/openai", (req, res) => {
    const { apiKey } = req.body || {};
    const settings = loadSettings();
    settings.openai = apiKey ? { apiKey } : undefined;
    saveSettings(settings);
    res.json({ ok: true });
  });

  // POST /telegram — save Telegram API credentials
  router.post("/telegram", (req, res) => {
    const { apiId, apiHash } = req.body || {};
    const settings = loadSettings();
    settings.telegram = (apiId && apiHash) ? { apiId, apiHash } : undefined;
    saveSettings(settings);
    res.json({ ok: true });
  });

  // POST /slack — save Slack credentials
  router.post("/slack", (req, res) => {
    const { userToken } = req.body || {};
    const settings = loadSettings();
    settings.slack = userToken ? { userToken } : undefined;
    saveSettings(settings);
    res.json({ ok: true });
  });

  // POST /gmail — save Gmail credentials
  router.post("/gmail", (req, res) => {
    const { address, appPassword } = req.body || {};
    const settings = loadSettings();
    settings.gmail = (address && appPassword) ? { address, appPassword } : undefined;
    saveSettings(settings);
    res.json({ ok: true });
  });

  // DELETE /:service — remove a service's credentials
  router.delete("/:service", (req, res) => {
    const service = req.params.service as keyof Settings;
    const valid: (keyof Settings)[] = ["openai", "telegram", "slack", "gmail"];
    if (!valid.includes(service)) {
      res.status(400).json({ error: "Unknown service" });
      return;
    }
    const settings = loadSettings();
    delete settings[service];
    saveSettings(settings);
    res.json({ ok: true });
  });

  // --- Telegram auth flow ---

  // POST /telegram/auth/start — begin phone auth
  router.post("/telegram/auth/start", async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) {
      res.status(400).json({ error: "Phone number required" });
      return;
    }
    try {
      const result = await startAuth(phone);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ state: "error", error: err.message });
    }
  });

  // POST /telegram/auth/code — submit verification code
  router.post("/telegram/auth/code", async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      res.status(400).json({ error: "Code required" });
      return;
    }
    submitCode(code);
    // Wait for state to advance
    await new Promise((r) => setTimeout(r, 2000));
    res.json(getAuthState());
  });

  // POST /telegram/auth/password — submit 2FA password
  router.post("/telegram/auth/password", async (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      res.status(400).json({ error: "Password required" });
      return;
    }
    submitPassword(password);
    // Wait for state to advance
    await new Promise((r) => setTimeout(r, 2000));
    res.json(getAuthState());
  });

  // GET /telegram/auth/state — poll current auth state
  router.get("/telegram/auth/state", (_req, res) => {
    res.json(getAuthState());
  });

  // POST /telegram/auth/reset — cancel auth flow
  router.post("/telegram/auth/reset", (_req, res) => {
    resetAuth();
    res.json({ ok: true });
  });

  return router;
}
