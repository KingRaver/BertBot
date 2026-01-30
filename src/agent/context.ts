import type { Message } from "../types/message";

export class ConversationContext {
  messages: Message[] = [];

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  addUserMessage(content: string): void {
    this.addMessage({ role: "user", content });
  }

  addAssistantMessage(content: string): void {
    this.addMessage({ role: "assistant", content });
  }
}
