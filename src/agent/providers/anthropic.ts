import type { AgentProvider } from "./base";
import type { Message } from "../../types/message";
import { assertNonEmpty } from "../../utils/validators";

export interface AnthropicProviderConfig {
  apiKey?: string;
  model?: string;
}

export class AnthropicProvider implements AgentProvider {
  id = "anthropic";
  private client: any;
  private config: AnthropicProviderConfig;

  constructor(client: any, config: AnthropicProviderConfig) {
    this.client = client;
    this.config = config;
  }

  async complete(messages: Message[]): Promise<string> {
    const systemMessages = messages.filter((message) => message.role === "system");
    const userMessages = messages.filter((message) => message.role !== "system");
    const system = systemMessages.map((message) => message.content).join("\n\n");

    const response = await this.client.messages.create({
      model: this.config.model ?? "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: system || undefined,
      messages: userMessages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    });

    const content = response.content?.[0];
    if (content && typeof content.text === "string") {
      return content.text;
    }

    return "";
  }
}

export async function createAnthropicProvider(config: AnthropicProviderConfig): Promise<AgentProvider> {
  const mod = await import("@anthropic-ai/sdk");
  const Anthropic = (mod as any).default ?? (mod as any).Anthropic ?? mod;
  const apiKey = assertNonEmpty(config.apiKey, "ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  return new AnthropicProvider(client, config);
}
