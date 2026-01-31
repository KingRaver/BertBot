import type { WebSocket } from "ws";
import type { GatewayMessage, GatewayResponse } from "./types";
import { logger } from "@utils/logger";
import { AppError, ErrorCode, toErrorResponse } from "@utils/errors";

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
        const err = new AppError("No text handler configured", ErrorCode.HANDLER_ERROR);
        logger.error("No text handler available", { userId, channel });
        send(ctx.socket, err.toResponse());
        return;
      }

      try {
        const response = await deps.onText({ userId, channel, text: message.text });
        send(ctx.socket, { type: "message", text: response });
      } catch (error) {
        logger.error("Gateway handler failed", error);
        send(ctx.socket, toErrorResponse(error));
      }
      return;
    }
    default:
      const err = new AppError("Unsupported message type", ErrorCode.INVALID_MESSAGE);
      logger.warn("Unsupported message type", { messageType: (message as any).type });
      send(ctx.socket, err.toResponse());
  }
}

function send(socket: WebSocket, payload: GatewayResponse): void {
  socket.send(JSON.stringify(payload));
}
