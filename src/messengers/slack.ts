import { WebClient } from "@slack/web-api";
import type { Messenger, Contact, Message } from "./types.js";
import { getCredential } from "../services/settings.js";

export function isSlackConfigured(): boolean {
  return !!getCredential("slack.userToken");
}

export function createSlackMessenger(): Messenger {
  const token = getCredential("slack.userToken");
  if (!token) {
    throw new Error("Missing Slack user token");
  }

  const client = new WebClient(token);
  let authUserId = "";

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
      authUserId = result.user_id as string;
      console.log(`Slack authenticated as ${result.user} (user ID: ${authUserId})`);
    },

    async getContacts(): Promise<Contact[]> {
      console.time("slack:conversations.list");
      const result = await client.conversations.list({
        types: "public_channel,private_channel,mpim,im",
        exclude_archived: true,
        limit: 100,
      });
      console.timeEnd("slack:conversations.list");

      // DMs and MPIMs don't have is_member — they're always yours
      const channels = (result.channels || []).filter(
        (ch) => ch.is_im || ch.is_mpim || ch.is_member
      );
      console.log(`Slack: ${result.channels?.length} total, ${channels.length} after filter`);

      // Resolve all DM user names in parallel to avoid sequential API calls
      const dmChannels = channels.filter((ch) => ch.is_im && ch.user);
      if (dmChannels.length > 0) {
        console.time("slack:resolve-names");
        await Promise.all(dmChannels.map((ch) => resolveUserName(ch.user!)));
        console.timeEnd("slack:resolve-names");
      }

      const contacts: Contact[] = [];

      for (const ch of channels) {
        let name = ch.name || "Unknown";
        let isUser = false;
        const isGroup = ch.is_group || ch.is_mpim || false;
        const isChannel = ch.is_channel || false;

        if (ch.is_im && ch.user) {
          isUser = true;
          name = await resolveUserName(ch.user); // hits cache now
        }

        contacts.push({
          id: ch.id || "",
          name,
          username: null,
          isUser,
          isGroup,
          isChannel,
        });
      }

      console.log(`Slack: returning ${contacts.length} contacts`);
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
          out: msg.user === authUserId,
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
