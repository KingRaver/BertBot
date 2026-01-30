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
Stubs exist, but SDKs are not installed by default. Add `@slack/bolt` and implement handlers.
