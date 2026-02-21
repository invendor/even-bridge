# Even Realities G2 – AI Agent Development Reference

> Use this document when building or modifying apps for the Even G2 smart glasses. It contains all SDK APIs, hardware constraints, display rules, event handling, audio format details, and known quirks needed to write correct G2 code.

---

## Hardware Summary

- Dual micro-LED displays (green), 576x288 px per eye, 4-bit greyscale (16 shades)
- BLE 5.x (~28m range), paired via iPhone or Android (Even App)
- Microphone (SDK accessible), no camera, no speaker
- R1 control ring for scroll/click input
- Touch gestures on temple tips

## Architecture

```
[Your server] <--HTTPS--> [Phone WebView] <--BLE--> [G2 Glasses]
```

- Your web app runs on your server (any hosting)
- The Even App (Flutter, iOS/Android) opens your URL in `flutter_inappwebview`
- The glasses are a display + input peripheral — no code runs on them
- The SDK injects `EvenAppBridge` into the WebView's `window` object

## SDK Setup

```bash
npm install @evenrealities/even_hub_sdk
```

```typescript
import { waitForEvenAppBridge, EvenAppBridge } from '@evenrealities/even_hub_sdk'

// Async (recommended)
const bridge = await waitForEvenAppBridge()

// Synchronous (only after bridge is ready)
const bridge = EvenAppBridge.getInstance()
```

---

## Display System

### Canvas

- 576x288 pixels, origin (0,0) at top-left
- All colours converted to 4-bit greyscale (16 levels of green)
- White = bright green, black = off

### Container Rules

- Max **4 containers per page** (mixed types allowed)
- Exactly **one** container must have `isEventCapture: 1`
- Containers positioned absolutely with pixel coordinates
- No CSS, no flexbox, no DOM — firmware renders directly
- Containers can overlap; later declarations draw on top

### Shared Container Properties

| Property | Type | Range | Notes |
|---|---|---|---|
| `xPosition` | number | 0–576 | Left edge px |
| `yPosition` | number | 0–288 | Top edge px |
| `width` | number | 0–576 | (20–200 for images) |
| `height` | number | 0–288 | (20–100 for images) |
| `containerID` | number | any | Unique per page |
| `containerName` | string | max 16 chars | Unique per page |
| `isEventCapture` | number | 0 or 1 | Exactly one must be 1 |
| `borderWidth` | number | 0–5 | 0 = no border |
| `borderColor` | number | 0–15 (list), 0–16 (text) | Greyscale level |
| `borderRdaius` | number | 0–10 | Note: typo preserved from SDK protobuf |
| `paddingLength` | number | 0–32 | Uniform padding all sides |

### Text Containers (`TextContainerProperty`)

Plain text, left-aligned, top-aligned. No font size, bold, italic, or alignment options.

```typescript
new TextContainerProperty({
  xPosition: 0, yPosition: 0, width: 576, height: 288,
  borderWidth: 0, borderColor: 5, paddingLength: 4,
  containerID: 1, containerName: 'main-text',
  content: 'Hello from G2',
  isEventCapture: 1,
})
```

**Content limits:**
- `createStartUpPageContainer`: max **1000 chars**
- `textContainerUpgrade`: max **2000 chars**
- `rebuildPageContainer`: max **1000 chars**

**Behaviour:**
- Text wraps at container width; overflows scroll if `isEventCapture: 1`
- `\n` for line breaks, Unicode works (arrows, box-drawing chars)
- ~400–500 chars fill a full-screen container
- To "centre" text, pad with spaces manually
- Paginate long text into ~400-char pages for best UX

**Partial update:**

```typescript
await bridge.textContainerUpgrade(new TextContainerUpgrade({
  containerID: 1,
  containerName: 'main-text',
  contentOffset: 0,
  contentLength: 100,
  content: 'Updated text',
}))
```

### List Containers (`ListContainerProperty`)

Native scrollable list — firmware handles scroll highlighting.

```typescript
new ListContainerProperty({
  xPosition: 0, yPosition: 0, width: 576, height: 288,
  borderWidth: 1, borderColor: 13, borderRdaius: 6, paddingLength: 5,
  containerID: 1, containerName: 'my-list',
  isEventCapture: 1,
  itemContainer: new ListItemContainerProperty({
    itemCount: 5,
    itemWidth: 560,
    isItemSelectBorderEn: 1,
    itemName: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
  }),
})
```

