import type { Message } from "../types/message";

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}
