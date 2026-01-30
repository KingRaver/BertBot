import type { WebSocket } from "ws";
import type { GatewayMessage, GatewayResponse } from "./types";
import { logger } from "../utils/logger";

export interface GatewayContext {
  socket: WebSocket;
}

export interface GatewayHandlerDeps {
  onText?: (payload: { userId: string; channel: string; text: string }) => Promise<string>;
  defaultUserId?: string;
  defaultChannel?: string;
}

export async function handleMessage(
  ctx: GatewayContext,
  message: GatewayMessage,
  deps: GatewayHandlerDeps
): Promise<void> {
  switch (message.type) {
    case "ping":
      send(ctx.socket, { type: "pong", id: message.id });
      return;
    case "text": {
      const userId = message.userId ?? message.sessionId ?? deps.defaultUserId ?? "webchat";
      const channel = message.channel ?? deps.defaultChannel ?? "webchat";

      if (!deps.onText) {
        send(ctx.socket, { type: "error", error: "No handler available" });
        return;
      }

      try {
        const response = await deps.onText({ userId, channel, text: message.text });
        send(ctx.socket, { type: "message", text: response });
      } catch (error) {
        logger.error("Gateway handler failed", error);
        send(ctx.socket, { type: "error", error: "Handler error" });
      }
      return;
    }
    default:
      send(ctx.socket, { type: "error", error: "Unsupported message" });
  }
}

function send(socket: WebSocket, payload: GatewayResponse): void {
  socket.send(JSON.stringify(payload));
}
