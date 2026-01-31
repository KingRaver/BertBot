import { randomBytes, timingSafeEqual } from "crypto";

/**
 * Configuration for pairing codes
 */
export interface PairingCodeConfig {
  length?: number;           // Default: 8 characters
  expiryMs?: number;         // Default: 5 minutes
  charset?: "numeric" | "alphanumeric" | "alphanumeric-upper";
}

/**
 * Pairing code with metadata
 */
export interface PairingCode {
  code: string;
  createdAt: number;        // Unix timestamp in milliseconds
  expiresAt: number;        // Unix timestamp in milliseconds
  userId?: string;          // Optional user identifier
  metadata?: Record<string, unknown>;
}

const DEFAULT_CONFIG: Required<PairingCodeConfig> = {
  length: 8,
  expiryMs: 5 * 60 * 1000,  // 5 minutes
  charset: "alphanumeric-upper"
};

const CHARSETS = {
  numeric: "0123456789",
  alphanumeric: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "alphanumeric-upper": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};

/**
 * Generate a cryptographically secure pairing code
 *
 * @param config - Configuration for code generation
 * @returns Pairing code with metadata
 */
export function generatePairingCode(config: PairingCodeConfig = {}): PairingCode {
  const {
    length,
    expiryMs,
    charset
  } = { ...DEFAULT_CONFIG, ...config };

  // Validate length
  if (length < 8) {
    throw new Error("Pairing code length must be at least 8 characters");
  }

  const chars = CHARSETS[charset];
  const randomValues = randomBytes(length);

  // Generate code using cryptographically secure random values
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[randomValues[i] % chars.length];
  }

  const now = Date.now();

  return {
    code,
    createdAt: now,
    expiresAt: now + expiryMs
  };
}

/**
 * Verify a pairing code using timing-safe comparison
 *
 * @param expected - The expected pairing code object
 * @param provided - The provided code string
 * @returns true if code is valid and not expired, false otherwise
 */
export function verifyPairingCode(expected: PairingCode, provided: string): boolean {
  // Check if code has expired
  if (Date.now() > expected.expiresAt) {
    return false;
  }

  // Normalize both codes (trim, uppercase if alphanumeric-upper)
  const normalizedExpected = expected.code.trim();
  const normalizedProvided = provided.trim();

  // Check length first (prevents timing attacks on length)
  if (normalizedExpected.length !== normalizedProvided.length) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(normalizedExpected, "utf8");
    const providedBuffer = Buffer.from(normalizedProvided, "utf8");

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Check if a pairing code has expired
 *
 * @param pairingCode - The pairing code to check
 * @returns true if expired, false otherwise
 */
export function isExpired(pairingCode: PairingCode): boolean {
  return Date.now() > pairingCode.expiresAt;
}

/**
 * Get remaining time in milliseconds before expiration
 *
 * @param pairingCode - The pairing code to check
 * @returns milliseconds until expiration (0 if already expired)
 */
export function getTimeRemaining(pairingCode: PairingCode): number {
  const remaining = pairingCode.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format time remaining in human-readable form
 *
 * @param pairingCode - The pairing code to check
 * @returns formatted string like "4m 30s" or "expired"
 */
export function formatTimeRemaining(pairingCode: PairingCode): string {
  const ms = getTimeRemaining(pairingCode);

  if (ms === 0) {
    return "expired";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}
