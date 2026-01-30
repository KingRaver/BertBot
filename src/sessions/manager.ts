import { randomUUID } from "crypto";
import type { Message } from "../types/message";
import type { Session } from "./types";
import { SessionStore } from "./store";

export class SessionManager {
  private store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  async create(): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    await this.store.save(session);
    return session;
  }

  async addMessage(session: Session, message: Message): Promise<Session> {
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    await this.store.save(session);
    return session;
  }
}
