# Security Policy

## Supported Versions

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 0.1.x   | :white_check_mark: | Actively maintained |

---

## Security Features

BertBot implements multiple layers of security protection:

### 🛡️ **Tool Execution Security**

1. **Bash Sandbox**
   - Whitelist-only command execution (30+ safe commands)
   - Blocks all dangerous operations (rm, sudo, dd, chmod, etc.)
   - Prevents command chaining, pipes, redirects, and substitution
   - Test coverage: 37 tests
   - File: `src/security/sandbox.ts`

2. **File Access Control**
   - Strict workspace boundary enforcement
   - Symlink resolution and validation
   - Path traversal prevention
   - Null byte sanitization
   - Test coverage: 21 tests
   - File: `src/tools/files.ts`

3. **HTTP Request Validation**
   - SSRF prevention (blocks localhost, private IPs, AWS metadata)
   - Protocol whitelist (http/https only)
   - Response size limits (5MB)
   - Request timeouts (30s)
   - Redirect blocking
   - Test coverage: 30 tests
   - File: `src/tools/http.ts`

### 🔐 **Data Protection**

1. **Session Encryption**
   - AES-256-GCM authenticated encryption
   - PBKDF2 key derivation (100,000 iterations)
   - Random salts and IVs per file
   - File permissions: 0600 (owner only)
   - File: `src/security/encryption.ts`

2. **Environment Variables**
   - API keys never logged or exposed
   - Separate .env files per environment
   - .env.example template provided
   - .gitignore prevents accidental commits

### 🚦 **Rate Limiting**

1. **Gateway Protection**
   - 60 messages per minute per IP
   - 5 concurrent connections per IP
   - Automatic cleanup and tracking
   - Retry-After headers
   - Enabled by default in production
   - File: `src/security/ratelimit.ts`

### 📝 **Logging & Monitoring**

1. **Structured Logging**
   - Pino for production-grade logging
   - No sensitive data in logs
   - Request IDs for tracing
   - Log levels: debug, info, warn, error
   - File: `src/utils/logger.ts`

---

## Configuration

### Required Environment Variables

```bash
# AI Provider (at least one required)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
PERPLEXITY_API_KEY=pplx-...
```

### Recommended Security Settings

```bash
# Session Encryption (HIGHLY RECOMMENDED)
SESSION_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Production Mode
NODE_ENV=production

# Rate Limiting (enabled by default in production)
ENABLE_RATE_LIMIT=true
MAX_CONNECTIONS_PER_IP=5
MAX_MESSAGES_PER_MINUTE=60
```

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send details to the repository maintainer
2. **Include**:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 5 business days
- **Resolution Timeline**:
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

- We follow responsible disclosure practices
- We will coordinate with you on public disclosure timing
- We appreciate security researchers and may acknowledge contributors

---

## Security Best Practices

### For Deployment

1. **Environment Variables**
   ```bash
   # Generate strong encryption key
   openssl rand -base64 32 > .encryption-key
   export SESSION_ENCRYPTION_KEY=$(cat .encryption-key)

   # Use production mode
   export NODE_ENV=production
   ```

2. **File Permissions**
   ```bash
   # Secure configuration files
   chmod 600 .env
   chmod 600 .encryption-key

   # Secure session directory
   chmod 700 data/sessions
   ```

3. **Reverse Proxy (nginx/Caddy)**
   ```nginx
   # nginx configuration
   location / {
     proxy_pass http://localhost:3030;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

     # Security headers
     add_header X-Frame-Options "SAMEORIGIN";
     add_header X-Content-Type-Options "nosniff";
     add_header X-XSS-Protection "1; mode=block";
   }
   ```

4. **Firewall**
   ```bash
   # Only allow necessary ports
   ufw allow 443/tcp  # HTTPS
   ufw allow 22/tcp   # SSH
   ufw deny 3030/tcp  # Block direct access to BertBot
   ```

