import type { AgentProvider } from "./base";
import type { ConversationContext } from "../context";
import { assertNonEmpty } from "../../utils/validators";

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
}

export class OpenAIProvider implements AgentProvider {
  id = "openai";
  private client: any;
  private config: OpenAIProviderConfig;

  constructor(client: any, config: OpenAIProviderConfig) {
    this.client = client;
    this.config = config;
  }

  async complete(input: string, context: ConversationContext): Promise<string> {
    const messages = [
      ...context.messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      { role: "user", content: input }
    ];

    const response = await this.client.chat.completions.create({
      model: this.config.model ?? "gpt-4o-mini",
      messages
    });

    return response.choices?.[0]?.message?.content ?? "";
  }
}

export async function createOpenAIProvider(config: OpenAIProviderConfig): Promise<AgentProvider> {
  const mod = await import("openai");
  const OpenAI = (mod as any).default ?? (mod as any).OpenAI ?? mod;
  const apiKey = assertNonEmpty(config.apiKey, "OPENAI_API_KEY");
  const client = new OpenAI({ apiKey });
  return new OpenAIProvider(client, config);
}
