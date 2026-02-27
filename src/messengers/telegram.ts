import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Messenger, Contact, Message } from "./types.js";
import { getCredential } from "../services/settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_FILE = path.resolve(__dirname, "..", "..", "telegram-session.txt");

function loadSession(): string {
  if (existsSync(SESSION_FILE)) {
    return readFileSync(SESSION_FILE, "utf-8").trim();
  }
  return "";
}

export function isTelegramConfigured(): boolean {
  const apiId = parseInt(getCredential("telegram.apiId") || "0", 10);
  const apiHash = getCredential("telegram.apiHash");
  return !!(apiId && apiHash);
}

export function createTelegramMessenger(): Messenger {
  const apiId = parseInt(getCredential("telegram.apiId") || "0", 10);
  const apiHash = getCredential("telegram.apiHash");

  if (!apiId || !apiHash) {
    throw new Error("Missing Telegram API credentials");
  }

  const sessionStr = loadSession();
  if (!sessionStr) {
    throw new Error("Telegram not authenticated. Please authenticate via Settings.");
  }

  const stringSession = new StringSession(sessionStr);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return {
    name: "Telegram",

    async init() {
      await client.connect();
      console.log("Telegram client connected with saved session");
    },

    async getContacts(): Promise<Contact[]> {
      const dialogs = await client.getDialogs({ limit: 100 });
      const pinned = dialogs.filter((d) => d.pinned);
      return pinned.map((d) => ({
        id: d.id?.toString() || "",
        name: d.title || "Unknown",
        username: (d.entity as any)?.username || null,
        isUser: d.isUser,
        isGroup: d.isGroup,
        isChannel: d.isChannel,
      }));
    },

    async getMessages(entityId: string, limit = 4): Promise<Message[]> {
      const messages = await client.getMessages(entityId, { limit });
      return messages.map((m: any) => ({
        id: m.id,
        text: m.message || "",
        out: m.out,
        date: m.date,
        senderName: m.sender?.firstName || m.sender?.title || "",
      }));
    },

    async sendMessage(text: string, recipient: string) {
      await client.sendMessage(recipient, { message: text });
    },
  };
}
