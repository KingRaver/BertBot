# STRUCTURE.md

## Big Sur Compatible AI Agent - File Tree

Based on OpenClaw architecture, simplified for Node.js 18 and Big Sur compatibility.

```
BertBot/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── src/
│   ├── index.ts                    # Main entry point
│   │
│   ├── gateway/                    # WebSocket control plane
│   │   ├── server.ts              # Express + WS server
│   │   ├── handler.ts             # WebSocket message routing
│   │   └── types.ts               # Gateway protocol types
│   │
│   ├── agent/                      # AI agent core
│   │   ├── runtime.ts             # Agent execution loop
│   │   ├── context.ts             # Conversation context management
│   │   ├── tools.ts               # Tool registry & execution
│   │   ├── service.ts             # Agent orchestration layer
│   │   └── providers/
│   │       ├── anthropic.ts       # Claude integration
│   │       ├── openai.ts          # OpenAI integration
│   │       ├── perplexity.ts      # Perplexity integration
│   │       ├── base.ts            # Provider interface
│   │       └── index.ts           # Provider factory
│   │
│   ├── channels/                   # Messaging platform integrations
│   │   ├── telegram/
│   │   │   ├── bot.ts             # Grammy bot setup
│   │   │   ├── handlers.ts        # Message/command handlers
│   │   │   └── types.ts           # Telegram-specific types
│   │   │
│   │   ├── discord/
│   │   │   ├── bot.ts             # Discord.js client
│   │   │   ├── handlers.ts        # Event handlers
│   │   │   └── commands.ts        # Slash commands
│   │   │
│   │   ├── slack/
│   │   │   ├── bot.ts             # Bolt app
│   │   │   └── handlers.ts        # Event handlers
│   │   │
│   │   └── webchat/
│   │       ├── server.ts          # WebSocket endpoint
│   │       └── static/            # Web UI assets
│   │           ├── index.html
│   │           ├── chat.js
│   │           └── styles.css
│   │
│   ├── sessions/                   # Session management
│   │   ├── manager.ts             # Session lifecycle
│   │   ├── store.ts               # In-memory/file storage
│   │   └── types.ts               # Session data structures
│   │
│   ├── tools/                      # Agent tools/capabilities
│   │   ├── bash.ts                # Shell command execution
│   │   ├── files.ts               # File read/write/edit
│   │   ├── http.ts                # HTTP requests
│   │   └── index.ts               # Tool registry
│   │
│   ├── security/                   # Authentication & authorization
│   │   ├── pairing.ts             # DM pairing codes
│   │   ├── allowlist.ts           # User allowlists
│   │   └── sandbox.ts             # Command sandboxing (optional)
│   │
│   ├── config/                     # Configuration management
│   │   ├── loader.ts              # Config file loading
│   │   ├── schema.ts              # Config validation
│   │   └── defaults.ts            # Default values
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── logger.ts              # Logging setup
│   │   ├── errors.ts              # Error types
│   │   └── validators.ts          # Input validation
│   │
│   └── types/                      # Global TypeScript types
│       ├── agent.ts
│       ├── channel.ts
│       ├── message.ts
│       └── config.ts
│
├── workspace/                      # Agent workspace directory
│   ├── AGENTS.md                  # Agent system prompt
│   ├── SOUL.md                    # Agent personality/identity
│   ├── TOOLS.md                   # Tool descriptions for agent
│   └── skills/                    # Custom skills (optional)
│       └── example-skill/
│           └── SKILL.md
│
├── data/                          # Runtime data (gitignored)
│   ├── sessions/                  # Session persistence
│   ├── credentials/               # API keys, tokens
│   └── logs/                      # Application logs
│
├── scripts/                       # Utility scripts
│   ├── dev.mjs                   # Development runner
│   ├── build.mjs                 # Build script
│   └── setup.mjs                 # Initial setup wizard
│
├── config/                        # Configuration files
│   ├── agent.json                # Default agent config
│   └── channels.json             # Channel configurations
│
└── docs/                          # Documentation
    ├── SETUP.md                  # Setup instructions
    ├── CONFIGURATION.md          # Config reference
    ├── CHANNELS.md               # Channel setup guides
    └── DEVELOPMENT.md            # Development guide
```

## Key Design Decisions

### 1. **Single Gateway Process**
- Express server handling HTTP + WebSocket
- Port 18789 (or configurable)
- All channels connect through gateway

### 2. **Simplified Agent Runtime**
- Direct API calls to Anthropic/OpenAI (no complex RPC)
- Simple tool execution without sandboxing initially
- File-based session storage (SQLite optional later)

### 3. **Channel Modularity**
- Each channel is self-contained module
- Easy to enable/disable via config
- Start with Telegram (easiest), add others incrementally

### 4. **Security Layer**
- Pairing codes for DM access (like OpenClaw)
- Allowlist storage in JSON files
- Optional command sandboxing for later

### 5. **Development Focus**
- TypeScript with simple tsconfig
- No complex build tooling (just tsc)
- Hot reload via tsx/ts-node in dev

## Minimal Dependencies (Node 18 Compatible)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.0",
    "grammy": "^1.21.0",
    "discord.js": "^14.14.1",
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.20.0",
    "dotenv": "^16.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@types/node": "^18.19.0",
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10"
  }
}
```

## Optional Additions (Phase 2)

- Discord support: `discord.js@^14.14.0`
- Slack support: `@slack/bolt@^3.17.0`
- Database: `better-sqlite3@^9.2.0`
- File watching: `chokidar@^3.5.0`
- Process management: `pm2`

## Development Workflow

1. **Initial setup**: `npm install`
2. **Development**: `npm run dev` (uses tsx)
3. **Build**: `npm run build` (tsc output to dist/)
4. **Production**: `node dist/index.js`

## Configuration Strategy

- Environment variables for secrets (`.env`)
- JSON files for structure (`config/agent.json`)
- Runtime overrides via CLI flags
- Hot reload config changes in dev mode

## What's Excluded (vs Full OpenClaw)

- ❌ Browser automation (Playwright)
- ❌ Canvas/A2UI visual workspace
- ❌ Native macOS/iOS/Android apps
- ❌ Voice Wake/Talk Mode
- ❌ Docker sandboxing (initial version)
- ❌ WhatsApp (requires Baileys + heavy deps)
- ❌ Local LLM support (Ollama/llama.cpp)
- ❌ Complex media pipeline
- ❌ Cron jobs (add later if needed)

## What's Included (MVP)

- ✅ WebSocket gateway
- ✅ Telegram bot integration
- ✅ Anthropic/OpenAI/Perplexity agent
- ✅ Basic tool execution (bash, files, http)
- ✅ Session management
- ✅ DM pairing security
- ✅ WebChat UI
- ✅ Configuration system
- ✅ Logging & error handling

## Next Steps

1. Initialize project with package.json
2. Set up TypeScript configuration
3. Implement gateway server
4. Add Telegram channel
5. Integrate Anthropic API
6. Build basic tool system
7. Add session management
8. Implement security layer
9. Create WebChat UI
10. Write documentation

---

**Target**: A production-ready AI agent gateway that runs on Big Sur with Node 18, focusing on core messaging and agent capabilities without platform-specific features.
