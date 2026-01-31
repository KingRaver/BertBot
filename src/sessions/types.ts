import type { Message } from "../types/message";

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed: number; // Unix timestamp in milliseconds
  messages: Message[];
}
