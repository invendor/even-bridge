---
name: railway
description: >
  Railway deployment reference for Even Bridge. Use when deploying, managing
  environments, checking logs, or configuring Railway infrastructure.
---

# Railway Deployment Reference

> Deploy Even Bridge to Railway for production. Uses Railpack builder (auto-detects Node.js from package.json). Dev stays on localhost + ngrok.

---

## Quick Deploy

```bash
# First time
railway login
railway init                    # or: railway link (existing project)
railway up                      # deploy
railway domain                  # generate public URL

# Subsequent deploys
railway up
```

## MCP Server

Railway MCP is configured in Claude Code. Use natural language to:
- Deploy (`deploy the app`)
- Check logs (`show deploy logs`)
- Manage env vars (`set OPENAI_API_KEY to sk-xxx`)
- List projects/services

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `check-railway-status` | Verify CLI + auth |
| `list-projects` | List all projects |
| `create-project-and-link` | Create + link project |
| `list-services` | Show services |
| `link-service` | Link service to cwd |
| `deploy` | Execute deployment |
| `create-environment` | Create env (staging, etc.) |
| `list-variables` | Show env vars |
| `set-variables` | Set env vars |
| `generate-domain` | Create `.railway.app` domain |
| `get-logs` | Build/deploy logs |

---

## Configuration

### railway.json (in project root)

```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

Config in code **overrides** dashboard settings. Resolution order: environment-specific > base config > dashboard.

### How Railpack Builds

1. Detects `package.json` -> Node.js
2. Runs `npm install` (devDependencies included for `tsc`)
3. Runs `npm run build` (`tsc && cp -r src/public dist/`)
4. Starts with `npm start` (`node dist/server.js`)
5. Sets `NODE_ENV=production`, `NPM_CONFIG_PRODUCTION=false`

### PORT

Railway injects `PORT` at runtime (not 3000). Our server already reads `process.env.PORT || "3000"`, so it works automatically.

---

## Environment Variables

Use env vars for credentials on Railway (not `settings.json`). Our app already supports env var fallback.

### CLI

```bash
railway variable set OPENAI_API_KEY=sk-xxx
railway variable set TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=abc123
railway variable set SLACK_USER_TOKEN=xoxp-xxx
railway variable set GMAIL_ADDRESS=you@gmail.com GMAIL_APP_PASSWORD=xxxx
railway variable list
railway variable delete KEY_NAME
```

### Required Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (required for STT) |

### Optional (at least one messenger)

| Variable | Description |
|----------|-------------|
| `TELEGRAM_API_ID` | Telegram app API ID |
| `TELEGRAM_API_HASH` | Telegram app API hash |
| `SLACK_USER_TOKEN` | Slack User OAuth Token (`xoxp-...`) |
| `GMAIL_ADDRESS` | Gmail email address |
| `GMAIL_APP_PASSWORD` | Gmail 16-char app password |

---

## Useful CLI Commands

```bash
railway login                 # authenticate (opens browser)
railway login --browserless   # headless auth
railway init                  # create new project
railway link                  # link to existing project
railway up                    # deploy
railway up --detach           # deploy without log streaming
railway domain                # generate public URL
railway logs                  # stream runtime logs
railway logs --build          # build logs
railway status                # project info
railway open                  # open dashboard in browser
railway redeploy              # re-run latest deployment
railway restart               # restart service
railway down                  # remove latest deployment
railway run npm start         # run locally with Railway env vars
```

---

## Dev vs Production

| | Dev | Production |
|---|---|---|
| **Run** | `npm run dev` | `npm start` (via Railway) |
| **URL** | `localhost:3000` + ngrok tunnel | `xxx.railway.app` |
| **Credentials** | Settings UI -> `settings.json` | Environment variables |
| **G2 access** | QR code with ngrok URL | QR code with Railway URL |
| **Deploy** | Hot reload (tsx watch) | `railway up` or git push |

---

## Persistent Storage

If the Settings UI (`settings.json`) is needed on Railway instead of env vars, attach a **Volume**:

1. Create volume in Railway dashboard
2. Mount at `/app/data`
3. Update settings service to use `RAILWAY_VOLUME_MOUNT_PATH/settings.json`

For most cases, env vars are simpler and recommended.

---

## CI/CD via Git

1. Connect GitHub repo in Railway dashboard
2. Auto-deploys on push to connected branch
3. Optional watch paths in `railway.json`:
   ```json
   {
     "build": {
       "watchPatterns": ["src/**", "package.json", "tsconfig.json"]
     }
   }
   ```
