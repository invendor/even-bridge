import "dotenv/config";
import { createServer } from "http";
import { getAvailableMessengerNames } from "./messengers/index.js";
import app, { getActiveMessenger, setActiveMessenger } from "./app.js";
import { attachWebSocket } from "./websocket.js";
import { loadLastRecipient } from "./services/lastRecipient.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = createServer(app);
attachWebSocket(server, { getActiveMessenger, setActiveMessenger });

async function main() {
  const available = getAvailableMessengerNames();
  console.log(`Available messengers: ${available.join(", ") || "none"}`);

  if (available.length === 0) {
    console.warn(
      "No messenger credentials configured. Open the app in a browser to configure via Settings."
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
