# 🤖 BertBot

**Production-ready AI agent gateway with enterprise-grade security**

BertBot is a secure, multi-channel AI agent gateway inspired by [OpenClaw](https://github.com/openclaw/openclaw), optimized for Node.js 18+ and macOS Big Sur compatibility. It provides a unified interface for multiple AI providers (OpenAI, Anthropic, Perplexity) across various messaging platforms (Telegram, Discord, WebChat, Slack).

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-87.85%25-brightgreen.svg)](tests/)

---

## ✨ Features

### 🔐 Security First
- **Command Sandboxing** - Whitelist-based bash execution with 37 security tests
- **SSRF Protection** - Blocks localhost, private IPs, and AWS metadata endpoints
- **Path Traversal Prevention** - Symlink resolution and workspace boundary enforcement
- **Session Encryption** - AES-256-GCM encryption for conversation data at rest
- **Session TTL** - Automatic cleanup of inactive sessions (24h default, configurable)
- **Rate Limiting** - Intelligent per-IP rate limiting (60 msg/min, 5 connections)
- **Test Coverage** - Comprehensive security test suite (131 tests, 5 suites)

### 🎯 Core Capabilities
- **Multi-Provider Support** - OpenAI (GPT), Anthropic (Claude), Perplexity
- **Multi-Channel** - Telegram, Discord, WebChat, Slack (socket or HTTP mode)
- **Tool System** - Bash commands, file operations, HTTP requests
- **Session Management** - Persistent conversation history with encryption and automatic cleanup
- **Structured Logging** - Production-grade logging with Pino
- **WebSocket Gateway** - Real-time bidirectional communication

### 🏗️ Architecture
- **Modular Design** - Clean separation of concerns (gateway, agent, channels, tools)
- **Type Safety** - Full TypeScript with strict mode
- **Configuration-Driven** - Environment variables and JSON config
- **Minimal Dependencies** - 9 production dependencies, carefully chosen
- **Path Aliases** - Clean imports with `@agent/*`, `@security/*`, etc.

---

## 📋 Requirements

- **OS**: macOS Big Sur or newer (Linux compatible)
- **Node.js**: 18.0.0 or higher
- **API Keys**: At least one AI provider (OpenAI, Anthropic, or Perplexity)

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/KingRaver/bertbot.git
cd bertbot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your API keys:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
PERPLEXITY_API_KEY=pplx-...

# Highly Recommended: Session encryption
SESSION_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Optional: Messaging platforms
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
```

### 3. Run

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

### 4. Access

- **WebChat**: http://localhost:3030/webchat
- **WebSocket**: ws://localhost:3030
- **Telegram**: Message your bot (@YourBotName)
- **Discord**: Invite bot to your server

---

## 📦 Installation & Setup

### Detailed Setup

1. **Install Node.js 18+**
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18

   # Verify installation
   node --version  # Should be v18.x.x or higher
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Generate Encryption Key** (Recommended)
   ```bash
   # Generate strong encryption key
   openssl rand -base64 32

   # Add to .env
   echo "SESSION_ENCRYPTION_KEY=<generated-key>" >> .env
   ```

4. **Configure AI Providers**

   Choose at least one provider:

   **OpenAI (GPT)**
   ```bash
   # Get key: https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-4-turbo
   ```

   **Anthropic (Claude)**
   ```bash
   # Get key: https://console.anthropic.com/settings/keys
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
   ```

   **Perplexity**
   ```bash
   # Get key: https://www.perplexity.ai/settings/api
   PERPLEXITY_API_KEY=pplx-...
   PERPLEXITY_MODEL=sonar-pro
   ```

5. **Set Default Provider**
   ```bash
   # In .env
   PROVIDER=openai  # or anthropic, perplexity
   ```

6. **Configure Messaging Platforms** (Optional)

   **Telegram**
   ```bash
   # Get token from @BotFather on Telegram
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

   **Discord**
   ```bash
   # Get token from https://discord.com/developers/applications
   DISCORD_BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GaBcDe.Fg_HiJkLmNoPqRsTuVwXyZ...
   ```

   **Slack**
   ```bash
   # Bot token (xoxb-...)
   SLACK_BOT_TOKEN=xoxb-...
   # Socket mode app token (xapp-...) OR signing secret for HTTP mode
   SLACK_APP_TOKEN=xapp-...
   SLACK_SIGNING_SECRET=...
   ```

7. **Customize Agent Behavior** (Optional)

   Edit `config/agent.json`:
   ```json
   {
     "provider": {
       "name": "openai",
       "model": "gpt-4o-mini"
     },
     "sessions": {
       "persist": true,
       "dir": "data/sessions"
     },
     "gateway": {
       "port": 3030
     }
   }
   ```

