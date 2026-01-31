# Setup

1. Install Node.js 18.
2. Install dependencies: `npm install`.
3. Copy env: `cp .env.example .env`.
4. Update `config/agent.json` and `.env`.
5. Start dev server: `npm run dev`.

The gateway listens on port 18789 by default.
Open WebChat at `http://localhost:18789/webchat`.

## Provider Defaults
- Perplexity is the default provider. Set `PERPLEXITY_API_KEY` and optionally `PERPLEXITY_MODEL`.
- Switch providers by setting `PROVIDER=openai` or `PROVIDER=anthropic`.

## Channels
- Telegram: set `TELEGRAM_BOT_TOKEN` and enable it in `config/agent.json`.
- Discord: set `DISCORD_BOT_TOKEN` and enable it in `config/agent.json`.
- Slack: set `SLACK_BOT_TOKEN` and enable it in `config/agent.json` (plus `SLACK_APP_TOKEN` for socket mode or `SLACK_SIGNING_SECRET` for HTTP mode).
