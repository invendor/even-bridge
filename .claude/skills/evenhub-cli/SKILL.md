---
name: evenhub-cli
description: >
  EvenHub CLI reference for packing, publishing, and managing Even Realities G2 apps.
  Use when building .ehpk packages, configuring app.json, generating QR codes,
  or working with the EvenHub developer platform.
---

# EvenHub CLI Reference

> CLI tool for packing and managing Even Realities G2 apps. Binary: `evenhub` or `eh`. Installed as devDependency — use via `npx evenhub`.

---

## Commands

### `evenhub qr` — Generate QR Code

```bash
npx evenhub qr --url "https://your-tunnel.ngrok-free.app"
```

| Option | Description |
|---|---|
| `-u, --url <url>` | Full URL (overrides other options) |
| `-i, --ip <ip>` | IP address or hostname |
| `-p, --port [port]` | Port |
| `--https` / `--http` | Force scheme |
| `-e, --external` | Open QR as PNG in external program |
| `-s, --scale <scale>` | Scale for external PNG (default: 4) |
| `--clear` | Clear cached settings |

Auto-detects local IP if not provided. Caches settings in `~/.config/evenhub/qr.yaml`.

### `evenhub init` — Initialize app.json

```bash
npx evenhub init
npx evenhub init -d ./my-project
npx evenhub init -o ./custom/path/app.json
```

| Option | Description |
|---|---|
| `-d, --directory <dir>` | Directory to create in (default: `./`) |
| `-o, --output <path>` | Output file path (overrides `--directory`) |

Errors if `app.json` already exists at target path.

### `evenhub login` — Authenticate

```bash
npx evenhub login
npx evenhub login --email user@example.com
```

Prompts for email and password. Stores JWT credentials in `~/.config/evenhub/credentials.yaml`.

Required for `--check` flag during pack. Uses the same account as the Even App.

### `evenhub pack` — Pack .ehpk

```bash
npx evenhub pack app.json ./dist -o the-bridge.ehpk
```

| Argument/Option | Description |
|---|---|
| `<json>` | Path to `app.json` metadata file |
| `<project>` | Path to built project folder (dist, build, etc.) |
| `-o, --output <file>` | Output filename (default: `out.ehpk`) |
| `--no-ignore` | Include hidden files (dotfiles) |
| `-c, --check` | Check if package_id is available (requires login) |

**What it does:**
1. Validates `app.json` against schema
2. Verifies entrypoint file exists in project folder
3. Recursively packs all files (skips dotfiles by default)
4. Outputs `.ehpk` binary

---

## app.json Format

All fields are **required**.

```json
{
  "package_id": "com.thebridge.app",
  "edition": "202601",
  "name": "The Bridge",
  "version": "1.3.4",
  "min_app_version": "2.0.0",
  "min_sdk_version": "0.0.9",
  "entrypoint": "public/index.html",
  "permissions": [
    {
      "name": "network",
      "desc": "Connect to server for speech-to-text and messenger APIs",
      "whitelist": ["https://*.ngrok-free.app"]
    },
    {
      "name": "g2-microphone",
      "desc": "Record voice messages for transcription"
    }
  ],
  "supported_languages": ["en"]
}
```

### Field Constraints

| Field | Type | Constraints |
|---|---|---|
| `package_id` | string | Reverse-domain: `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$`, min 2 segments |
| `edition` | enum | Only `"202601"` currently valid |
| `name` | string | Max 20 characters |
| `version` | string | Semver: `x.y.z` |
| `min_app_version` | string | Minimum Even App version |
| `min_sdk_version` | string | Minimum SDK version |
| `entrypoint` | string | Path to entry HTML relative to project folder |
| `permissions` | array | See permission types below |
| `supported_languages` | array | Valid: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko` |

### Permission Types

| Name | Description | Extra Fields |
|---|---|---|
| `network` | Internet access | `whitelist`: array of URL strings (optional) |
| `g2-microphone` | G2 glasses microphone | — |
| `phone-microphone` | Phone microphone | — |
| `album` | Photo album access | — |
| `location` | Location access | — |
| `camera` | Camera access | — |

Each permission requires `desc` (1–300 chars) explaining why it's needed.

---

## Build & Pack Workflow for The Bridge

```bash
# 1. Build the project
npm run build

# 2. Pack into .ehpk
npx evenhub pack app.json ./dist -o the-bridge.ehpk

# 3. (Optional) Check package_id availability
npx evenhub pack app.json ./dist --check
```

**Important notes:**
- The `entrypoint` is relative to the project folder passed to `pack` (e.g., `./dist`)
- Our build copies `src/public/` to `dist/public/`, so entrypoint is `public/index.html`
- Hidden files (dotfiles) are excluded by default
- Keep `app.json` version in sync with `package.json` version and `BUILD_VERSION` in state.js

---

## Environment Variables

| Variable | Description |
|---|---|
| `EVENHUB_BASE_URL` | Override API base URL (default: `https://evenhub.evenrealities.com`) |
| `EVENHUB_API_HEADERS` | Extra headers as `key:value\|key:value` |
| `EVENHUB_API_DEBUG` | Enable API debug logging |

---

## Config Locations

| File | Path | Purpose |
|---|---|---|
| Credentials | `~/.config/evenhub/credentials.yaml` | JWT auth tokens |
| QR cache | `~/.config/evenhub/qr.yaml` | Cached QR code settings |