---

## 🎮 Usage

### Development Mode

```bash
# Start with hot reload
npm run dev

# Enable debug logging
DEBUG=true npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
NODE_ENV=production npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run setup` | Initial setup wizard (basic) |

---

## 📚 Documentation

### Core Documentation
- **[API.md](API.md)** - WebSocket API and protocol specification ✨ NEW
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide (Docker, systemd, PM2, Nginx) ✨ NEW
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[SECURITY.md](SECURITY.md)** - Security policy and best practices
- **[AUDIT.md](AUDIT.md)** - Security audit report and findings
- **[STRUCTURE.md](STRUCTURE.md)** - Project architecture and design

### Configuration Files
- **[.env.example](.env.example)** - Environment variable template
- **[config/agent.json](config/agent.json)** - Runtime configuration
- **[tsconfig.json](tsconfig.json)** - TypeScript configuration
- **[jest.config.js](jest.config.js)** - Test configuration

### Key Directories
```
bertbot/
├── src/
│   ├── agent/          # AI provider integrations
│   ├── channels/       # Messaging platform integrations
│   ├── gateway/        # WebSocket gateway server
│   ├── security/       # Security: sandbox, encryption, rate limiting
│   ├── sessions/       # Session management and storage
│   ├── tools/          # Agent tools (bash, files, http)
│   └── utils/          # Utilities (logger, validators)
├── tests/
│   └── security/       # Security test suites
├── config/             # Configuration files
└── workspace/          # Agent workspace and system prompts
```

---

## 🔒 Security

BertBot has undergone comprehensive security hardening. See [SECURITY.md](SECURITY.md) for full details.

### Security Scorecard

| Category | Score | Status |
|----------|-------|--------|
| Input Validation | 9/10 | ✅ Excellent |
| Data Protection | 9/10 | ✅ Excellent |
| SSRF Protection | 9/10 | ✅ Excellent |
| Code Injection | 9/10 | ✅ Excellent |
| Test Coverage | 9/10 | ✅ 131 tests |
| **Overall** | **9/10** | ✅ **Production Ready** |

### Security Features

- ✅ **Bash Sandbox** - Whitelist-only command execution
- ✅ **Path Validation** - Prevents directory traversal and symlink attacks
- ✅ **SSRF Prevention** - Blocks private IPs, localhost, AWS metadata
- ✅ **Session Encryption** - AES-256-GCM with PBKDF2 key derivation
- ✅ **Session TTL** - Automatic cleanup of inactive sessions (prevents memory leaks)
- ✅ **Rate Limiting** - 60 msg/min, 5 concurrent connections per IP
- ✅ **Structured Logging** - Pino with no sensitive data exposure
- ✅ **131 Tests** - Comprehensive test coverage (security, sessions, pairing)

### Production Checklist

Before deploying to production:

- [ ] Set `SESSION_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy with TLS/SSL (nginx, Caddy)
- [ ] Set up firewall rules (allow 443/tcp, deny 3030/tcp)
- [ ] Enable rate limiting (default in production)
- [ ] Set file permissions (600 for .env, 700 for data/)
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting
- [ ] Backup encryption keys securely
- [ ] Review [SECURITY.md](SECURITY.md) for full checklist

---

## 🛠️ Configuration

### Environment Variables

See [.env.example](.env.example) for all available options.

**Critical Settings:**

```bash
# AI Provider (required)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
PERPLEXITY_API_KEY=pplx-...
PROVIDER=openai  # Default provider

# Security (highly recommended)
SESSION_ENCRYPTION_KEY=<32-byte-base64-key>
NODE_ENV=production

# Server
PORT=3030

# Rate Limiting (auto-enabled in production)
ENABLE_RATE_LIMIT=true
MAX_CONNECTIONS_PER_IP=5
MAX_MESSAGES_PER_MINUTE=60

# Logging
DEBUG=false  # Set to true for debug logs
```

### Agent Configuration

Edit `config/agent.json`:

```json
{
  "provider": {
    "name": "openai",
    "model": "gpt-4o-mini",
    "apiKey": "${OPENAI_API_KEY}"
  },
  "sessions": {
    "persist": true,
    "dir": "data/sessions"
  },
  "gateway": {
    "port": 3030
  },
  "channels": {
    "telegram": {
      "enabled": true
    },
    "discord": {
      "enabled": true
    },
    "webchat": {
      "enabled": true
    }
  }
}
```

---

## 🧪 Testing

BertBot has comprehensive test coverage focusing on security.

### Test Structure

```
tests/
├── security/
│   ├── sandbox.test.ts   # Bash sandbox tests (37 tests)
│   ├── files.test.ts     # File access tests (21 tests)
│   ├── http.test.ts      # HTTP/SSRF tests (30 tests)
│   └── pairing.test.ts   # Pairing code tests (33 tests)
└── sessions/
    └── store.test.ts     # Session TTL tests (10 tests)
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Coverage Report

