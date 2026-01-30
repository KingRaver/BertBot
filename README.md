# BertBot

Big Sur compatible AI agent gateway inspired by OpenClaw. This scaffold targets Node.js 18 and keeps dependencies minimal.

## Requirements
- macOS Big Sur (or newer)
- Node.js 18+

## Quick Start
1. Install deps: `npm install`
2. Copy env file: `cp .env.example .env`
3. Configure `config/agent.json` and `.env`
4. Run in dev: `npm run dev`

## Scripts
- `npm run dev` - start in watch mode
- `npm run build` - build to `dist/`
- `npm run start` - run built output
- `npm run setup` - initial setup wizard (basic stub)

## Project Structure
See `STRUCTURE.md` for the full tree and design notes.

## Notes
- Telegram is included by default. Discord/Slack are placeholders until you add their SDKs.
- Tool execution is intentionally minimal and should be hardened before production use.
