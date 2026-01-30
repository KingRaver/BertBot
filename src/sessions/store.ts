import fs from "fs/promises";
import path from "path";
import type { Session } from "./types";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private persistDir?: string;

  constructor(persistDir?: string) {
    this.persistDir = persistDir;
  }

  private toFileName(sessionId: string): string {
    return encodeURIComponent(sessionId).replace(/%/g, "_");
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  async load(sessionId: string): Promise<Session | undefined> {
    const cached = this.sessions.get(sessionId);
    if (cached) {
      return cached;
    }

    if (!this.persistDir) {
      return undefined;
    }

    const filePath = path.join(this.persistDir, `${this.toFileName(sessionId)}.json`);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const session = JSON.parse(raw) as Session;
      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      return undefined;
    }
  }

  list(): Session[] {
    return Array.from(this.sessions.values());
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session);

    if (!this.persistDir) {
      return;
    }

    const filePath = path.join(this.persistDir, `${this.toFileName(session.id)}.json`);
    await fs.mkdir(this.persistDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf8");
  }
}
