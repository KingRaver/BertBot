# Changelog

All notable changes to BertBot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Channels & Integrations (2026-01-31)

#### Slack Integration

- **Slack Channel (Bolt)** - Full Slack support with socket and HTTP modes
  - Socket mode (`SLACK_APP_TOKEN`) and HTTP mode (`SLACK_SIGNING_SECRET`)
  - Supports app mentions, direct messages, and slash command `/bert`
  - Optional controls: `allowedChannels`, `allowDMs`, `mentionOnly`, `respondInThread`, `ignoreBots`
  - Express route mounted at `/slack/events` for HTTP mode
  - Files: `src/channels/slack/bot.ts`, `src/channels/slack/handlers.ts`, `src/index.ts`
  - Config: `src/types/config.ts`, `src/config/schema.ts`, `src/config/defaults.ts`, `src/config/loader.ts`
  - Docs: `docs/CHANNELS.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `README.md`, `STRUCTURE.md`
  - Dependency: `@slack/bolt@^3.17.0`

#### Microsoft Teams Integration

- **Teams Channel (Bot Framework)** - Teams bot support via Azure Bot Service
  - HTTP endpoint (default `/teams/messages`) registered on the gateway
  - Supports personal, group, and channel conversations
  - Optional controls: `allowedTeams`, `allowedChannels`, `allowPersonal`, `allowGroup`, `allowChannel`, `mentionOnly`, `ignoreBots`
  - Requires `TEAMS_APP_ID` and `TEAMS_APP_PASSWORD`
  - Files: `src/channels/teams/bot.ts`, `src/channels/teams/handlers.ts`, `src/index.ts`
  - Config: `src/types/config.ts`, `src/config/schema.ts`, `src/config/defaults.ts`, `src/config/loader.ts`
  - Docs: `docs/CHANNELS.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `README.md`, `STRUCTURE.md`
  - Dependency: `botbuilder@^4.23.0`

#### Signal Integration

- **Signal Channel (signal-cli bridge)** - Local Signal messaging via `signal-cli`
  - Listener uses `signal-cli receive --json`, sender uses `signal-cli send`
  - Optional controls: `allowedRecipients`, `allowedGroups`, `allowDMs`, `allowGroups`, `mentionOnly`, `commandPrefix`, `ignoreOwn`
  - Requires `SIGNAL_ACCOUNT`, optional `SIGNAL_CLI_PATH`
  - Files: `src/channels/signal/bot.ts`, `src/index.ts`
  - Config: `src/types/config.ts`, `src/config/schema.ts`, `src/config/defaults.ts`, `src/config/loader.ts`
  - Docs: `docs/CHANNELS.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `README.md`, `STRUCTURE.md`

#### Notion Tool Integration

- **Notion Tool** - Search, query, create, update pages and append blocks
  - Actions: `search`, `queryDatabase`, `getPage`, `createPage`, `updatePage`, `appendBlock`
  - Optional defaults: `NOTION_DATABASE_ID`, `NOTION_DEFAULT_PARENT_ID`
  - Tool only enabled when `notion.enabled` is true
  - Files: `src/tools/notion.ts`, `src/agent/tools.ts`
  - Config: `src/types/config.ts`, `src/config/schema.ts`, `src/config/defaults.ts`, `src/config/loader.ts`
  - Docs: `docs/CHANNELS.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `README.md`, `STRUCTURE.md`
  - Dependency: `@notionhq/client@^2.2.14`

#### Configuration & Documentation

- Added new environment variables for Slack, Teams, Signal, and Notion
- Expanded `config/agent.json` and `config/channels.json` templates
- Updated README and STRUCTURE references for new channels/tools

### Added - Short-Term Improvements (2026-01-31)

#### Session Management

- **Session TTL and Automatic Cleanup** - Prevents memory leaks in long-running processes
  - Default TTL: 24 hours of inactivity
  - Configurable TTL and cleanup interval
  - Automatic cleanup runs every hour by default
  - `lastAccessed` timestamp tracking on all session operations
  - Backward compatible with existing session files
  - Graceful cleanup prevents event loop blocking
  - Files: `src/sessions/types.ts`, `src/sessions/store.ts`, `src/sessions/manager.ts`
  - Tests: `tests/sessions/store.test.ts` (10 new tests)
  - Test coverage: 98 total tests (88 security + 10 session)

#### Error Handling

- **Standardized Error Handling** - Consistent error responses across all channels
  - Centralized error codes: `INVALID_INPUT`, `RATE_LIMITED`, `SECURITY_VIOLATION`, etc.
  - `AppError`/`BertBotError` class with error codes, details, and retryability flag
  - `toErrorResponse()` utility for consistent error formatting
  - `getUserMessage()` for user-friendly error messages
  - `isFatalError()` and `isRecoverableError()` for error classification
  - Fail-fast for critical services (Telegram, Discord)
  - Structured error logging with context (userId, clientIP, etc.)
  - Files: `src/utils/errors.ts`, `src/gateway/handler.ts`, `src/gateway/server.ts`, `src/channels/telegram/handlers.ts`, `src/channels/discord/handlers.ts`, `src/index.ts`
  - Gateway responses now include error codes and retryability information

