import fs from "fs/promises";
import path from "path";
import type { Session } from "./types";
import { encrypt, decrypt, isEncryptionEnabled } from "@security/encryption";
import { logger } from "@utils/logger";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private persistDir?: string;
  private encryptionEnabled: boolean;

  constructor(persistDir?: string) {
    this.persistDir = persistDir;
    this.encryptionEnabled = isEncryptionEnabled();

    if (this.persistDir && this.encryptionEnabled) {
      logger.info("Session encryption enabled");
    } else if (this.persistDir && !this.encryptionEnabled) {
      logger.warn(
        "Session encryption is DISABLED. Set SESSION_ENCRYPTION_KEY environment variable to enable. " +
        "Generate one with: openssl rand -base64 32"
      );
    }
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

    const extension = this.encryptionEnabled ? ".enc" : ".json";
    const filePath = path.join(this.persistDir, `${this.toFileName(sessionId)}${extension}`);

    try {
      if (this.encryptionEnabled) {
        // Read encrypted file
        const encrypted = await fs.readFile(filePath);
        const decrypted = decrypt(encrypted);
        const session = JSON.parse(decrypted) as Session;
        this.sessions.set(sessionId, session);
        return session;
      } else {
        // Read plain JSON file (legacy/development)
        const raw = await fs.readFile(filePath, "utf8");
        const session = JSON.parse(raw) as Session;
        this.sessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      // Try loading from old format if new format fails
      if (this.encryptionEnabled) {
        try {
          const oldPath = path.join(this.persistDir, `${this.toFileName(sessionId)}.json`);
          const raw = await fs.readFile(oldPath, "utf8");
          const session = JSON.parse(raw) as Session;
          this.sessions.set(sessionId, session);
          logger.info("Loaded unencrypted session, will encrypt on next save", { sessionId });
          return session;
        } catch {
          // Fall through to return undefined
        }
      }
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

    await fs.mkdir(this.persistDir, { recursive: true });

    const extension = this.encryptionEnabled ? ".enc" : ".json";
    const filePath = path.join(this.persistDir, `${this.toFileName(session.id)}${extension}`);

    if (this.encryptionEnabled) {
      // Encrypt and save
      const plaintext = JSON.stringify(session);
      const encrypted = encrypt(plaintext);
      await fs.writeFile(filePath, encrypted);

      // Set restrictive file permissions (owner read/write only)
      await fs.chmod(filePath, 0o600);
    } else {
      // Save as plain JSON (legacy/development)
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf8");
    }
  }
}
