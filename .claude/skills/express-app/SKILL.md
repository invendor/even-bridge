---
name: express-app
description: >
  Even Bridge app architecture reference. Use when adding features, refactoring
  server or frontend code, creating new routes, services, or UI modules.
  Covers Express server patterns, frontend ES module structure, state management,
  and file organization conventions.
---

# Even Bridge — App Architecture Reference

This document defines the architecture patterns, module structure, and coding conventions for the Even Bridge application. All new code must follow these guidelines.

## Server Architecture

### Directory Structure

```
src/
  app.ts                 # Express app config — middleware, routes, static serving
  server.ts              # Entry point — creates HTTP server, attaches WebSocket, starts listening
  routes/
    api.ts               # All /api/* Express route handlers
  services/
    audio.ts             # Audio processing (PCM→WAV, Whisper transcription)
    lastRecipient.ts     # Last recipient JSON persistence
  websocket.ts           # WebSocket connection handler
  messengers/            # Messenger abstraction layer
    types.ts             # Messenger interface + Contact/Message types
    index.ts             # Factory: getAvailableMessengerNames(), createMessenger()
    telegram.ts          # Telegram implementation
    slack.ts             # Slack implementation
```

### Patterns

#### App / Server Split

- **`app.ts`** — creates and configures the Express app (middleware, static serving, routes). Exports the `app` instance and shared state accessors (`getActiveMessenger`, `setActiveMessenger`). Can be imported in tests without starting the server.
- **`server.ts`** — entry point. Imports `app`, creates the HTTP server, attaches WebSocket, starts listening. Contains no app configuration logic.

```typescript
// app.ts — exports configured Express app + state accessors
export function getActiveMessenger(): Messenger | null { return activeMessenger; }
export function setActiveMessenger(m: Messenger): void { activeMessenger = m; }
export default app;

// server.ts — imports and starts
import app, { getActiveMessenger, setActiveMessenger } from "./app.js";
const server = createServer(app);
attachWebSocket(server, { getActiveMessenger, setActiveMessenger });
```

#### Route Modules (`routes/*.ts`)

- Export a factory function that returns an Express `Router`
- Receive dependencies via parameters (e.g., `getActiveMessenger` getter)
- Never import mutable state directly — use injected getters

```typescript
import { Router } from "express";
export function createApiRouter(getActiveMessenger: () => Messenger | null): Router {
  const router = Router();
  router.get("/contacts", async (_req, res) => { ... });
  return router;
}
```

#### Service Modules (`services/*.ts`)

- Pure functions with no side effects on shared state
- Accept all dependencies as parameters (no closure over module state)
- Example: `saveLastRecipient(messengerName, recipient)` — takes messenger name as param

#### WebSocket Handler (`websocket.ts`)

- Exports `attachWebSocket(server, context)` function
- Receives a context object with `getActiveMessenger` / `setActiveMessenger`
- Audio chunks are per-connection (local to the `ws.on("connection")` callback)

#### Messenger Abstraction (`messengers/`)

- All messengers implement the `Messenger` interface from `types.ts`
- Factory in `index.ts` handles instantiation and env-var checking
- Adding a new messenger: create `messengers/<name>.ts`, add to factory

### Adding a New Route

