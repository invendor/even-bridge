import { isTelegramConfigured, createTelegramMessenger } from "./telegram.js";
import { isSlackConfigured, createSlackMessenger } from "./slack.js";
import { isGmailConfigured, createGmailMessenger } from "./gmail.js";
import type { Messenger } from "./types.js";

export type { Messenger, Contact, Message, Folder, FolderMessage } from "./types.js";

export function getAvailableMessengerNames(): string[] {
  const available: string[] = [];
  if (isTelegramConfigured()) available.push("telegram");
  if (isSlackConfigured()) available.push("slack");
  if (isGmailConfigured()) available.push("gmail");
  return available;
}

export function createMessenger(name: string): Messenger {
  switch (name) {
    case "telegram":
      return createTelegramMessenger();
    case "slack":
      return createSlackMessenger();
    case "gmail":
      return createGmailMessenger();
    default:
      throw new Error(`Unknown messenger: "${name}"`);
  }
}
