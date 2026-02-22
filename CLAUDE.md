# Even Bridge

Speech-to-messenger plugin for Even Realities G2 smart glasses. Records speech via G2 mic, transcribes with OpenAI Whisper, sends to Telegram or Slack.

## Commands

```bash
npm run dev       # development with hot reload
npm run dev:sim   # development + G2 simulator
npm run build     # compile TypeScript (tsc)
npm start         # run compiled output
```

## Architecture

```
[G2 Glasses] --BLE--> [Phone WebView] --WebSocket--> [Node.js Server]
                                                           |
                                                    [OpenAI Whisper API]
                                                           |
                                                    [Messenger API]
                                                    (Telegram / Slack)
```

- **Server**: Express + WebSocket (`ws`) — `src/server.ts`
- **Frontend**: Single `src/public/index.html` served to the G2 WebView (also works in browser as fallback)
- **Messengers**: Abstracted via `Messenger` interface in `src/messengers/`
- **G2 SDK**: `@evenrealities/even_hub_sdk` injected as `EvenAppBridge` in the WebView

## Key Conventions

- TypeScript with ES modules (`"type": "module"` in package.json)
- Messenger abstraction: all messengers implement `Messenger` interface (`src/messengers/types.ts`)
- Adding a new messenger: create `src/messengers/<name>.ts`, add to factory in `src/messengers/index.ts`
- G2 display uses container model (text, list, image) — no DOM/CSS on glasses
- Icons for G2 display are stored as `{width, height, data}` JSON in `src/public/`

## Environment

Requires `.env` with `OPENAI_API_KEY` and at least one messenger:
- Telegram: `TELEGRAM_API_ID` + `TELEGRAM_API_HASH`
- Slack: `SLACK_BOT_TOKEN`

See `.env.example` for template.

## G2 Gotchas

- `CLICK_EVENT` (0) normalised to `undefined` by SDK — always check `eventType === 0 || eventType === undefined`
- `currentSelectItemIndex` missing for index 0 in list events — track selection in app state
- Max 4 containers per page, exactly one must have `isEventCapture: 1`
- Image `updateImageRawData` calls must be sequential (no concurrent sends)
- `borderRdaius` (not `borderRadius`) — typo preserved from SDK protobuf

## Skills

See `.claude/skills/` for detailed domain references:
- `g2-sdk` — G2 glasses SDK: display, events, audio, containers, simulator
- `design-system` — UI design tokens, color system, typography, component patterns
