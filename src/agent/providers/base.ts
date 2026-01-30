import type { ConversationContext } from "../context";

export interface AgentProvider {
  id: string;
  complete(input: string, context: ConversationContext): Promise<string>;
}
