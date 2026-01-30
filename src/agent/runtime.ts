import type { AgentProvider } from "./providers/base";
import type { ToolRegistry } from "./tools";
import { ConversationContext } from "./context";

export interface AgentRuntimeConfig {
  provider: AgentProvider;
  tools: ToolRegistry;
  systemPrompt?: string;
  maxToolSteps?: number;
}

interface ToolResponseFinal {
  type: "final";
  content: string;
}

interface ToolResponseCall {
  type: "tool_call";
  tool: string;
  input: string;
}

type ToolResponse = ToolResponseFinal | ToolResponseCall;

export class AgentRuntime {
  private provider: AgentProvider;
  private tools: ToolRegistry;
  private systemPrompt?: string;
  private maxToolSteps: number;

  constructor(config: AgentRuntimeConfig) {
    this.provider = config.provider;
    this.tools = config.tools;
    this.systemPrompt = config.systemPrompt;
    this.maxToolSteps = config.maxToolSteps ?? 4;
  }

  async run(input: string, context = new ConversationContext()): Promise<string> {
    const working = new ConversationContext();

    if (this.systemPrompt) {
      working.addMessage({ role: "system", content: this.systemPrompt });
    }

    working.addMessage({ role: "system", content: this.buildToolPrompt() });
    context.messages.forEach((message) => working.addMessage(message));
    working.addMessage({ role: "user", content: input });

    for (let step = 0; step < this.maxToolSteps; step += 1) {
      const raw = await this.provider.complete(working.messages);
      const parsed = this.parseToolResponse(raw);

      if (parsed.type === "tool_call") {
        const toolName = parsed.tool;
        const toolInput = parsed.input;
        let toolResult = "";

        try {
          if (!this.tools.has(toolName)) {
            toolResult = `Tool not found: ${toolName}`;
          } else {
            toolResult = await this.tools.run(toolName, toolInput);
          }
        } catch (error) {
          toolResult = `Tool error: ${error instanceof Error ? error.message : String(error)}`;
        }

        working.addMessage({ role: "assistant", content: raw });
        working.addMessage({ role: "system", content: `Tool result (${toolName}): ${toolResult}` });
        continue;
      }

      return parsed.content;
    }

    return "I could not complete the request within the allowed tool steps.";
  }

  getToolRegistry(): ToolRegistry {
    return this.tools;
  }

  private buildToolPrompt(): string {
    const toolList = this.tools
      .list()
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");

    return [
      "You can call tools when needed.",
      "When you want to call a tool, respond with JSON only:",
      "{\"type\":\"tool_call\",\"tool\":\"NAME\",\"input\":\"STRING_OR_JSON\"}",
      "When you want to respond to the user, respond with JSON only:",
      "{\"type\":\"final\",\"content\":\"YOUR_RESPONSE\"}",
      "Tool input tips:",
      "- bash: input is a shell command string.",
      "- files: input is JSON with {\"action\":\"read|write\",\"path\":\"...\",\"content\":\"...\"}.",
      "- http: input is JSON with {\"url\":\"...\",\"method\":\"GET|POST\",...}.",
      "Available tools:",
      toolList || "- (no tools available)",
      "Do not include any extra keys or commentary outside the JSON object."
    ].join("\n");
  }

  private parseToolResponse(raw: string): ToolResponse {
    const trimmed = raw.trim();
    const cleaned = this.stripCodeFences(trimmed);
    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
      try {
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        const type = parsed.type;
        if (type === "tool_call" || (!type && parsed.tool)) {
          const tool = String(parsed.tool ?? "");
          const inputValue = parsed.input ?? parsed.tool_input ?? parsed.arguments ?? "";
          const input = typeof inputValue === "string" ? inputValue : JSON.stringify(inputValue);
          if (tool) {
            return { type: "tool_call", tool, input };
          }
        }
        if (type === "final") {
          const content = String(parsed.content ?? "");
          return { type: "final", content };
        }
      } catch (error) {
        return { type: "final", content: raw };
      }
    }

    return { type: "final", content: raw };
  }

  private stripCodeFences(input: string): string {
    if (!input.startsWith("```")) {
      return input;
    }
    const withoutStart = input.replace(/^```[a-zA-Z]*\n?/, "");
    return withoutStart.replace(/```$/, "").trim();
  }
}