### For Development

1. **Never Commit Secrets**
   - Use `.env` files (already in .gitignore)
   - Use `.env.example` as template
   - Rotate keys regularly

2. **API Key Management**
   - Use separate keys for dev/staging/prod
   - Rotate keys after team member changes
   - Monitor API key usage

3. **Session Encryption**
   - Always use encryption in production
   - Test encryption in development
   - Backup encryption keys securely

4. **Regular Updates**
   ```bash
   # Check for vulnerabilities
   npm audit

   # Fix vulnerabilities
   npm audit fix

   # Update dependencies
   npm update
   ```

---

## Security Checklist for Production

- [ ] Set `SESSION_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy with TLS/SSL
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Set up log rotation
- [ ] Enable monitoring/alerting
- [ ] Backup encryption keys securely
- [ ] Document incident response plan
- [ ] Set file permissions (600 for .env, 700 for data/)
- [ ] Disable debug logging in production
- [ ] Review and restrict tool allowlist
- [ ] Set up intrusion detection (fail2ban, etc.)
- [ ] Configure log aggregation (ELK, Datadog, etc.)

---

## Known Limitations

### Current Scope

1. **Bash Sandboxing**
   - Uses command whitelist, not full container isolation
   - For true isolation, consider Docker (Task #10)

2. **Session Storage**
   - Currently uses encrypted JSON files
   - For better performance/concurrency, consider SQLite (Task #9)

3. **Authentication**
   - Uses allowlist-based access control
   - No built-in OAuth/SSO support

### Future Improvements (Roadmap)

- [ ] Docker-based command execution (Task #10)
- [ ] SQLite session storage (Task #9)
- [ ] User-configurable tool restrictions (Task #13)
- [ ] Audit logging for compliance
- [ ] Multi-tenancy support
- [ ] Advanced rate limiting (per-user, per-tool)

---

## Compliance

### OWASP Top 10 (2021)

| Risk | Status | Mitigation |
|------|--------|------------|
| A01 - Broken Access Control | ✅ | Allowlist, path validation |
| A02 - Cryptographic Failures | ✅ | AES-256-GCM encryption |
| A03 - Injection | ✅ | Command whitelist, input validation |
| A04 - Insecure Design | ✅ | Security by design |
| A05 - Security Misconfiguration | ⚠️ | Documented, needs hardening guide |
| A06 - Vulnerable Components | ✅ | Regular npm audit |
| A07 - Authentication Failures | ⚠️ | Basic allowlist, needs improvement |
| A08 - Data Integrity Failures | ✅ | Auth tags, encryption |
| A09 - Logging Failures | ✅ | Structured logging |
| A10 - SSRF | ✅ | Comprehensive URL validation |

### Data Protection

- Session data encrypted at rest (AES-256-GCM)
- TLS/SSL recommended for data in transit
- No personal data stored by default
- Conversation history encrypted if persistence enabled

---

## Security Updates

### Version 0.1.0 (2026-01-30)

**Critical Security Fixes:**
- Fixed bash sandbox bypass vulnerabilities
- Fixed path traversal and symlink attacks
- Fixed SSRF vulnerabilities (localhost, private IPs, AWS metadata)
- Added session encryption (AES-256-GCM)
- Added rate limiting
- Added comprehensive security testing (88 tests, 87.85% coverage)

See [CHANGELOG.md](CHANGELOG.md) and [AUDIT.md](AUDIT.md) for details.

---

## Contact

For security concerns, please contact the repository maintainer.

**Please report security vulnerabilities responsibly.**

---

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who report valid security issues.

### Security Audit

- **Date**: January 30, 2026
- **Auditor**: Claude Sonnet 4.5
- **Findings**: 5 critical, 3 high, 8 medium issues identified and fixed
- **Result**: Security score improved from 3/10 to 9/10

See [AUDIT.md](AUDIT.md) for full audit report.
