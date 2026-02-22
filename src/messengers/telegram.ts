import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import * as readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import type { Messenger, Contact, Message } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_FILE = path.resolve(__dirname, "..", "..", "telegram-session.txt");

function loadSession(): string {
  if (existsSync(SESSION_FILE)) {
    return readFileSync(SESSION_FILE, "utf-8").trim();
  }
  return "";
}

function saveSession(session: string): void {
  writeFileSync(SESSION_FILE, session);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function isTelegramConfigured(): boolean {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  return !!(apiId && apiHash);
}

export function createTelegramMessenger(): Messenger {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    console.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH");
    process.exit(1);
  }

  const stringSession = new StringSession(loadSession());
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return {
    name: "Telegram",

    async init() {
      await client.start({
        phoneNumber: () => prompt("Enter your phone number: "),
        password: () => prompt("Enter your 2FA password (if any): "),
        phoneCode: () => prompt("Enter the code you received: "),
        onError: (err) => console.error("Telegram auth error:", err),
      });

      const sessionStr = client.session.save() as unknown as string;
      saveSession(sessionStr);
      console.log("Telegram client authenticated and session saved");
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
