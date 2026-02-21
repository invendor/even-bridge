# even-bridge

Speech-to-Messenger plugin for Even G2 smart glasses.

Tap on your G2 glasses to record speech, which gets transcribed via OpenAI Whisper and sent to your messenger chat.

## Architecture

```
[G2 Glasses] --BLE--> [Phone WebView] --WebSocket--> [Node.js Server]
                                                           |
                                                    [OpenAI Whisper API]
                                                           |
                                                    [Telegram Client API]
```

The app uses the G2 web-proxy model: the server hosts a web page, the Even App (iOS or Android) loads it in a WebView, and the glasses act as a BLE display + input peripheral. The SDK injects `EvenAppBridge` into the WebView for JavaScript-to-native communication.

## How It Works

1. **Tap to start** — glasses display startup screen. A ring tap or temple tap loads your pinned Telegram contacts.
2. **Select contact** — scroll through your pinned contacts and tap to select who to send the message to. The last contacted person is remembered.
3. **Double tap to record** — the G2 microphone opens (`bridge.audioControl(true)`) and streams raw PCM audio (16kHz, 16-bit, mono) over WebSocket to the server.
4. **Tap to stop** — another tap closes the mic, the server converts accumulated PCM to WAV and sends it to OpenAI Whisper for transcription.
5. **Telegram delivery** — the transcribed text is sent from your personal Telegram account to the selected contact. The glasses display a confirmation with a preview.

## G2 SDK Details

| Feature | Implementation |
|---|---|
| Audio format | PCM S16LE, 16kHz, mono, 10ms frames (40 bytes each) |
| Mic control | `bridge.audioControl(true/false)` |
| Audio data | `audioEvent.audioPcm` (Uint8Array) via `bridge.onEvenHubEvent()` |
| Display | Single `TextContainerProperty` container (576x288px) |
| Display updates | `textContainerUpgrade` for in-place text changes |
| Input | `CLICK_EVENT` (0) — handled with `=== 0 \|\| === undefined` quirk |
| Display limits | 1000 chars at startup, 2000 via upgrade |

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key from [platform.openai.com](https://platform.openai.com) |
| `TELEGRAM_API_ID` | Your API ID from [my.telegram.org](https://my.telegram.org) |
| `TELEGRAM_API_HASH` | Your API Hash from [my.telegram.org](https://my.telegram.org) |
| `PORT` | Server port (default: 3000) |

On first run, you'll be prompted in the terminal to enter your phone number and a verification code. After that, the session is saved to `telegram-session.txt` and you won't need to re-authenticate.

## Run

```bash
npm run dev       # development with hot reload
npm run dev:sim   # development with hot reload + G2 simulator
npm run build     # compile TypeScript
npm start         # run compiled output
```

## Testing

**Browser fallback** — open `http://localhost:3000` in your browser. The app detects no G2 bridge and falls back to using your computer's microphone via the Web Audio API. Click the record button to test the full flow.

**G2 glasses** — deploy the server to a public URL (or use a tunnel like ngrok) and set the app URL in the Even App on your iPhone or Android device.

## Project Structure

```
src/
  server.ts                    Express + WebSocket + Whisper + Telegram
  public/
    index.html                 G2 glasses frontend + browser fallback UI
    logo.png                   Brand logo image
    logo-data.json             Logo encoded as greyscale pixel data for G2 display
    telegram-icon-data.json    Telegram icon encoded for G2 display
  scripts/
    pngEncoder.ts              PNG encoder with CRC32/Adler32 checksums
SKILL.md                       G2 SDK reference for AI agents
DESIGN.md                      G2 UI design system and component patterns
```

## Tech Stack

- **Server** — Express, WebSocket (`ws`), TypeScript
- **Speech-to-text** — OpenAI Whisper API
- **Telegram** — GramJS (Telegram Client API, sends as your user account)
- **G2 SDK** — `@evenrealities/even_hub_sdk`
