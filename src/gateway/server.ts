import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import type { IncomingMessage } from "http";
import { handleMessage, type GatewayHandlerDeps } from "./handler";
import type { GatewayMessage } from "./types";
import { logger } from "@utils/logger";
import { RateLimiter } from "@security/ratelimit";
import { randomUUID } from "crypto";

export interface GatewayConfig {
  port: number;
  handler?: GatewayHandlerDeps;
  enableRateLimit?: boolean;
}

export interface GatewayInstance {
  app: express.Express;
  server: ReturnType<typeof createServer>;
  wss: WebSocketServer;
  start: () => void;
  rateLimiter?: RateLimiter;
}

function getClientIP(req: IncomingMessage): string {
  // Try to get real IP from headers (for proxies)
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  const realIP = req.headers["x-real-ip"];
  if (typeof realIP === "string") {
    return realIP;
  }

  // Fall back to socket address
  return req.socket.remoteAddress || "unknown";
}

export function createGateway(config: GatewayConfig): GatewayInstance {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const handler = config.handler ?? {};

  // Initialize rate limiter if enabled (default: enabled in production)
  const enableRateLimit = config.enableRateLimit ?? (process.env.NODE_ENV === "production");
  const rateLimiter = enableRateLimit ? new RateLimiter() : undefined;

  if (rateLimiter) {
    logger.info("Rate limiting enabled");
  }

  wss.on("connection", (socket, req) => {
    const connectionId = randomUUID();
    const clientIP = getClientIP(req);

    // Check connection limit
    if (rateLimiter && !rateLimiter.trackConnection(clientIP)) {
      socket.send(JSON.stringify({
        type: "error",
        error: "Too many connections from your IP. Please try again later."
      }));
      socket.close();
      return;
    }

    logger.info("WebSocket connection established", { connectionId, clientIP });

    socket.on("message", async (data) => {
      // Check message rate limit
      if (rateLimiter) {
        const { allowed, retryAfter } = rateLimiter.checkMessage(clientIP);
        if (!allowed) {
          socket.send(JSON.stringify({
            type: "error",
            error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter
          }));
          return;
        }
      }

      const text = data.toString();
      try {
        const parsed = JSON.parse(text) as GatewayMessage;
        await handleMessage({ socket }, parsed, {
          ...handler,
          defaultUserId: connectionId,
          defaultChannel: "webchat"
        });
      } catch (error) {
        logger.warn("Invalid gateway message", error);
        socket.send(JSON.stringify({ type: "error", error: "Invalid message" }));
      }
    });

    socket.on("close", () => {
      if (rateLimiter) {
        rateLimiter.releaseConnection(clientIP);
      }
      logger.info("WebSocket connection closed", { connectionId, clientIP });
    });

    socket.on("error", (error) => {
      logger.error("WebSocket error", error);
    });
  });

  const start = () => {
    server.listen(config.port, () => {
      logger.info(`Gateway listening on :${config.port}`);

      if (rateLimiter) {
        // Log stats every 5 minutes
        setInterval(() => {
          const stats = rateLimiter.getStats();
          logger.debug("Rate limiter stats", stats);
        }, 300000);
      }
    });
  };

  return { app, server, wss, start, rateLimiter };
}
