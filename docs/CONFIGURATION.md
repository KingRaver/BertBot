# Configuration

Primary config lives in `config/agent.json` and can be overridden by environment variables.

## Env Overrides
- `PORT` - Gateway port
- `PROVIDER` - `perplexity`, `openai`, or `anthropic`
- `OPENAI_API_KEY` / `OPENAI_MODEL`
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`
- `PERPLEXITY_API_KEY` / `PERPLEXITY_MODEL`
- `TELEGRAM_BOT_TOKEN`
- `DISCORD_BOT_TOKEN`
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_MODE` (`socket` or `http`)
- `SLACK_ALLOWED_CHANNELS` (comma-separated)
- `SLACK_ALLOW_DMS` (true/false)
- `SLACK_MENTION_ONLY` (true/false)
- `SLACK_RESPOND_IN_THREAD` (true/false)
- `SLACK_IGNORE_BOTS` (true/false)
- `TEAMS_APP_ID`
- `TEAMS_APP_PASSWORD`
- `TEAMS_ENDPOINT`
- `TEAMS_ALLOWED_TEAMS` (comma-separated)
- `TEAMS_ALLOWED_CHANNELS` (comma-separated)
- `TEAMS_ALLOW_PERSONAL` (true/false)
- `TEAMS_ALLOW_GROUP` (true/false)
- `TEAMS_ALLOW_CHANNEL` (true/false)
- `TEAMS_MENTION_ONLY` (true/false)
- `TEAMS_IGNORE_BOTS` (true/false)
- `SIGNAL_ACCOUNT`
- `SIGNAL_CLI_PATH`
- `SIGNAL_ALLOWED_RECIPIENTS` (comma-separated)
- `SIGNAL_ALLOWED_GROUPS` (comma-separated)
- `SIGNAL_ALLOW_DMS` (true/false)
- `SIGNAL_ALLOW_GROUPS` (true/false)
- `SIGNAL_IGNORE_OWN` (true/false)
- `SIGNAL_MENTION_ONLY` (true/false)
- `SIGNAL_COMMAND_PREFIX`
- `NOTION_ENABLED` (true/false)
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `NOTION_DEFAULT_PARENT_ID`
- `SESSIONS_PERSIST` (true/false)
- `SESSIONS_DIR`
- `ALLOWLIST_PATH`

## Example
```json
{
  "gateway": { "port": 18789 },
  "provider": { "type": "perplexity", "model": "sonar-pro" },
  "sessions": { "persist": false, "dir": "data/sessions" },
  "security": { "allowlistPath": "" },
  "notion": {
    "enabled": false,
    "databaseId": "",
    "defaultParentId": ""
  },
  "channels": {
    "telegram": { "enabled": false },
    "discord": { "enabled": false, "allowDMs": true, "allowedGuilds": [] },
    "slack": {
      "enabled": false,
      "mode": "socket",
      "allowDMs": true,
      "mentionOnly": false,
      "respondInThread": true,
      "ignoreBots": true,
      "allowedChannels": []
    },
    "teams": {
      "enabled": false,
      "endpoint": "/teams/messages",
      "allowPersonal": true,
      "allowGroup": true,
      "allowChannel": true,
      "mentionOnly": false,
      "ignoreBots": true,
      "allowedTeams": [],
      "allowedChannels": []
    },
    "signal": {
      "enabled": false,
      "cliPath": "signal-cli",
      "allowDMs": true,
      "allowGroups": true,
      "ignoreOwn": true,
      "mentionOnly": false,
      "commandPrefix": "/bert",
      "allowedRecipients": [],
      "allowedGroups": []
    },
    "webchat": { "enabled": true }
  }
}
```

Slack channel lists should use channel IDs (e.g., `C0123456789`).
Teams channel lists should use channel IDs (e.g., `19:...@thread.tacv2`).
Signal allowlists should use phone numbers or group IDs (not names).
When `signal.mentionOnly` is `true`, messages must start with `signal.commandPrefix` (default `/bert`).

## Allowlist Format
The allowlist file is JSON array of user IDs, for example:
```json
["123456789", "987654321"]
```

## Session Persistence
When `sessions.persist` is `true`, sessions are written to JSON files under `sessions.dir`.

Paths in config are resolved relative to the project root unless absolute.
