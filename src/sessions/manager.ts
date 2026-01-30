import type { Message } from "../types/message";
import type { Session } from "./types";
import { SessionStore } from "./store";

export class SessionManager {
  private store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  private async create(sessionId: string): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    await this.store.save(session);
    return session;
  }

  async getOrCreate(channel: string, userId: string): Promise<Session> {
    const sessionId = `${channel}:${userId}`;
    const existing = await this.store.load(sessionId);
    if (existing) {
      return existing;
    }

    return this.create(sessionId);
  }

  async addMessage(session: Session, message: Message): Promise<Session> {
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    await this.store.save(session);
    return session;
  }
}
