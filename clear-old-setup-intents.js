/**
 * Clear Old Setup Intent IDs
 * 
 * This script clears setup intent IDs that were created with test keys
 * so fresh ones can be created with live keys.
 */

import dotenv from 'dotenv';
import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { isNotNull } from 'drizzle-orm';

dotenv.config();

async function clearOldSetupIntents() {
  console.log('🧹 Clearing old setup intent IDs from database...\n');
  
  try {
    // Find teams with setup intent IDs
    const teamsWithSetupIntents = await db.query.teams.findMany({
      where: isNotNull(teams.setupIntentId),
      columns: {
        id: true,
        name: true,
        setupIntentId: true,
        paymentStatus: true
      }
    });
    
    console.log(`Found ${teamsWithSetupIntents.length} teams with setup intent IDs`);
    
    if (teamsWithSetupIntents.length === 0) {
      console.log('No setup intents to clear.');
      return;
    }
    
    // List the setup intents that will be cleared
    teamsWithSetupIntents.forEach(team => {
      console.log(`Team: ${team.name} (ID: ${team.id}) - Setup Intent: ${team.setupIntentId}`);
    });
    
    // Clear the setup intent IDs and reset payment status
    const result = await db.update(teams)
      .set({
        setupIntentId: null,
        paymentMethodId: null,
        cardBrand: null,
        cardLast4: null,
        paymentStatus: 'pending'
      })
      .where(isNotNull(teams.setupIntentId));
    
    console.log(`\n✅ Cleared setup intent data from ${teamsWithSetupIntents.length} teams`);
    console.log('New setup intents will be created with live keys when needed.');
    
  } catch (error) {
    console.error('❌ Error clearing setup intents:', error.message);
  }
}

clearOldSetupIntents();