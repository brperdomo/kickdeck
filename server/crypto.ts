import { randomBytes } from "crypto";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const generateEventId = () => {
  // Generate a random number within PostgreSQL INTEGER limits
  const min = 1000000000;  // 10 digits
  const max = 2147483647;  // Max PostgreSQL INTEGER value
  const buffer = randomBytes(4);
  const value = buffer.readUInt32BE(0);
  return min + (value % (max - min));
};

export const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },

  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },

  generateEventId,
};