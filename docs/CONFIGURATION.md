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
  "channels": {
    "telegram": { "enabled": false },
    "discord": { "enabled": false, "allowDMs": true, "allowedGuilds": [] },
    "webchat": { "enabled": true }
  }
}
```

## Allowlist Format
The allowlist file is JSON array of user IDs, for example:
```json
["123456789", "987654321"]
```

## Session Persistence
When `sessions.persist` is `true`, sessions are written to JSON files under `sessions.dir`.

Paths in config are resolved relative to the project root unless absolute.