#### Documentation

- **API Documentation** - Comprehensive WebSocket API specification
  - Complete protocol documentation for WebSocket gateway
  - Error code reference with descriptions and user messages
  - Rate limiting documentation
  - Client implementation examples (JavaScript, Python)
  - Security considerations and troubleshooting guide
  - File: `API.md`

- **Deployment Guide** - Production deployment documentation
  - Docker deployment with Dockerfile and docker-compose.yml
  - Systemd service configuration with security hardening
  - PM2 process manager setup with monitoring
  - Nginx reverse proxy configuration with SSL/TLS
  - Caddy alternative configuration
  - Security hardening checklist (firewall, permissions, Fail2Ban)
  - Monitoring and logging setup
  - Health checks and troubleshooting
  - File: `DEPLOYMENT.md`

#### Security Enhancements

- **Pairing Code Security** - Enhanced pairing code system with cryptographic security
  - Minimum 8 characters (up from 6) - prevents brute force attacks
  - Cryptographically secure random generation using `crypto.randomBytes()`
  - Configurable character sets: numeric, alphanumeric, alphanumeric-upper (default)
  - Time-based expiration (default: 5 minutes, configurable)
  - Timing-safe comparison using `crypto.timingSafeEqual()` prevents timing attacks
  - Helper functions: `isExpired()`, `getTimeRemaining()`, `formatTimeRemaining()`
  - Metadata support for user identification and custom data
  - 41+ bits of entropy (8 chars, 36-char alphabet = 2.8 trillion combinations)
  - File: `src/security/pairing.ts`
  - Tests: `tests/security/pairing.test.ts` (33 comprehensive tests)
  - Total test count: 131 tests (88 security + 10 sessions + 33 pairing)

### Added - Security Hardening (2026-01-30)

#### Critical Security Fixes

- **Bash Sandbox Hardening** - Replaced vulnerable denylist with secure whitelist approach
  - Blocks all dangerous commands by default (rm, sudo, dd, wget, curl, chmod, chown, kill, nc, etc.)
  - Prevents command chaining (`;`, `&&`, `||`)
  - Blocks pipes, redirects, command substitution, and background execution
  - Whitelist of 30+ safe, read-only commands
  - Conditional validation for git (read-only operations) and tar (list-only)
  - File: `src/security/sandbox.ts`

- **File Tool Path Traversal Protection** - Fixed critical symlink and path traversal vulnerabilities
  - Uses `fs.realpath()` to resolve and validate symlinks before file access
  - Blocks all paths outside workspace boundary
  - Sanitizes null bytes and dangerous characters
  - Validates parent directories for new file creation
  - Handles edge cases (empty paths, long paths, encoded traversal)
  - File: `src/tools/files.ts`

- **HTTP Tool SSRF Prevention** - Comprehensive protection against Server-Side Request Forgery
  - Protocol validation: Only http:// and https:// allowed
  - Private IP blocking: 127.0.0.1, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x (AWS metadata)
  - Localhost blocking: blocks "localhost" and "[::1]"
  - Response size limit: 5MB maximum to prevent memory exhaustion
  - Request timeout: 30 seconds to prevent resource exhaustion
  - Redirect blocking: Prevents redirect-based SSRF attacks
  - IPv6 private range protection
  - File: `src/tools/http.ts`

#### Security Testing

- **Comprehensive Test Suite** - 98 tests across 4 suites
  - Bash sandbox: 37 tests covering bypass attempts, command injection, case sensitivity
  - File tool: 21 tests covering path traversal, symlink attacks, validation
  - HTTP tool: 30 tests covering SSRF, protocol validation, size limits, timeouts
  - Session store: 10 tests covering TTL, cleanup, backward compatibility
  - Files: `tests/security/sandbox.test.ts`, `tests/security/files.test.ts`, `tests/security/http.test.ts`, `tests/sessions/store.test.ts`