```
Test Suites: 5 passed, 5 total
Tests:       131 passed, 131 total

Test breakdown:
- Security: 88 tests (sandbox, files, HTTP)
- Sessions: 10 tests (TTL, cleanup)
- Pairing: 33 tests (security, expiration)
```

---

## 🏗️ Architecture

BertBot uses a modular, event-driven architecture with clear separation of concerns.

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                      Gateway Layer                       │
│  (WebSocket Server + HTTP + Rate Limiting)              │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                    Channel Layer                         │
│  (Telegram, Discord, WebChat, Slack)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                     Agent Layer                          │
│  (AI Runtime + Provider Abstraction)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                     Tool Layer                           │
│  (Bash, Files, HTTP + Sandboxing)                       │
└──────────────────────────────────────────────────────────┘
```

### Key Modules

- **Gateway** (`src/gateway/`) - WebSocket server, rate limiting
- **Channels** (`src/channels/`) - Platform integrations (Telegram, Discord, etc.)
- **Agent** (`src/agent/`) - AI runtime and provider abstraction
- **Tools** (`src/tools/`) - Agent capabilities (bash, files, http)
- **Security** (`src/security/`) - Sandbox, encryption, rate limiting
- **Sessions** (`src/sessions/`) - Conversation persistence

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Security First** - Never compromise on security
2. **Test Coverage** - Add tests for new features
3. **Documentation** - Update docs for changes
4. **TypeScript** - Maintain strict type safety
5. **Code Style** - Follow existing patterns

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/yourusername/bertbot.git

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and test
npm test

# 4. Commit with clear message
git commit -m "feat: add amazing feature"

# 5. Push and create PR
git push origin feature/your-feature
```

---

## 📝 Roadmap

### Completed ✅
- [x] Multi-provider AI support (OpenAI, Anthropic, Perplexity)
- [x] Multi-channel messaging (Telegram, Discord, WebChat, Slack)
- [x] Security hardening (sandbox, SSRF, encryption)
- [x] Comprehensive test coverage (87.85%)
- [x] Rate limiting and abuse prevention
- [x] Structured logging with Pino
- [x] TypeScript path aliases

### In Progress 🚧
- [ ] SQLite session storage (Task #9)
- [ ] Docker-based sandboxing (Task #10)
- [ ] API documentation with OpenAPI (Task #11)
- [ ] Metrics and observability (Task #12)
- [ ] User-configurable tool restrictions (Task #13)

### Future 🎯
- [ ] Multi-tenancy support
- [ ] Admin dashboard
- [ ] Kubernetes deployment
- [ ] Advanced monitoring and alerting
- [ ] Tool execution replay/debugging
- [ ] OAuth/SSO authentication

---

## 📊 Project Stats

- **Lines of Code**: ~1,366 TypeScript
- **Test Suites**: 5 suites, 131 tests
- **Security Tests**: 121 tests (sandbox, files, HTTP, sessions, pairing)
- **Dependencies**: 11 production, 9 development
- **Security Score**: 9/10
- **Node.js**: 18+ required
- **TypeScript**: 5.3.0

---

## 📄 License

[MIT License](LICENSE.md) - See LICENSE.md for the full text (it's actually fun to read, we promise)

---

## 🙏 Acknowledgments

- **[OpenClaw](https://github.com/openclaw/openclaw)** - Inspiration for architecture
- **Security Audit** - Claude Sonnet 4.5 (January 30, 2026)
- **Community** - All contributors and security researchers

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bertbot/issues)
- **Security**: See [SECURITY.md](SECURITY.md) for reporting vulnerabilities
- **Documentation**: See docs linked above

---

## 🌟 Quick Links

- **[API Documentation](API.md)** - WebSocket protocol and examples ✨ NEW
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment (Docker, systemd, PM2, Nginx) ✨ NEW
- [Security Policy](SECURITY.md)
- [Security Audit](AUDIT.md)
- [Changelog](CHANGELOG.md)
- [Project Structure](STRUCTURE.md)
- [Environment Template](.env.example)

---

**Built with ❤️ for secure, production-ready AI agent deployments**
