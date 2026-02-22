import { WebClient } from "@slack/web-api";
import type { Messenger, Contact, Message } from "./types.js";

export function isSlackConfigured(): boolean {
  return !!process.env.SLACK_BOT_TOKEN;
}

export function createSlackMessenger(): Messenger {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("Missing SLACK_BOT_TOKEN");
    process.exit(1);
  }

  const client = new WebClient(token);
  let botUserId = "";

  // Simple cache for user display names to avoid repeated API calls
  const userNameCache = new Map<string, string>();

  async function resolveUserName(userId: string): Promise<string> {
    const cached = userNameCache.get(userId);
    if (cached !== undefined) return cached;

    try {
      const info = await client.users.info({ user: userId });
      const name = info.user?.real_name || info.user?.name || userId;
      userNameCache.set(userId, name);
      return name;
    } catch {
      userNameCache.set(userId, userId);
      return userId;
    }
  }

  return {
    name: "Slack",

    async init() {
      const result = await client.auth.test();
      botUserId = result.user_id as string;
      console.log(`Slack authenticated as ${result.user} (bot ID: ${botUserId})`);
    },

    async getContacts(): Promise<Contact[]> {
      const result = await client.conversations.list({
        types: "public_channel,private_channel,mpim,im",
        exclude_archived: true,
        limit: 100,
      });

      const contacts: Contact[] = [];

      for (const ch of result.channels || []) {
        if (!ch.is_member) continue;

        let name = ch.name || "Unknown";
        let isUser = false;
        const isGroup = ch.is_group || ch.is_mpim || false;
        const isChannel = ch.is_channel || false;

        // For DMs, resolve the other user's name
        if (ch.is_im && ch.user) {
          isUser = true;
          name = await resolveUserName(ch.user);
        }

        contacts.push({
          id: ch.id || "",
          name,
          username: ch.name || null,
          isUser,
          isGroup,
          isChannel,
        });
      }

      return contacts;
    },

    async getMessages(entityId: string, limit = 4): Promise<Message[]> {
      const result = await client.conversations.history({
        channel: entityId,
        limit,
      });

      const messages: Message[] = [];

      for (const msg of result.messages || []) {
        const senderName = msg.user ? await resolveUserName(msg.user) : "";

        messages.push({
          id: msg.ts || "",
          text: msg.text || "",
          out: msg.user === botUserId,
          date: Math.floor(parseFloat(msg.ts || "0")),
          senderName,
        });
      }

      return messages;
    },

    async sendMessage(text: string, recipient: string) {
      await client.chat.postMessage({
        channel: recipient,
        text,
      });
    },
  };
}
