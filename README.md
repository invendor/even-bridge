# even-bridge

Speech-to-Messenger plugin for Even G2 smart glasses.

Record speech, which gets transcribed via OpenAI Whisper and sent to your messenger chat. Supports **Telegram** and **Slack**.

## Architecture

```
[G2 Glasses] --BLE--> [Phone WebView] --WebSocket--> [Node.js Server]
                                                           |
                                                    [OpenAI Whisper API]
                                                           |
                                                    [Messenger API]
                                                    (Telegram / Slack)
```

The app uses the G2 web-proxy model: the server hosts a web page, the Even App (iOS or Android) loads it in a WebView, and the glasses act as a BLE display + input peripheral. The SDK injects `EvenAppBridge` into the WebView for JavaScript-to-native communication.

## How It Works

1. **Tap to start** — glasses display startup screen with the Even Bridge logo.
2. **Select messenger** — choose between Telegram, Slack, or any other configured messenger. Only messengers with valid credentials in `.env` are shown.
3. **Select contact** — scroll through your contacts and tap to select who to send the message to. The last contacted person is remembered.
4. **Double tap to record** — the G2 microphone opens (`bridge.audioControl(true)`) and streams raw PCM audio (16kHz, 16-bit, mono) over WebSocket to the server.
5. **Tap to stop** — another tap closes the mic, the server converts accumulated PCM to WAV and sends it to OpenAI Whisper for transcription.
6. **Messenger delivery** — the transcribed text is sent to the selected contact via your chosen messenger. The glasses display a confirmation with a preview.

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
| `TELEGRAM_API_ID` | *(optional)* Your API ID from [my.telegram.org](https://my.telegram.org) |
| `TELEGRAM_API_HASH` | *(optional)* Your API Hash from [my.telegram.org](https://my.telegram.org) |
| `SLACK_BOT_TOKEN` | *(optional)* Your Slack Bot Token (see [Slack Setup](#slack-setup)) |
| `PORT` | Server port (default: 3000) |

You need at least one messenger configured (Telegram or Slack). You can configure both — the app will let you choose at startup.

### Telegram Setup

1. Go to [my.telegram.org](https://my.telegram.org) and create an app to get your API ID and Hash.
2. Set `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` in `.env`.
3. On first run, you'll be prompted in the terminal to enter your phone number and a verification code. After that, the session is saved to `telegram-session.txt` and you won't need to re-authenticate.

### Slack Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** → **From scratch**.
2. Name it (e.g., "G2 Bridge") and select your workspace.
3. Go to **OAuth & Permissions** and add these **Bot Token Scopes**:
   - `channels:history` — read messages in public channels
   - `channels:read` — list public channels
   - `chat:write` — send messages
   - `groups:history` — read messages in private channels
   - `groups:read` — list private channels
   - `im:history` — read DM messages
   - `im:read` — list DMs
   - `mpim:history` — read group DM messages
   - `mpim:read` — list group DMs
   - `users:read` — resolve user display names
4. Click **Install to Workspace** and authorize.
5. Copy the **Bot User OAuth Token** (`xoxb-...`) and set it as `SLACK_BOT_TOKEN` in `.env`.
6. Invite the bot to any channels you want to message: `/invite @G2Bridge`

Messages are sent as the bot. You can customize the bot's name and profile picture in the Slack app settings to make it feel personal.

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
CLAUDE.md                              Project instructions for AI agents
.claude/
  rules/
    code-style.md                      Auto-loaded coding standards
  skills/
    g2-sdk/SKILL.md                    G2 glasses SDK reference (auto-triggered)
    design-system/SKILL.md             UI design tokens & components (auto-triggered)
src/
  server.ts                            Express + WebSocket + Whisper + messenger routing
  messengers/
    types.ts                           Messenger interface and shared types
    telegram.ts                        Telegram implementation (GramJS)
    slack.ts                           Slack implementation (@slack/web-api)
    index.ts                           Messenger factory and availability check
  public/
    index.html                         G2 glasses frontend + browser fallback UI
    logo.png                           Brand logo image
    logo-data.json                     Logo encoded as greyscale pixel data for G2 display
    telegram-icon-data.json            Telegram icon encoded for G2 display
    slack-icon-data.json               Slack icon encoded for G2 display
  scripts/
    pngEncoder.ts                      PNG encoder with CRC32/Adler32 checksums
    generateSlackIcon.ts               Slack icon generator
```

## Tech Stack

- **Server** — Express, WebSocket (`ws`), TypeScript
- **Speech-to-text** — OpenAI Whisper API
- **Telegram** — GramJS (Telegram Client API, sends as your user account)
- **Slack** — @slack/web-api (Slack Bot API)
- **G2 SDK** — `@evenrealities/even_hub_sdk`
