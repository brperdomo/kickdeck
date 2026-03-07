/**
 * AES-256-GCM encryption/decryption for sensitive data (API keys, secrets).
 * Uses Node.js built-in crypto module — no external dependencies.
 *
 * Encrypted format: "iv:authTag:ciphertext" (all base64-encoded)
 */
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Derive a 32-byte key from the secret using SHA-256.
 * This ensures any-length secret produces a valid AES-256 key.
 */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/**
 * Get the encryption secret from environment variables.
 * Falls back to SESSION_SECRET which is always set.
 */
function getSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('No encryption secret available. Set ENCRYPTION_SECRET or SESSION_SECRET.');
  }
  return secret;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in format "iv:authTag:ciphertext" (base64 encoded).
 */
export function encrypt(plaintext: string): string {
  const secret = getSecret();
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted by encrypt().
 * Expects format "iv:authTag:ciphertext" (base64 encoded).
 */
export function decrypt(encryptedData: string): string {
  const secret = getSecret();
  const key = deriveKey(secret);

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivB64, authTagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask an API key for display (e.g., "sk-proj-...abc1").
 * Shows the first 7 chars and last 4 chars.
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••';
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}
