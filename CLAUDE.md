# The Bridge

Speech-to-messenger plugin for Even Realities G2 smart glasses. Records speech via G2 mic, transcribes with OpenAI Whisper, sends to Telegram, Slack, or Gmail.

## Commands

```bash
npm run dev       # development with hot reload
npm run dev:sim   # development + G2 simulator
npm run build     # compile TypeScript + copy public assets
npm start         # run compiled output
```

## Architecture

```
[G2 Glasses] --BLE--> [Phone WebView] --WebSocket--> [Node.js Server]
                                                           |
                                                    [OpenAI Whisper API]
                                                           |
                                                    [Messenger API]
                                              (Telegram / Slack / Gmail)
```

- **Server**: Express + WebSocket (`ws`) — `src/server.ts` (composition root), `src/routes/`, `src/services/`, `src/websocket.ts`
- **Frontend**: `src/public/index.html` (CSS + HTML shell) + ES modules in `src/public/js/`
- **Messengers**: Abstracted via `Messenger` interface in `src/messengers/`
- **G2 SDK**: `@evenrealities/even_hub_sdk@0.0.9` injected as `EvenAppBridge` in the WebView

## Key Conventions

- TypeScript with ES modules (`"type": "module"` in package.json)
- Messenger abstraction: all messengers implement `Messenger` interface (`src/messengers/types.ts`)
- Adding a new messenger: create `src/messengers/<name>.ts`, add to factory in `src/messengers/index.ts`
- G2 display uses container model (text, list, image) — no DOM/CSS on glasses

## Environment

Credentials are managed via the browser Settings UI (stored in `settings.json`), with env var fallback for backwards compatibility. `.env` is used only for app-level config like `PORT`.

Requires at least one messenger configured in Settings:
- **OpenAI**: API key (required for speech-to-text)
- **Telegram**: API ID + API Hash + phone auth
- **Slack**: User OAuth Token
- **Gmail**: Email address + App password

## G2 SDK v0.0.9 Notes

- Max 12 containers per page (up to 8 text + 4 image), exactly one must have `isEventCapture: 1`
- Image max size: 288x144 px. `updateImageRawData` calls must be sequential (no concurrent sends)
- `borderRadius` spelling fixed (was `borderRdaius` in older versions)
- IMU control: `bridge.imuControl(true, ImuReportPace)` — data via `sysEvent.imuData` (x, y, z)
- Launch source: `bridge.onLaunchSource(cb)` — `'appMenu' | 'glassesMenu'`, fires once on load
- Event source: `sysEvent.eventSource` distinguishes glasses-R (1), ring (2), glasses-L (3)

## G2 Gotchas

- `CLICK_EVENT` (0) normalised to `undefined` by SDK — always check `eventType === 0 || eventType === undefined`
- `currentSelectItemIndex` missing for index 0 in list events — track selection in app state
- Simulator sends `sysEvent` for clicks; real hardware sends `textEvent`/`listEvent` — handle all three

## Skills

See `.claude/skills/` for detailed domain references:
- `g2-sdk` — G2 glasses SDK v0.0.9: display, events, audio, IMU, launch source, containers, simulator
- `evenhub-cli` — EvenHub CLI: packing .ehpk, app.json config, QR codes, developer auth
- `design-system` — UI design tokens (even-toolkit), color system, typography, component patterns
- `qr` — Generate QR code PNG for the The Bridge ngrok tunnel
- `express-app` — App architecture: Express server patterns, frontend ES module structure, state management
