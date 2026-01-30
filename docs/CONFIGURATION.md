# Configuration

Primary config lives in `config/agent.json` and can be overridden by environment variables.

## Env Overrides
- `PORT` - Gateway port
- `OPENAI_API_KEY` / `OPENAI_MODEL`
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`
- `TELEGRAM_BOT_TOKEN`

## Example
```json
{
  "gateway": { "port": 18789 },
  "provider": { "type": "openai", "model": "gpt-4o-mini" },
  "channels": { "telegram": { "enabled": false }, "webchat": { "enabled": true } }
}
```