1. Add the handler to `routes/api.ts` (or create a new route file if it's a separate concern)
2. If new route file: export a factory function, mount in `server.ts` with `app.use()`
3. Keep error handling per-route with try/catch

### Adding a New Service

1. Create `services/<name>.ts`
2. Export pure functions — pass all dependencies as parameters
3. Import in the modules that need it (routes, websocket, etc.)

## Frontend Architecture

### Directory Structure

```
src/public/
  index.html             # CSS + HTML shell only (no JavaScript)
  js/
    main.js              # Entry point: init, event wiring, G2 event handler
    state.js             # Shared state singleton (S) + state transition functions
    api.js               # fetchWithTimeout + all API calls
    ws.js                # WebSocket connect + message dispatch
    recording.js         # Audio capture (G2 + browser)
    history.js           # localStorage persistence + rendering
    utils.js             # Pure utilities: log, setStatus, formatters
    ui/
      browser.js         # Browser DOM rendering functions
      glasses.js         # G2 glasses display functions
```

### Key Conventions

#### ES Modules (No Bundler)

- All frontend JS files are plain ES modules (`.js`)
- Loaded via `<script type="module" src="js/main.js">` in `index.html`
- Imports use relative paths: `import { S } from "./state.js"`
- No TypeScript on frontend — plain JavaScript only

#### State Singleton (`state.js`)

All shared state lives in a single exported object `S`:

```javascript
export const S = {
  ws: null,
  isRecording: false,
  bridge: null,
  isG2: false,
  appState: "startup",
  contacts: [],
  selectedContact: null,
  // ... etc
};
```

**Rules:**
- Every state access uses `S.fieldName` — immediately identifiable as shared state
- State transition functions (`goToMessengerSelect`, `goToContacts`, etc.) live in `state.js`
- UI modules read from `S` but never call transition functions directly
- No framework, no Proxy, no event bus — direct mutation

#### Module Dependencies

**Dependency direction (arrows = "imports from"):**

```
main.js → state.js → ui/browser.js → state.js (read S only)
  ↓          ↓        ui/glasses.js → state.js (read S only)
  ↓          ↓
  ↓          ├→ api.js → state.js (read S.pageAbort)
  ↓          ├→ history.js → utils.js
  ↓          └→ utils.js
  ↓
  ├→ ws.js → state.js
  ├→ recording.js → state.js, ui/browser.js, ui/glasses.js
  └→ history.js
```

**Rules:**
- `utils.js` is a pure leaf — zero project imports
- `history.js` only imports from `utils.js`
- UI modules (`ui/browser.js`, `ui/glasses.js`) read `S` for data but receive callbacks for user actions
- `ws.js` dispatches to `handleServerMessage()` in `state.js`
- Circular imports between `state.js` ↔ `api.js` and `state.js` ↔ `ui/*.js` are safe (call-time resolution)

#### DOM References

- `utils.js`, `history.js`, and `ui/browser.js` receive DOM elements via `init*()` functions called once from `main.js`
- DOM elements are never stored on `S` — they are module-private variables

```javascript
// In utils.js
let statusEl, logEl;
export function initUtils(elements) {
  statusEl = elements.statusEl;
  logEl = elements.logEl;
}
```

#### UI Module Pattern

Browser and glasses UI modules are "dumb renderers":
- Read `S` for data to display
- Receive callbacks for user actions (to avoid importing transition functions)
- Export `show*`, `hide*`, `update*` functions

```javascript
// Caller in state.js:
showBrowserMessengerList((name) => selectMessenger(name));
showBrowserContacts((contact) => goToConversation(contact));

// In browser.js — receives callback, doesn't import selectMessenger:
export function showBrowserMessengerList(onSelect) {
  // ... build HTML ...
  btn.addEventListener("click", () => onSelect(btn.dataset.name));
}
```

#### Bridge Detection (`withTimeout` pattern)

G2 bridge detection uses a `withTimeout` utility for clean timeout handling:

```javascript
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Bridge not detected within ${ms}ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// Usage:
S.bridge = await withTimeout(sdk.waitForEvenAppBridge(), 2000);
```

Prefer `withTimeout` over `Promise.race` with inline rejection for readability.

### Adding a New Frontend Module

1. Create `js/<name>.js`
2. Import `S` from `./state.js` if you need shared state
3. Import utilities from `./utils.js`
4. If the module needs DOM elements, add an `init<Name>(elements)` function
5. Call the init function from `main.js` during initialization
6. Export focused functions with clear responsibilities

### Adding a New UI View

1. Add HTML structure to `index.html` (hidden by default with `display: none`)
2. Add CSS styles in the `<style>` block using design system tokens
3. Add `show*` / `hide*` functions to `ui/browser.js` (and `ui/glasses.js` for G2)
4. Add state transition logic to `state.js`
5. Wire G2 event handling in `main.js` (inside the `onEvenHubEvent` callback)

## TypeScript Conventions (Server Only)

- ES modules with `.js` extensions in imports (`import ... from "./foo.js"`)
- `"module": "NodeNext"` in tsconfig
- Strict mode enabled
- Interfaces over type aliases for object shapes
- Explicit return types on exported functions

## Build & Dev

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development with hot reload (tsx watch) |
| `npm run dev:sim` | Development + G2 simulator |
| `npm run build` | Compile TypeScript + copy `src/public/` to `dist/` |
| `npm start` | Run compiled output from `dist/` |

The build copies `src/public/` to `dist/public/` so frontend JS modules are available in production. During development, Express serves from both `dist/public/` and `src/public/` (source wins for hot reload).
