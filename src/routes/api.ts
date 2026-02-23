import { Router } from "express";
import type { Messenger } from "../messengers/types.js";
import { getAvailableMessengerNames } from "../messengers/index.js";
import { loadLastRecipient } from "../services/lastRecipient.js";

export function createApiRouter(getActiveMessenger: () => Messenger | null): Router {
  const router = Router();

  router.get("/available-messengers", (_req, res) => {
    res.json(getAvailableMessengerNames());
  });

  router.get("/contacts", async (_req, res) => {
    try {
      const messenger = getActiveMessenger();
      if (!messenger) {
        res.status(400).json({ error: "No messenger selected" });
        return;
      }
      console.time("api:contacts");
      const contacts = await messenger.getContacts();
      console.timeEnd("api:contacts");
      res.json(contacts);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  router.get("/last-recipient", (_req, res) => {
    const messenger = getActiveMessenger();
    const name = messenger?.name?.toLowerCase() || "unknown";
    const last = loadLastRecipient(name);
    res.json(last);
  });

  router.get("/messages/:entityId", async (req, res) => {
    try {
      const messenger = getActiveMessenger();
      if (!messenger) {
        res.status(400).json({ error: "No messenger selected" });
        return;
      }
      const messages = await messenger.getMessages(req.params.entityId, 4);
      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  return router;
}
