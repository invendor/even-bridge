import "dotenv/config";
import { createServer } from "http";
import { getAvailableMessengerNames } from "./messengers/index.js";
import app, { getActiveMessenger, setActiveMessenger } from "./app.js";
import { attachWebSocket } from "./websocket.js";
import { loadLastRecipient } from "./services/lastRecipient.js";

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing required env var: OPENAI_API_KEY");
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = createServer(app);
attachWebSocket(server, { getActiveMessenger, setActiveMessenger });

async function main() {
  const available = getAvailableMessengerNames();
  console.log(`Available messengers: ${available.join(", ") || "none"}`);

  if (available.length === 0) {
    console.warn(
      "No messenger credentials configured. Set TELEGRAM_API_ID+TELEGRAM_API_HASH or SLACK_USER_TOKEN in .env"
    );
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    const name = getActiveMessenger()?.name?.toLowerCase() || "unknown";
    const lastRecipient = loadLastRecipient(name);
    console.log(`Last recipient: ${lastRecipient ? lastRecipient.name : "none"}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
