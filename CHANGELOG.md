# Changelog

All notable changes to BertBot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- **Comprehensive Test Suite** - 88 security tests with 87.85% code coverage
  - Bash sandbox: 37 tests covering bypass attempts, command injection, case sensitivity
  - File tool: 21 tests covering path traversal, symlink attacks, validation
  - HTTP tool: 30 tests covering SSRF, protocol validation, size limits, timeouts
  - Files: `tests/security/sandbox.test.ts`, `tests/security/files.test.ts`, `tests/security/http.test.ts`

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
