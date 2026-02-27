import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCredential } from "./settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.resolve(__dirname, "..", "..", "telegram-session.txt");

type AuthState = "idle" | "awaiting_code" | "awaiting_password" | "authenticated" | "error";

interface PendingResolve {
  resolve: (value: string) => void;
  reject: (err: Error) => void;
}

let state: AuthState = "idle";
let errorMessage = "";
let pendingCode: PendingResolve | null = null;
let pendingPassword: PendingResolve | null = null;

function loadSession(): string {
  if (existsSync(SESSION_FILE)) {
    return readFileSync(SESSION_FILE, "utf-8").trim();
  }
  return "";
}

function saveSession(session: string): void {
  writeFileSync(SESSION_FILE, session);
}

export function hasTelegramSession(): boolean {
  const s = loadSession();
  return s.length > 0;
}

export function getAuthState(): { state: AuthState; error?: string } {
  return { state, ...(state === "error" ? { error: errorMessage } : {}) };
}

export async function startAuth(phone: string): Promise<{ state: AuthState; error?: string }> {
  if (state === "awaiting_code" || state === "awaiting_password") {
    return { state, error: "Auth already in progress" };
  }

  const apiId = parseInt(getCredential("telegram.apiId") || "0", 10);
  const apiHash = getCredential("telegram.apiHash");
  if (!apiId || !apiHash) {
    return { state: "error", error: "Telegram API credentials not configured" };
  }

  state = "idle";
  errorMessage = "";
  pendingCode = null;
  pendingPassword = null;

  const stringSession = new StringSession(loadSession());
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  // Start auth in background — blocks on our promise callbacks
  client.start({
    phoneNumber: async () => phone,
    phoneCode: async () => {
      state = "awaiting_code";
      return new Promise<string>((resolve, reject) => {
        pendingCode = { resolve, reject };
      });
    },
    password: async () => {
      state = "awaiting_password";
      return new Promise<string>((resolve, reject) => {
        pendingPassword = { resolve, reject };
      });
    },
    onError: (err) => {
      state = "error";
      errorMessage = err.message || "Unknown error";
      pendingCode?.reject(err);
      pendingPassword?.reject(err);
      pendingCode = null;
      pendingPassword = null;
    },
  }).then(() => {
    const sessionStr = client.session.save() as unknown as string;
    saveSession(sessionStr);
    state = "authenticated";
    console.log("Telegram authenticated via Settings UI");
  }).catch((err) => {
    state = "error";
    errorMessage = err.message || "Auth failed";
    console.error("Telegram auth failed:", err.message);
  });

  // Wait for state to advance (code requested, error, or instant auth)
  await waitForState(["awaiting_code", "authenticated", "error"], 15000);
  return getAuthState();
}

export function submitCode(code: string): { state: AuthState; error?: string } {
  if (state !== "awaiting_code" || !pendingCode) {
    return { state, error: "Not awaiting code" };
  }
  pendingCode.resolve(code);
  pendingCode = null;
  return getAuthState();
}

export function submitPassword(password: string): { state: AuthState; error?: string } {
  if (state !== "awaiting_password" || !pendingPassword) {
    return { state, error: "Not awaiting password" };
  }
  pendingPassword.resolve(password);
  pendingPassword = null;
  return getAuthState();
}

export function resetAuth(): void {
  pendingCode?.reject(new Error("Auth reset"));
  pendingPassword?.reject(new Error("Auth reset"));
  pendingCode = null;
  pendingPassword = null;
  state = "idle";
  errorMessage = "";
}

function waitForState(targets: AuthState[], timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (targets.includes(state)) { resolve(); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (targets.includes(state) || Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
