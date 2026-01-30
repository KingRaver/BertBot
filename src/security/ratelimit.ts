import { logger } from "@utils/logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  // Messages per window
  maxMessagesPerWindow: number;
  // Window duration in milliseconds
  windowMs: number;
  // Max concurrent connections per IP
  maxConnectionsPerIP: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxMessagesPerWindow: 60, // 60 messages
  windowMs: 60000, // per minute
  maxConnectionsPerIP: 5 // 5 concurrent connections per IP
};

export class RateLimiter {
  private messageTracking = new Map<string, RateLimitEntry>();
  private connectionTracking = new Map<string, number>();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a message should be rate limited
   * @param identifier - Usually IP address or connection ID
   * @returns true if allowed, false if rate limited
   */
  checkMessage(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.messageTracking.get(identifier);

    if (!entry || now >= entry.resetAt) {
      // New window
      this.messageTracking.set(identifier, {
        count: 1,
        resetAt: now + this.config.windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxMessagesPerWindow) {
      // Rate limited
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      logger.warn("Rate limit exceeded", {
        identifier,
        count: entry.count,
        limit: this.config.maxMessagesPerWindow,
        retryAfter
      });
      return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Track a new connection
   * @param ip - IP address
   * @returns true if connection allowed, false if too many connections
   */
  trackConnection(ip: string): boolean {
    const current = this.connectionTracking.get(ip) || 0;

    if (current >= this.config.maxConnectionsPerIP) {
      logger.warn("Connection limit exceeded", {
        ip,
        current,
        limit: this.config.maxConnectionsPerIP
      });
      return false;
    }

    this.connectionTracking.set(ip, current + 1);
    return true;
  }

  /**
   * Remove a connection from tracking
   * @param ip - IP address
   */
  releaseConnection(ip: string): void {
    const current = this.connectionTracking.get(ip) || 0;
    if (current <= 1) {
      this.connectionTracking.delete(ip);
    } else {
      this.connectionTracking.set(ip, current - 1);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.messageTracking.entries()) {
      if (now >= entry.resetAt) {
        this.messageTracking.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("Rate limiter cleanup", { cleaned });
    }
  }

  /**
   * Get current stats for monitoring
   */
  getStats() {
    return {
      trackedIdentifiers: this.messageTracking.size,
      activeConnections: Array.from(this.connectionTracking.values()).reduce((a, b) => a + b, 0),
      uniqueIPs: this.connectionTracking.size
    };
  }
}
