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

## Microsoft Teams
- Create a Bot Framework bot (Azure Bot Service) and set the messaging endpoint to `https://<host>/teams/messages`.
- Teams requires a publicly reachable HTTPS endpoint (use a tunnel like ngrok for local dev).
- Set `TEAMS_APP_ID` and `TEAMS_APP_PASSWORD` in `.env`.
- Enable Teams in `config/agent.json`.
- Override the endpoint with `TEAMS_ENDPOINT` or `channels.teams.endpoint` if needed.
- Optional controls: `allowedTeams`, `allowedChannels`, `allowPersonal`, `allowGroup`, `allowChannel`, `mentionOnly`, `ignoreBots`.
- `allowedTeams`/`allowedChannels` expect Teams IDs (not names).

## Signal
- Install `signal-cli` and register a Signal account on the host.
- Set `SIGNAL_ACCOUNT` (your Signal number or account identifier) in `.env`.
- Set `SIGNAL_CLI_PATH` if `signal-cli` is not on your PATH.
- Enable Signal in `config/agent.json`.
- Optional controls: `allowedRecipients`, `allowedGroups`, `allowDMs`, `allowGroups`, `mentionOnly`, `commandPrefix`, `ignoreOwn`.
- `allowedRecipients` and `allowedGroups` expect Signal phone numbers or group IDs (not names).
- If `mentionOnly` is enabled, messages must start with `commandPrefix` (default `/bert`).

## Notion (Tool)
- Create a Notion integration and add it to the target workspace/database.
- Set `NOTION_API_KEY` and enable `notion.enabled` in `config/agent.json`.
- Optional: set `NOTION_DATABASE_ID` or `NOTION_DEFAULT_PARENT_ID` for default page creation.
- Supported tool actions: `search`, `queryDatabase`, `getPage`, `createPage`, `updatePage`, `appendBlock`.
