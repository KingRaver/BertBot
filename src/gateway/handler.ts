import type { WebSocket } from "ws";
import type { GatewayMessage, GatewayResponse } from "./types";
import { logger } from "../utils/logger";

export interface GatewayContext {
  socket: WebSocket;
}

export function handleMessage(ctx: GatewayContext, message: GatewayMessage): void {
  switch (message.type) {
    case "ping":
      send(ctx.socket, { type: "pong", id: message.id });
      return;
    case "text":
      logger.info("Gateway text message", message.text);
      send(ctx.socket, { type: "ack", received: true });
      return;
    default:
      send(ctx.socket, { type: "error", error: "Unsupported message" });
  }
}

function send(socket: WebSocket, payload: GatewayResponse): void {
  socket.send(JSON.stringify(payload));
}
