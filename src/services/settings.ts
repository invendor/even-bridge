import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.resolve(__dirname, "..", "..", "settings.json");

export interface Settings {
  openai?: { apiKey?: string };
  telegram?: { apiId?: string; apiHash?: string };
  slack?: { userToken?: string };
  gmail?: { address?: string; appPassword?: string };
}

// Maps dot-notation keys to process.env variable names (for fallback)
const ENV_MAP: Record<string, string> = {
  "openai.apiKey": "OPENAI_API_KEY",
  "telegram.apiId": "TELEGRAM_API_ID",
  "telegram.apiHash": "TELEGRAM_API_HASH",
  "slack.userToken": "SLACK_USER_TOKEN",
  "gmail.address": "GMAIL_ADDRESS",
  "gmail.appPassword": "GMAIL_APP_PASSWORD",
};

export function loadSettings(): Settings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      return JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

export function saveSettings(settings: Settings): void {
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/** Check settings.json first, then fall back to process.env */
export function getCredential(key: string): string | undefined {
  const settings = loadSettings();
  const [section, field] = key.split(".") as [keyof Settings, string];
  const sectionData = settings[section] as Record<string, string | undefined> | undefined;
  const value = sectionData?.[field];
  if (value) return value;

  const envKey = ENV_MAP[key];
  return envKey ? process.env[envKey] : undefined;
}

/** Returns which services are configured (booleans only, never secrets) */
export function getSettingsStatus(): Record<string, { configured: boolean; fields: Record<string, boolean> }> {
  return {
    openai: {
      configured: !!getCredential("openai.apiKey"),
      fields: { apiKey: !!getCredential("openai.apiKey") },
    },
    telegram: {
      configured: !!(getCredential("telegram.apiId") && getCredential("telegram.apiHash")),
      fields: {
        apiId: !!getCredential("telegram.apiId"),
        apiHash: !!getCredential("telegram.apiHash"),
      },
    },
    slack: {
      configured: !!getCredential("slack.userToken"),
      fields: { userToken: !!getCredential("slack.userToken") },
    },
    gmail: {
      configured: !!(getCredential("gmail.address") && getCredential("gmail.appPassword")),
      fields: {
        address: !!getCredential("gmail.address"),
        appPassword: !!getCredential("gmail.appPassword"),
      },
    },
  };
}
