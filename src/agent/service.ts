import type { ChannelMessage } from "../types/channel";
import type { Message } from "../types/message";
import { AgentRuntime } from "./runtime";
import { ConversationContext } from "./context";
import type { SessionManager } from "../sessions/manager";
import { Allowlist } from "../security/allowlist";

export interface AgentServiceConfig {
  runtime: AgentRuntime;
  sessions: SessionManager;
  allowlist?: Allowlist;
}

export class AgentService {
  private runtime: AgentRuntime;
  private sessions: SessionManager;
  private allowlist?: Allowlist;

  constructor(config: AgentServiceConfig) {
    this.runtime = config.runtime;
    this.sessions = config.sessions;
    this.allowlist = config.allowlist;
  }

  async handleMessage(message: ChannelMessage): Promise<string> {
    if (this.allowlist && !this.allowlist.has(message.userId)) {
      return "Access denied. Your user ID is not allowlisted.";
    }

    const session = await this.sessions.getOrCreate(message.channel, message.userId);
    const response = await this.runtime.run(message.text, this.buildContext(session.messages));

    const now = new Date().toISOString();
    await this.sessions.addMessage(session, { role: "user", content: message.text, createdAt: now });
    await this.sessions.addMessage(session, { role: "assistant", content: response, createdAt: now });

    return response;
  }

  private buildContext(messages: Message[]) {
    const context = new ConversationContext();
    messages.forEach((message) => context.addMessage(message));
    return context;
  }
}
