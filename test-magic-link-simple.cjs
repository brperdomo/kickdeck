/**
 * Simple Magic Link Test
 * 
 * This script tests the basic functionality of generating and verifying magic links
 * by working directly with the database.
 */

require('dotenv').config();

const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mock user agent and IP for testing
const TEST_USER_AGENT = "Test Browser 1.0";
const TEST_IP_ADDRESS = "127.0.0.1";

async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getTestUser() {
  try {
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE "isAdmin" = true 
      ORDER BY id 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error("No admin user found for testing");
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error finding test user:", error);
    throw error;
  }
}

async function createMagicLinkToken(userId) {
  try {
    const token = await generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    // Insert token into database
    const result = await pool.query(`
      INSERT INTO magic_link_tokens 
        (user_id, token, expires_at, used, user_agent, ip_address)
      VALUES 
        ($1, $2, $3, false, $4, $5)
      RETURNING *
    `, [userId, token, expiresAt, TEST_USER_AGENT, TEST_IP_ADDRESS]);
    
    console.log(`Created token: ${token} for user ID: ${userId}, expires: ${expiresAt}`);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating magic link token:", error);
    throw error;
  }
}

async function validateToken(token) {
  try {
    const now = new Date();
    
    // First, find the token
    const tokenResult = await pool.query(`
      SELECT * FROM magic_link_tokens 
      WHERE token = $1
    `, [token]);
    
    if (tokenResult.rows.length === 0) {
      console.log("Token not found");
      return null;
    }
    
    const tokenRecord = tokenResult.rows[0];
    
    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < now) {
      console.log("Token is expired");
      return null;
    }
    
    // Check if token is already used
    if (tokenRecord.used) {
      console.log("Token is already used");
      return null;
    }
    
    // Mark token as used
    await pool.query(`
      UPDATE magic_link_tokens 
      SET used = true 
      WHERE id = $1
    `, [tokenRecord.id]);
    
    // Get user info
    const userResult = await pool.query(`
      SELECT id, email, "firstName", "lastName", "isAdmin" 
      FROM users 
      WHERE id = $1
    `, [tokenRecord.user_id]);
    
    if (userResult.rows.length === 0) {
      console.log("User not found");
      return null;
    }
    
    return {
      user: userResult.rows[0],
      token: tokenRecord
    };
  } catch (error) {
    console.error("Error validating token:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Starting simple magic link test...");
    
    // Get a test user
    const testUser = await getTestUser();
    console.log("Found test user:", testUser.email);
    
    // Create a magic link token
    const tokenRecord = await createMagicLinkToken(testUser.id);
    console.log("Created token record:", tokenRecord);
    
    // Validate the token
    console.log("\nValidating token...");
    const validationResult = await validateToken(tokenRecord.token);
    
    if (validationResult) {
      console.log("✅ Token validation successful!");
      console.log("User:", validationResult.user);
    } else {
      console.log("❌ Token validation failed!");
    }
    
    // Try to validate the same token again (should fail as it's already used)
    console.log("\nTrying to validate the same token again (should fail)...");
    const secondValidationResult = await validateToken(tokenRecord.token);
    
    if (!secondValidationResult) {
      console.log("✅ Second validation correctly failed (token already used)");
    } else {
      console.log("❌ Second validation unexpectedly succeeded!");
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the test
main();