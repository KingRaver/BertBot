# BertBot

Big Sur compatible AI agent gateway inspired by OpenClaw. This project targets Node.js 18 and keeps dependencies minimal while delivering a full multi-channel agent runtime.

## Requirements
- macOS Big Sur (or newer)
- Node.js 18+

## Quick Start
1. Install deps: `npm install`
2. Copy env file: `cp .env.example .env`
3. Configure `config/agent.json` and `.env`
4. Run in dev: `npm run dev`
5. Open WebChat: `http://localhost:18789/webchat`

## Scripts
- `npm run dev` - start in watch mode
- `npm run build` - build to `dist/`
- `npm run start` - run built output
- `npm run setup` - initial setup wizard (basic stub)

## Project Structure
See `STRUCTURE.md` for the full tree and design notes.

## Notes
- Default provider is Perplexity (OpenAI-compatible API). Override with `PROVIDER=openai` or `PROVIDER=anthropic`.
- Sessions persist only when `sessions.persist` is enabled in `config/agent.json` or via `SESSIONS_PERSIST=true`.
- Telegram, WebChat, and Discord are wired. Slack remains a placeholder until added.
- Tool execution is intentionally minimal and should be hardened before production use.
- `workspace/AGENTS.md` is loaded as the system prompt if present.
