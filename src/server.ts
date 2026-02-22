import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { getAvailableMessengerNames, createMessenger, type Messenger } from "./messengers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const PORT = parseInt(process.env.PORT || "3000", 10);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing required env var: OPENAI_API_KEY");
  process.exit(1);
}

// --- OpenAI ---
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- Active messenger (set when user selects from UI) ---
let activeMessenger: Messenger | null = null;

// --- WAV Helper ---
function pcmToWav(pcmData: Buffer): Buffer {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);

  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// --- Transcribe with Whisper ---
async function transcribeAudio(pcmBuffer: Buffer): Promise<string> {
  const wavBuffer = pcmToWav(pcmBuffer);

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: new File(
      [wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength)] as BlobPart[],
      "audio.wav",
      { type: "audio/wav" }
    ),
  });

  return response.text;
}

// --- Last recipient persistence ---
const LAST_RECIPIENT_FILE = path.resolve(__dirname, "..", "last-recipient.json");

function loadLastRecipient(): { id: string; name: string; username: string | null } | null {
  try {
    if (existsSync(LAST_RECIPIENT_FILE)) {
      return JSON.parse(readFileSync(LAST_RECIPIENT_FILE, "utf-8"));
    }
  } catch {}
  return null;
}

function saveLastRecipient(recipient: { id: string; name: string; username: string | null }): void {
  writeFileSync(LAST_RECIPIENT_FILE, JSON.stringify(recipient));
}

// --- Express + WebSocket Server ---
const app = express();

const publicDir = path.join(__dirname, "public");
const srcPublicDir = path.resolve(__dirname, "..", "src", "public");
app.use(express.static(publicDir));
app.use(express.static(srcPublicDir));

app.get("/api/available-messengers", (_req, res) => {
  res.json(getAvailableMessengerNames());
});

app.get("/api/contacts", async (_req, res) => {
  try {
    if (!activeMessenger) {
      res.status(400).json({ error: "No messenger selected" });
      return;
    }
    const contacts = await activeMessenger.getContacts();
    res.json(contacts);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.get("/api/last-recipient", (_req, res) => {
  const last = loadLastRecipient();
  res.json(last);
});

app.get("/api/messages/:entityId", async (req, res) => {
  try {
    if (!activeMessenger) {
      res.status(400).json({ error: "No messenger selected" });
      return;
    }
    const messages = await activeMessenger.getMessages(req.params.entityId, 4);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.use(express.json());


const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  const audioChunks: Buffer[] = [];

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    if (!isBinary) {
      const raw = data.toString();
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {}

      if (parsed && parsed.type === "select-messenger") {
        const name = parsed.name;
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        try {
          const messenger = createMessenger(name);
          ws.send(JSON.stringify({ type: "status", text: `Connecting to ${displayName}...` }));
          await messenger.init();
          activeMessenger = messenger;
          ws.send(JSON.stringify({ type: "messenger-selected", name: messenger.name }));
          console.log(`Messenger selected: ${messenger.name}`);
        } catch (err) {
          console.error(`Error initializing ${name}:`, err);
          ws.send(JSON.stringify({ type: "error", text: `Failed to connect to ${displayName}` }));
        }
      } else if (raw === "stop" || (parsed && parsed.type === "stop")) {
        // Transcribe only — don't send yet
        console.log(
          `Recording stopped. Received ${audioChunks.length} audio chunks.`
        );

        if (audioChunks.length === 0) {
          ws.send(JSON.stringify({ type: "error", text: "No audio recorded" }));
          return;
        }

        const pcmBuffer = Buffer.concat(audioChunks);
        audioChunks.length = 0;

        const durationSec = pcmBuffer.length / (16000 * 2);
        console.log(
          `Processing ${pcmBuffer.length} bytes (${durationSec.toFixed(1)}s) of audio...`
        );

        ws.send(JSON.stringify({ type: "status", text: "Transcribing..." }));

        try {
          const transcription = await transcribeAudio(pcmBuffer);
          console.log(`Transcription: "${transcription}"`);

          if (transcription.trim()) {
            ws.send(JSON.stringify({ type: "preview", text: transcription }));
          } else {
            ws.send(JSON.stringify({ type: "error", text: "No speech detected" }));
          }
        } catch (err) {
          console.error("Transcription error:", err);
          ws.send(JSON.stringify({ type: "error", text: "Error transcribing audio" }));
        }
      } else if (parsed && parsed.type === "send") {
        // Send confirmed message
        const { text, recipient, recipientId, recipientName, recipientUsername } = parsed;
        if (!text || !recipient) {
          ws.send(JSON.stringify({ type: "error", text: "Missing text or recipient" }));
          return;
        }

        if (!activeMessenger) {
          ws.send(JSON.stringify({ type: "error", text: "No messenger selected" }));
          return;
        }

        try {
          await activeMessenger.sendMessage(text, recipient);
          if (recipientId) {
            saveLastRecipient({
              id: recipientId,
              name: recipientName || "Unknown",
              username: recipientUsername || null,
            });
          }
          ws.send(JSON.stringify({ type: "sent", text }));
          console.log(`Sent to ${recipient} successfully`);
        } catch (err) {
          console.error("Send error:", err);
          ws.send(JSON.stringify({ type: "error", text: "Error sending message" }));
        }
      }
    } else {
      audioChunks.push(Buffer.from(data));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    audioChunks.length = 0;
  });
});

// --- Start ---
async function main() {
  const available = getAvailableMessengerNames();
  console.log(`Available messengers: ${available.join(", ") || "none"}`);

  if (available.length === 0) {
    console.error(
      "No messenger credentials configured. Set TELEGRAM_API_ID+TELEGRAM_API_HASH or SLACK_BOT_TOKEN in .env"
    );
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    const lastRecipient = loadLastRecipient();
    console.log(`Last recipient: ${lastRecipient ? lastRecipient.name : "none"}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
