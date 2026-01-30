export type GatewayMessage =
  | { type: "ping"; id?: string }
  | { type: "text"; sessionId?: string; text: string };

export type GatewayResponse =
  | { type: "pong"; id?: string }
  | { type: "ack"; received: boolean }
  | { type: "error"; error: string };
