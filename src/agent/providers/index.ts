import type { ProviderConfig } from "../../types/config";
import type { AgentProvider } from "./base";
import { createOpenAIProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { createPerplexityProvider } from "./perplexity";

export async function createProvider(config: ProviderConfig): Promise<AgentProvider> {
  switch (config.type) {
    case "openai":
      return createOpenAIProvider(config);
    case "anthropic":
      return createAnthropicProvider(config);
    case "perplexity":
      return createPerplexityProvider(config);
    default:
      throw new Error(`Unsupported provider: ${config.type}`);
  }
}
