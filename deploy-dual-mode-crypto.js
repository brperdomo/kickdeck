/**
 * Dual-mode server with crypto module support
 * This server can run in both ESM and CommonJS environments
 */

// Simplified crypto implementation that works in both ESM and CommonJS
const crypto = {
  /**
   * Generate a random ID
   * @returns {number} A random number between 1 and 1 billion
   */
  generateId: () => {
    return Math.floor(Math.random() * 1000000000) + 1;
  },
  
  /**
   * Hash a password using a simple algorithm
   * @param {string} password The password to hash
   * @returns {string} The hashed password
   */
  hashPassword: (password) => {
    // This is a very simplified implementation
    // In a real app, use a proper hashing library
    return Buffer.from(password + "_salt").toString('base64');
  },
  
  /**
   * Compare a password with its hash
   * @param {string} password The password to check
   * @param {string} hash The hash to compare against
   * @returns {boolean} Whether the password matches the hash
   */
  comparePassword: (password, hash) => {
    return Buffer.from(password + "_salt").toString('base64') === hash;
  },
  
  /**
   * Generate a random authentication token
   * @returns {string} A random authentication token
   */
  generateAuthToken: () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  }
};

// Determine if we're running in ESM mode
const isESM = typeof require === 'undefined' || !require.main || Object.prototype.toString.call(require.main) !== '[object Object]';

if (isESM) {
  // ESM export
  export default crypto;
  export { crypto };
} else {
  // CommonJS export
  module.exports = { crypto };
}