| Property | Range | Notes |
|---|---|---|
| `itemCount` | 1–20 | Must match `itemName.length` |
| `itemWidth` | pixels | 0 = auto-fill |
| `isItemSelectBorderEn` | 0 or 1 | Selection highlight |
| `itemName` | max 64 chars each | Plain text, single line |

**Key:** Cannot update items in-place — must `rebuildPageContainer`. Click events report `currentSelectItemIndex` and `currentSelectItemName`.

### Image Containers (`ImageContainerProperty`)

```typescript
new ImageContainerProperty({
  xPosition: 200, yPosition: 100, width: 100, height: 50,
  containerID: 3, containerName: 'logo',
})
```

| Constraint | Value |
|---|---|
| Width | 20–200 px |
| Height | 20–100 px |
| Colour | 4-bit greyscale |
| Data formats | `number[]`, `Uint8Array`, `ArrayBuffer`, base64 string |
| Concurrent sends | **Not allowed** — queue sequentially |
| Startup | Cannot send data during `createStartUpPageContainer` — create empty, then `updateImageRawData` |
| Tiling | Image tiles if smaller than container — always match sizes |

---

## Input Events

### Event Types (`OsEventTypeList`)

| Event | Value | Source |
|---|---|---|
| `CLICK_EVENT` | 0 | Ring tap, temple tap |
| `SCROLL_TOP_EVENT` | 1 | Scroll reaches top boundary |
| `SCROLL_BOTTOM_EVENT` | 2 | Scroll reaches bottom boundary |
| `DOUBLE_CLICK_EVENT` | 3 | Double-tap |
| `FOREGROUND_ENTER_EVENT` | 4 | App comes to foreground |
| `FOREGROUND_EXIT_EVENT` | 5 | App goes to background |
| `ABNORMAL_EXIT_EVENT` | 6 | Unexpected disconnect |

### Event Delivery

```typescript
bridge.onEvenHubEvent((event: EvenHubEvent) => {
  // event.listEvent  — from list containers
  // event.textEvent  — from text containers
  // event.sysEvent   — system-level events
  // event.audioEvent — microphone PCM data
  // event.jsonData   — raw payload for debugging
})
```

**List event fields:** `containerID`, `containerName`, `currentSelectItemName`, `currentSelectItemIndex`, `eventType`
**Text event fields:** `containerID`, `containerName`, `eventType`
**System event fields:** `eventType` only

### Critical Event Quirks

1. **`CLICK_EVENT = 0` becomes `undefined`** — SDK normalises `0` to `undefined`. Always check:
   ```typescript
   if (eventType === 0 || eventType === undefined) { /* click */ }
   ```

2. **`currentSelectItemIndex` missing for index 0** — fall back to tracking selection in app state.

3. **Event routing depends on `isEventCapture`** — the container with capture determines `listEvent` vs `textEvent`.

4. **Simulator vs real device** — simulator sends `sysEvent` for button clicks; real hardware sends `textEvent` or `listEvent`. Handle all three sources.

5. **Swipe throttling** — use a ~300ms cooldown to prevent duplicate actions.

---

## Page Lifecycle

### `createStartUpPageContainer`

Call **exactly once** at startup. Returns `StartUpPageCreateResult` (0=success, 1=invalid, 2=oversize, 3=outOfMemory).

```typescript
await bridge.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 1,
  textObject: [textContainer],
}))
```

### `rebuildPageContainer`

Full page replace — all containers destroyed and recreated. Scroll/selection state is lost. Brief flicker on hardware.

```typescript
await bridge.rebuildPageContainer(new RebuildPageContainer({
  containerTotalNum: 1,
  textObject: [newTextContainer],
}))
```

### `textContainerUpgrade`

In-place text update. Faster, no flicker. Returns `boolean`.

### `updateImageRawData`

Update image container data. Must be called after page creation. Returns `ImageRawDataUpdateResult`. **No concurrent sends.**

### `shutDownPageContainer`

```typescript
await bridge.shutDownPageContainer(0) // 0 = immediate, 1 = confirm dialog
```

---

## Audio

```typescript
// Open microphone (requires createStartUpPageContainer first)
bridge.audioControl(true)

// Close microphone
bridge.audioControl(false)
```

