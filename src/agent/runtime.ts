import type { AgentProvider } from "./providers/base";
import type { ToolRegistry } from "./tools";
import { ConversationContext } from "./context";

export interface AgentRuntimeConfig {
  provider: AgentProvider;
  tools: ToolRegistry;
}

export class AgentRuntime {
  private provider: AgentProvider;
  private tools: ToolRegistry;

  constructor(config: AgentRuntimeConfig) {
    this.provider = config.provider;
    this.tools = config.tools;
  }

  async run(input: string, context = new ConversationContext()): Promise<string> {
    return this.provider.complete(input, context);
  }

  getToolRegistry(): ToolRegistry {
    return this.tools;
  }
}
