import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Derives an encryption key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Gets or generates encryption key from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.SESSION_ENCRYPTION_KEY;

  if (!password) {
    throw new Error(
      "SESSION_ENCRYPTION_KEY environment variable is required for session encryption. " +
      "Generate one with: openssl rand -base64 32"
    );
  }

  if (password.length < 32) {
    throw new Error(
      "SESSION_ENCRYPTION_KEY must be at least 32 characters long for security"
    );
  }

  return password;
}

/**
 * Encrypts data using AES-256-GCM
 * Format: [salt(32)][iv(16)][authTag(16)][encrypted data]
 */
export function encrypt(plaintext: string): Buffer {
  const password = getEncryptionPassword();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from password
  const key = deriveKey(password, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(ciphertext: Buffer): string {
  const password = getEncryptionPassword();

  // Extract components
  const salt = ciphertext.subarray(0, SALT_LENGTH);
  const iv = ciphertext.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = ciphertext.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = ciphertext.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  // Derive key from password
  const key = deriveKey(password, salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

/**
 * Checks if encryption is enabled (SESSION_ENCRYPTION_KEY is set)
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.SESSION_ENCRYPTION_KEY && process.env.SESSION_ENCRYPTION_KEY.length >= 32;
}
