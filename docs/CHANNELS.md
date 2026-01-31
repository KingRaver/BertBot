# Channels

## Telegram
- Set `TELEGRAM_BOT_TOKEN` in `.env`.
- Enable Telegram in `config/agent.json`.

## Discord
- Set `DISCORD_BOT_TOKEN` in `.env`.
- Enable Discord in `config/agent.json`.
- If you want to restrict to certain servers, set `allowedGuilds` to an array of guild IDs.
- Enable the Message Content intent in the Discord developer portal for message replies.
- Set `allowDMs` to `false` if you only want guild-based responses.

## WebChat
Enabled by default. Open `http://localhost:18789/webchat` after starting the gateway.

## Slack
- Install the Slack app and set `SLACK_BOT_TOKEN`.
- For Socket Mode, set `SLACK_APP_TOKEN` and `SLACK_MODE=socket`.
- For HTTP mode, set `SLACK_SIGNING_SECRET` and `SLACK_MODE=http`, then configure the Events URL to `https://<host>/slack/events`.
- Enable Slack in `config/agent.json`.
- Optional controls: `allowedChannels`, `allowDMs`, `mentionOnly`, `respondInThread`, `ignoreBots`.
- `allowedChannels` expects Slack channel IDs (e.g., `C0123456789`).
- Slash command `/bert` is supported once configured in Slack.
- Recommended scopes: `chat:write`, `commands`, `app_mentions:read`, `im:history`, `channels:history` (plus `groups:history`/`mpim:history` if needed).
