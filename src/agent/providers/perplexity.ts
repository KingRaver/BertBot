import type { AgentProvider } from "./base";
import type { Message } from "../../types/message";
import { assertNonEmpty } from "../../utils/validators";

export interface PerplexityProviderConfig {
  apiKey?: string;
  model?: string;
}

export class PerplexityProvider implements AgentProvider {
  id = "perplexity";
  private client: any;
  private config: PerplexityProviderConfig;

  constructor(client: any, config: PerplexityProviderConfig) {
    this.client = client;
    this.config = config;
  }

  async complete(messages: Message[]): Promise<string> {
    const payload = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));
    const response = await this.client.chat.completions.create({
      model: this.config.model ?? "sonar-pro",
      messages: payload
    });

    return response.choices?.[0]?.message?.content ?? "";
  }
}

export async function createPerplexityProvider(config: PerplexityProviderConfig): Promise<AgentProvider> {
  const mod = await import("openai");
  const OpenAI = (mod as any).default ?? (mod as any).OpenAI ?? mod;
  const apiKey = assertNonEmpty(config.apiKey, "PERPLEXITY_API_KEY");
  const client = new OpenAI({ apiKey, baseURL: "https://api.perplexity.ai" });
  return new PerplexityProvider(client, config);
}
