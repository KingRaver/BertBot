import fs from "fs/promises";
import path from "path";
import type { Session } from "./types";
import { encrypt, decrypt, isEncryptionEnabled } from "@security/encryption";
import { logger } from "@utils/logger";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private persistDir?: string;
  private encryptionEnabled: boolean;
  private cleanupInterval?: NodeJS.Timeout;
  private sessionTTL: number;
  private cleanupIntervalMs: number;

  constructor(persistDir?: string, options?: { sessionTTL?: number; cleanupInterval?: number }) {
    this.persistDir = persistDir;
    this.encryptionEnabled = isEncryptionEnabled();

    // Default: 24 hours TTL, cleanup every hour
    this.sessionTTL = options?.sessionTTL ?? 24 * 60 * 60 * 1000;
    this.cleanupIntervalMs = options?.cleanupInterval ?? 60 * 60 * 1000;

    if (this.persistDir && this.encryptionEnabled) {
      logger.info("Session encryption enabled");
    } else if (this.persistDir && !this.encryptionEnabled) {
      logger.warn(
        "Session encryption is DISABLED. Set SESSION_ENCRYPTION_KEY environment variable to enable. " +
        "Generate one with: openssl rand -base64 32"
      );
    }

    // Start automatic cleanup
    this.startCleanup();
    logger.info("Session cleanup initialized", {
      ttl: `${this.sessionTTL / 1000 / 60 / 60}h`,
      cleanupInterval: `${this.cleanupIntervalMs / 1000 / 60}m`
    });
  }

  private toFileName(sessionId: string): string {
    return encodeURIComponent(sessionId).replace(/%/g, "_");
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);

    // Prevent the interval from keeping the process alive
    this.cleanupInterval.unref();
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > this.sessionTTL) {
        this.sessions.delete(id);
        cleanedCount++;
        logger.debug("Session expired and removed from memory", { sessionId: id });
      }
    }

    if (cleanedCount > 0) {
      logger.info("Cleaned up expired sessions", { count: cleanedCount });
    }
  }

  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  get(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last accessed time
      session.lastAccessed = Date.now();
    }
    return session;
  }

  async load(sessionId: string): Promise<Session | undefined> {
    const cached = this.sessions.get(sessionId);
    if (cached) {
      // Update last accessed time
      cached.lastAccessed = Date.now();
      return cached;
    }

    if (!this.persistDir) {
      return undefined;
    }

    const extension = this.encryptionEnabled ? ".enc" : ".json";
    const filePath = path.join(this.persistDir, `${this.toFileName(sessionId)}${extension}`);

    try {
      let session: Session;

      if (this.encryptionEnabled) {
        // Read encrypted file
        const encrypted = await fs.readFile(filePath);
        const decrypted = decrypt(encrypted);
        session = JSON.parse(decrypted) as Session;
      } else {
        // Read plain JSON file (legacy/development)
        const raw = await fs.readFile(filePath, "utf8");
        session = JSON.parse(raw) as Session;
      }

      // Ensure lastAccessed exists (for backward compatibility)
      if (!session.lastAccessed) {
        session.lastAccessed = Date.now();
      } else {
        // Update last accessed time
        session.lastAccessed = Date.now();
      }

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      // Try loading from old format if new format fails
      if (this.encryptionEnabled) {
        try {
          const oldPath = path.join(this.persistDir, `${this.toFileName(sessionId)}.json`);
          const raw = await fs.readFile(oldPath, "utf8");
          const session = JSON.parse(raw) as Session;

          // Ensure lastAccessed exists
          if (!session.lastAccessed) {
            session.lastAccessed = Date.now();
          }

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
    // Ensure lastAccessed is set
    if (!session.lastAccessed) {
      session.lastAccessed = Date.now();
    }

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
