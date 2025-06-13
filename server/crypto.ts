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
    console.log('Crypto compare - stored password format:', storedPassword.substring(0, 10) + '...');
    
    // Handle bcrypt hashes (used for admin reset)
    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      console.log('Using bcrypt comparison');
      const bcrypt = require('bcrypt');
      return bcrypt.compare(suppliedPassword, storedPassword);
    }
    
    console.log('Using scrypt comparison');
    // Handle custom scrypt hashes
    const [hashedPassword, salt] = storedPassword.split(".");
    if (!salt) {
      throw new Error('Invalid password format');
    }
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },

  generateRandomPassword: (length: number = 12) => {
    // Define character sets for stronger passwords
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I,O for clarity
    const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // Removed l,o for clarity
    const numberChars = '23456789'; // Removed 0,1 for clarity
    const specialChars = '!@#$%^&*_-+=';
    
    // Combine all character sets
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    
    // Generate a random password
    let password = '';
    
    // Ensure at least one character from each group for complexity
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest of the password
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to avoid predictable patterns (Fisher-Yates shuffle)
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  },

  generateEventId,
};