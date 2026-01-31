export type GatewayMessage =
  | { type: "ping"; id?: string }
  | { type: "text"; sessionId?: string; userId?: string; channel?: string; text: string };

export type GatewayResponse =
  | { type: "pong"; id?: string }
  | { type: "ack"; received: boolean }
  | { type: "message"; text: string }
  | { type: "error"; error: string }
  | { type: "error"; code: string; message: string; details?: unknown; retryable?: boolean };
