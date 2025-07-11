/**
 * Debug Game Metadata API Issue
 * 
 * This script helps diagnose why the game metadata API is returning 500 errors
 * when called from the frontend but working correctly from curl with auth.
 */

const fetch = require('node-fetch');

async function debugGameMetadata() {
  try {
    console.log('Testing game metadata API...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:5000/api/admin/events/1656618593/game-metadata', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('Response body:', result);
    
    if (!response.ok) {
      console.log('API returned error status:', response.status);
    }
    
  } catch (error) {
    console.error('Error testing game metadata API:', error);
  }
}

// Test database connection directly
async function testDatabaseConnection() {
  try {
    const { db } = await import('./db/index.js');
    const { eventGameFormats } = await import('./db/schema.js');
    const { eq } = await import('drizzle-orm');
    
    console.log('Testing database connection...');
    
    const testQuery = await db
      .select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, 1656618593))
      .limit(1);
    
    console.log('Database query successful, results:', testQuery.length);
    
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

async function main() {
  console.log('=== Game Metadata API Debug ===');
  await debugGameMetadata();
  
  console.log('\n=== Database Connection Test ===');
  await testDatabaseConnection();
}

main().catch(console.error);