- **Test Infrastructure** - Added Jest testing framework
  - Jest 29.0.0 (Node 18 compatible)
  - TypeScript support via ts-jest
  - Coverage reporting
  - Configuration: `jest.config.js`
  - Scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`

#### Session Security

- **Session File Encryption** - AES-256-GCM encryption for session data at rest
  - PBKDF2 key derivation (100,000 iterations, SHA-256)
  - Random salt per file (32 bytes)
  - Random IV per encryption (16 bytes)
  - Authentication tag prevents tampering (16 bytes)
  - File permissions: 0600 (owner read/write only)
  - Backward compatible: loads unencrypted files, encrypts on next save
  - Configuration: `SESSION_ENCRYPTION_KEY` environment variable
  - Generate key: `openssl rand -base64 32`
  - Files: `src/security/encryption.ts`, `src/sessions/store.ts`

#### Rate Limiting

- **Gateway Rate Limiting** - Intelligent rate limiting to prevent abuse
  - Message rate limiting: 60 messages per minute per IP
  - Connection limiting: 5 concurrent connections per IP
  - Automatic cleanup of expired tracking entries
  - Stats monitoring: tracks active connections and IPs
  - Retry-After headers for graceful degradation
  - Real IP extraction from proxy headers (X-Forwarded-For, X-Real-IP)
  - Enabled by default in production (`NODE_ENV=production`)
  - Files: `src/security/ratelimit.ts`, `src/gateway/server.ts`

### Added - Infrastructure Improvements

#### Code Organization

- **TypeScript Path Aliases** - Clean import paths throughout codebase
  - Path mappings: `@agent/*`, `@channels/*`, `@config/*`, `@gateway/*`, `@security/*`, `@sessions/*`, `@tools/*`, `@types/*`, `@utils/*`
  - Runtime support via tsconfig-paths
  - Jest configuration updated for test support
  - Eliminates messy relative imports (`../../..`)
  - Configuration: `tsconfig.json`, `jest.config.js`

#### Logging

- **Structured Logging with Pino** - Production-grade logging system
  - Replaces console logging with structured JSON logging
  - Pretty printing in development (colorized, timestamps)
  - Log levels: debug, info, warn, error
  - Automatic enrichment: timestamps, environment info
  - Child loggers for context-specific logging
  - Backward compatible wrapper for existing code
  - Configuration: `DEBUG=true` for debug level, `NODE_ENV=production` for JSON output
  - Dependencies: pino, pino-pretty
  - File: `src/utils/logger.ts`

### Changed

- **Package Dependencies** - Added security and infrastructure packages
  - Production: pino@^10.3.0, pino-pretty@^13.1.3
  - Development: jest@^29.0.0, ts-jest@^29.0.0, @types/jest@^29.0.0, tsconfig-paths@^4.2.0

- **Build Scripts** - Updated for path alias support
  - `npm run dev`: `tsx watch -r tsconfig-paths/register src/index.ts`
  - `npm run start`: `node -r tsconfig-paths/register dist/index.js`

- **TypeScript Configuration** - Enhanced for modern development
  - Added path mappings for clean imports
  - Includes both src and tests directories
  - Node 18 compatible module resolution
  - Configuration: `tsconfig.json`

### Security Impact Summary

**Before**: Critical vulnerabilities allowing:
- Remote code execution via bash tool
- Reading arbitrary files via symlink attacks
- SSRF attacks accessing internal services (AWS metadata, localhost)
- Memory/resource exhaustion attacks
- Session data exposure

**After**: Production-grade security:
- ✅ Command execution sandboxed with whitelist
- ✅ File access strictly confined to workspace
- ✅ HTTP requests validated against SSRF
- ✅ Resource limits prevent DoS
- ✅ Session data encrypted at rest
- ✅ Rate limiting prevents abuse
- ✅ Comprehensive test coverage (88 tests)

### Test Results

```
Test Suites: 3 passed, 3 total
Tests:       88 passed, 88 total
Coverage:    87.85% statements, 73.33% branches, 69.23% functions, 90.97% lines
```

### Breaking Changes

None. All changes are backward compatible with optional feature flags:
- Session encryption: Enabled when `SESSION_ENCRYPTION_KEY` is set
- Rate limiting: Enabled by default in production, can be disabled via config

### Migration Guide

#### Enabling Session Encryption

1. Generate encryption key:
   ```bash
   openssl rand -base64 32
   ```

2. Add to environment:
   ```bash
   export SESSION_ENCRYPTION_KEY="your-generated-key-here"
   ```

3. Restart application - existing sessions will be automatically migrated

#### Using Path Aliases

Old import style:
```typescript
import { logger } from "../../../utils/logger";
```

New import style:
```typescript
import { logger } from "@utils/logger";
```

#### Disabling Rate Limiting (Development)

```typescript
const gateway = createGateway({
  port: 3000,
  enableRateLimit: false
});
```

### Dependencies

- Node.js >= 18 (ES2020 target)
- TypeScript 5.3.0
- Compatible with macOS Big Sur and later

---

## [0.1.0] - 2026-01-29

### Added

- Initial BertBot implementation
- OpenClaw-inspired architecture
- Multi-channel support (Telegram, Discord, WebChat)
- Multiple AI provider support (OpenAI, Anthropic, Perplexity)
- Basic tool system (bash, files, http)
- Session management
- Security allowlist system

---

**Note**: All security improvements completed 2026-01-30 as part of comprehensive security audit and hardening effort.
