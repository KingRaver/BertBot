# BertBot API Documentation

**Version:** 0.1.0
**Last Updated:** 2026-01-31

---

## Table of Contents

1. [WebSocket Gateway API](#websocket-gateway-api)
2. [HTTP REST API](#http-rest-api)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Tool System](#tool-system)
6. [Examples](#examples)

---

## WebSocket Gateway API

### Connection

**Endpoint:** `ws://localhost:3030`

**Production:** Use WSS with TLS: `wss://yourdomain.com`

### Message Protocol

All messages are JSON-encoded strings sent over the WebSocket connection.

#### Client → Server Messages

##### 1. Ping Message

Check if the connection is alive.

```json
{
  "type": "ping",
  "id": "optional-correlation-id"
}
```

**Response:**
```json
{
  "type": "pong",
  "id": "optional-correlation-id"
}
```

##### 2. Text Message

Send a text message to the AI agent.

```json
{
  "type": "text",
  "text": "Your message here",
  "userId": "optional-user-id",
  "sessionId": "optional-session-id",
  "channel": "optional-channel-name"
}
```

**Fields:**
- `text` (required): The message content
- `userId` (optional): User identifier (defaults to connection ID)
- `sessionId` (optional): Session identifier (alternative to userId)
- `channel` (optional): Channel name (defaults to "webchat")

**Response:**
```json
{
  "type": "message",
  "text": "AI agent response"
}
```

#### Server → Client Messages

##### 1. Pong Message

Response to a ping message.

```json
{
  "type": "pong",
  "id": "correlation-id"
}
```

##### 2. Message Response

AI agent's response to your message.

```json
{
  "type": "message",
  "text": "The agent's response text"
}
```

##### 3. Acknowledgment

Confirms receipt of a message.

```json
{
  "type": "ack",
  "received": true
}
```

##### 4. Error Response

Indicates an error occurred.

**Legacy Format:**
```json
{
  "type": "error",
  "error": "Error message"
}
```

**New Format** (with error codes):
```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "details": {
    "retryAfter": 30
  },
  "retryable": true
}
```

---

## HTTP REST API

### Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "ok": true
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### WebChat Interface

Access the web-based chat interface.

**Endpoint:** `GET /webchat`

**Response:** HTML page with chat interface

---

## Error Handling

### Error Codes

BertBot uses standardized error codes for consistent error handling across all channels.

#### Client Errors (4xx equivalent)

| Code | Description | Retryable | User Message |
|------|-------------|-----------|--------------|
| `INVALID_INPUT` | Invalid input data | No | "Your request was invalid. Please check your input and try again." |
| `INVALID_MESSAGE` | Invalid message format | No | "Your request was invalid. Please check your input and try again." |
| `INVALID_JSON` | Malformed JSON | No | "Your request was invalid. Please check your input and try again." |
| `UNAUTHORIZED` | Not authorized | No | "You are not authorized to perform this action." |
| `NOT_FOUND` | Resource not found | No | "The requested resource was not found." |
| `RATE_LIMITED` | Rate limit exceeded | Yes | "You're sending messages too quickly. Please wait a moment and try again." |

#### Server Errors (5xx equivalent)

| Code | Description | Retryable | User Message |
|------|-------------|-----------|--------------|
| `INTERNAL_ERROR` | Internal server error | No | "Sorry, something went wrong. Please try again." |
| `PROVIDER_ERROR` | AI provider error | Yes | "The AI provider encountered an error. Please try again later." |
| `TOOL_ERROR` | Tool execution error | No | "A tool encountered an error while processing your request." |
| `CONFIG_ERROR` | Configuration error | No | "Sorry, something went wrong. Please try again." |
| `HANDLER_ERROR` | Handler not available | No | "Sorry, something went wrong. Please try again." |

#### Security Errors

| Code | Description | Retryable | User Message |
|------|-------------|-----------|--------------|
| `SECURITY_VIOLATION` | Security policy violated | No | "Your request was blocked for security reasons." |
| `SANDBOX_VIOLATION` | Sandbox escape attempt | No | "Your request was blocked for security reasons." |
| `PATH_TRAVERSAL` | Path traversal attempt | No | "Your request was blocked for security reasons." |
| `SSRF_ATTEMPT` | SSRF attack attempt | No | "Your request was blocked for security reasons." |

### Error Response Format

```typescript
{
  type: "error";
  code: string;          // Error code from table above
  message: string;       // Human-readable error message
  details?: unknown;     // Optional additional context
  retryable?: boolean;   // Whether the client should retry
}
```

### Example Error Responses

**Rate Limit Exceeded:**
```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "details": {
    "retryAfter": 30
  },
  "retryable": true
}
```

**Security Violation:**
```json
{
  "type": "error",
  "code": "SANDBOX_VIOLATION",
  "message": "Your request was blocked for security reasons.",
  "retryable": false
}
```

**Provider Error:**
```json
{
  "type": "error",
  "code": "PROVIDER_ERROR",
  "message": "The AI provider encountered an error. Please try again later.",
  "retryable": true
}
```

---

## Rate Limiting

Rate limiting is automatically enabled in production (`NODE_ENV=production`).

### Limits

- **Messages:** 60 messages per minute per IP address
- **Connections:** 5 concurrent WebSocket connections per IP address

### Rate Limit Response

When rate limited, you'll receive an error with retry information:

```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "details": {
    "retryAfter": 30
  },
  "retryable": true
}
```

### Configuration

Rate limiting can be configured via environment variables:

```bash
# Enable/disable rate limiting
ENABLE_RATE_LIMIT=true

# Maximum connections per IP
MAX_CONNECTIONS_PER_IP=5

# Maximum messages per minute per IP
MAX_MESSAGES_PER_MINUTE=60
```

---

## Tool System

The agent can execute tools to perform actions. These are internally managed and not directly exposed via the API, but understanding them helps with debugging and development.

### Available Tools

1. **bash** - Execute safe, whitelisted bash commands
2. **files** - Read/write files within workspace
3. **http** - Make HTTP requests to allowed URLs

### Tool Execution

Tools are automatically invoked by the AI agent based on the conversation context. Security restrictions apply:

- **Bash:** Only whitelisted read-only commands allowed
- **Files:** Only within workspace directory
- **HTTP:** Blocks private IPs, localhost, AWS metadata

---

## Examples

### Example 1: Simple Chat

**Client:**
```json
{
  "type": "text",
  "text": "Hello, how are you?"
}
```

**Server:**
```json
{
  "type": "message",
  "text": "Hello! I'm doing well, thank you. How can I help you today?"
}
```

---

### Example 2: Ping/Pong

**Client:**
```json
{
  "type": "ping",
  "id": "ping-123"
}
```

**Server:**
```json
{
  "type": "pong",
  "id": "ping-123"
}
```

---

### Example 3: Rate Limit Exceeded

**Client:** (sends too many messages)

**Server:**
```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "details": {
    "retryAfter": 30
  },
  "retryable": true
}
```

**Client should:** Wait 30 seconds before retrying

---

### Example 4: Custom User ID and Channel

**Client:**
```json
{
  "type": "text",
  "text": "What's the weather?",
  "userId": "user-12345",
  "channel": "mobile-app"
}
```

**Server:**
```json
{
  "type": "message",
  "text": "I don't have access to real-time weather data, but I can help you find weather information if you tell me your location."
}
```

---

### Example 5: Invalid Message Format

**Client:**
```json
{
  "invalid": "message"
}
```

**Server:**
```json
{
  "type": "error",
  "code": "INVALID_MESSAGE",
  "message": "Unsupported message type",
  "retryable": false
}
```

---

## Client Implementation Examples

### JavaScript/TypeScript WebSocket Client

```typescript
const ws = new WebSocket('ws://localhost:3030');

ws.onopen = () => {
  console.log('Connected');

  // Send a message
  ws.send(JSON.stringify({
    type: 'text',
    text: 'Hello, BertBot!',
    userId: 'user-123'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'message':
      console.log('Agent:', message.text);
      break;
    case 'error':
      console.error('Error:', message.code, message.message);
      if (message.retryable) {
        console.log('Can retry after:', message.details?.retryAfter);
      }
      break;
    case 'pong':
      console.log('Pong received');
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Python WebSocket Client

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)

    if data['type'] == 'message':
        print(f"Agent: {data['text']}")
    elif data['type'] == 'error':
        print(f"Error [{data['code']}]: {data['message']}")
        if data.get('retryable'):
            print(f"Retry after: {data.get('details', {}).get('retryAfter')} seconds")
    elif data['type'] == 'pong':
        print("Pong received")

def on_open(ws):
    print("Connected")
    ws.send(json.dumps({
        'type': 'text',
        'text': 'Hello, BertBot!',
        'userId': 'user-123'
    }))

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Disconnected")

ws = websocket.WebSocketApp(
    "ws://localhost:3030",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

ws.run_forever()
```

---

## Security Considerations

### Connection Security

- **Production:** Always use WSS (WebSocket Secure) with TLS/SSL
- **Development:** Use WS for local testing only

### Authentication

Currently, BertBot uses simple user ID-based sessions. For production:

1. Implement authentication middleware
2. Use secure tokens (JWT, OAuth)
3. Configure allowlist for authorized users (`allowlist.json`)

### IP-Based Rate Limiting

Rate limits are per-IP address. If behind a proxy:

- Set `X-Forwarded-For` or `X-Real-IP` headers
- BertBot automatically extracts real IP from these headers

### Message Validation

All messages are validated:

- JSON parsing errors return `INVALID_JSON`
- Missing required fields return `INVALID_INPUT`
- Unknown message types return `INVALID_MESSAGE`

---

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to WebSocket

**Solutions:**
1. Verify server is running: `curl http://localhost:3030/health`
2. Check port is not blocked by firewall
3. Ensure correct protocol (ws:// vs wss://)

### Rate Limited

**Problem:** Receiving `RATE_LIMITED` errors

**Solutions:**
1. Reduce message frequency to < 60/minute
2. Check for multiple clients sharing same IP
3. Wait for `retryAfter` seconds before retrying

### Messages Not Responded To

**Problem:** Sending messages but no response

**Solutions:**
1. Check server logs for errors
2. Verify message format is correct
3. Ensure AI provider API keys are configured
4. Check session encryption key is set (if persistence enabled)

---

## API Versioning

**Current Version:** v0.1.0

BertBot API is currently in beta. Breaking changes may occur before v1.0.0 release.

**Changelog:** See [CHANGELOG.md](CHANGELOG.md) for version history

---

## Support

- **Issues:** [GitHub Issues](https://github.com/KingRaver/bertbot/issues)
- **Security:** See [SECURITY.md](SECURITY.md)
- **Documentation:** [README.md](README.md), [AUDIT.md](AUDIT.md)

---

**Last Updated:** 2026-01-31
**Maintained By:** BertBot Team
