import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleMessage } from "./handler";
import type { GatewayMessage } from "./types";
import { logger } from "../utils/logger";

export interface GatewayConfig {
  port: number;
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

  wss.on("connection", (socket) => {
    socket.on("message", (data) => {
      const text = data.toString();
      try {
        const parsed = JSON.parse(text) as GatewayMessage;
        handleMessage({ socket }, parsed);
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
