import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleMessage, type GatewayHandlerDeps } from "./handler";
import type { GatewayMessage } from "./types";
import { logger } from "../utils/logger";
import { randomUUID } from "crypto";

export interface GatewayConfig {
  port: number;
  handler?: GatewayHandlerDeps;
}

export interface GatewayInstance {
  app: express.Express;
  server: ReturnType<typeof createServer>;
  wss: WebSocketServer;
  start: () => void;
}

export function createGateway(config: GatewayConfig): GatewayInstance {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const handler = config.handler ?? {};

  wss.on("connection", (socket) => {
    const connectionId = randomUUID();
    socket.on("message", async (data) => {
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
  });

  const start = () => {
    server.listen(config.port, () => {
      logger.info(`Gateway listening on :${config.port}`);
    });
  };

  return { app, server, wss, start };
}
