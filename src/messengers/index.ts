import { isTelegramConfigured, createTelegramMessenger } from "./telegram.js";
import { isSlackConfigured, createSlackMessenger } from "./slack.js";
import type { Messenger } from "./types.js";

export type { Messenger, Contact, Message } from "./types.js";

export function getAvailableMessengerNames(): string[] {
  const available: string[] = [];
  if (isTelegramConfigured()) available.push("telegram");
  if (isSlackConfigured()) available.push("slack");
  return available;
}

export function createMessenger(name: string): Messenger {
  switch (name) {
    case "telegram":
      return createTelegramMessenger();
    case "slack":
      return createSlackMessenger();
    default:
      throw new Error(`Unknown messenger: "${name}"`);
  }
}
