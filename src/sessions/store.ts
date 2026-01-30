import fs from "fs/promises";
import path from "path";
import type { Session } from "./types";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private persistDir?: string;

  constructor(persistDir?: string) {
    this.persistDir = persistDir;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  list(): Session[] {
    return Array.from(this.sessions.values());
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session);

    if (!this.persistDir) {
      return;
    }

    const filePath = path.join(this.persistDir, `${session.id}.json`);
    await fs.mkdir(this.persistDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf8");
  }
}