**PCM format:**
- Sample rate: **16kHz**
- Frame length: **10ms** (dtUs 10000)
- Frame size: **40 bytes** (160 samples x 2 bytes)
- Encoding: **PCM S16LE** (signed 16-bit little-endian)
- Channels: **mono**

**Receiving audio:**

```typescript
bridge.onEvenHubEvent((event) => {
  if (event.audioEvent?.audioPcm) {
    const pcmData: Uint8Array = event.audioEvent.audioPcm
    // 40 bytes of 16kHz mono PCM S16LE per event
  }
})
```

---

## Device Info

```typescript
const device = await bridge.getDeviceInfo()
// device.model — DeviceModel.G1 | DeviceModel.G2 | DeviceModel.Ring1
// device.sn — serial number
// device.status.batteryLevel — 0-100
// device.status.isWearing — boolean
// device.status.isCharging — boolean
// device.status.connectType — DeviceConnectType

// Real-time monitoring
const unsub = bridge.onDeviceStatusChanged((status) => { ... })
```

## User Info

```typescript
const user = await bridge.getUserInfo()
// user.uid, user.name, user.avatar, user.country
```

## Local Storage (phone-side)

```typescript
await bridge.setLocalStorage('key', 'value') // returns boolean
const value = await bridge.getLocalStorage('key') // returns string
```

---

## What the SDK Does NOT Expose

- No direct BLE access
- No arbitrary pixel drawing (container model only)
- No audio output (no speaker)
- No text alignment (no centre/right)
- No font size, weight, or family
- No background colour or fill
- No per-item list styling
- No programmatic scroll position control
- No animations or transitions

---

## UI Patterns

### Fake Buttons with Text

```
> Return
  Delete note
```
Track cursor position, update via `textContainerUpgrade`.

### Progress Bars with Unicode

```typescript
const bar = '━'.repeat(n) + '─'.repeat(total - n)
```

### Multi-Slot Layout

Multiple text containers as rows (e.g. 3 at `height: 96` = 288px total). Toggle `borderWidth` for selection highlight.

### Event Capture for Image Apps

Place a full-screen text container (content: `' '`) with `isEventCapture: 1` behind the image container for input events.

### Page Flipping for Long Text

Pre-paginate into ~400-char pages. Track `pageIndex`, rebuild on scroll boundary events.

---

## Simulator

Install: `npm install -g @evenrealities/evenhub-simulator`

```bash
evenhub-simulator [OPTIONS] [targetUrl]
```

| Option | Description |
|---|---|
| `-c, --config` | Config file path |
| `-g, --glow / --no-glow` | Toggle display glow |
| `--list-audio-input-devices` | List mic devices |
| `--aid` | Select audio input device |

**Simulator caveats:** Font rendering differs, list scrolling varies, image processing is faster, status events may not fire. Always test on real hardware.

---

## CLI Tools (`@evenrealities/evenhub-cli`)

```bash
npm install -D @evenrealities/evenhub-cli
```

| Command | Description |
|---|---|
| `evenhub qr --url "http://IP:PORT"` | QR code for sideloading |
| `evenhub pack app.json dist` | Package `.ehpk` for distribution |
| `evenhub login` | Authenticate developer account |
| `evenhub init` | Generate `app.json` template |

---

## Error Codes

| Context | Code | Meaning |
|---|---|---|
| Page create | 0 | Success |
| Page create | 1 | Invalid config |
| Page create | 2 | Oversize |
| Page create | 3 | Out of memory |
| Image update | `imageException` | Processing error |
| Image update | `imageSizeInvalid` | Wrong dimensions |
| Image update | `imageToGray4Failed` | Greyscale conversion failed |
| Image update | `sendFailed` | BLE send failed |

---

## Reference Apps

| App | Source | Notes |
|---|---|---|
| chess | https://github.com/dmyster145/EvenChess | Complex reference, tests, modular |
| reddit | https://github.com/fuutott/rdt-even-g2-rddit-client | Packaging reference, API proxy |
| weather | https://github.com/nickustinov/weather-even-g2 | Settings UI, simple reference |
| tesla | https://github.com/nickustinov/tesla-even-g2 | Image rendering, backend server |
| pong | https://github.com/nickustinov/pong-even-g2 | Canvas game, image container |
| snake | https://github.com/nickustinov/snake-even-g2 | Canvas game, image container |
