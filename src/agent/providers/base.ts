import type { Message } from "../../types/message";

export interface AgentProvider {
  id: string;
  complete(messages: Message[]): Promise<string>;
}
