/**
 * Test Field Assignment Fix
 * 
 * This script tests the new field assignment logic to ensure
 * games get proper field IDs assigned during generation.
 */

import { db } from "./db/index.ts";
import { fields } from "./db/schema.ts";
import { eq } from "drizzle-orm";

async function testFieldAssignmentFix() {
  console.log('🧪 Testing field assignment fix...');
  
  const eventId = "1656618593"; // The "SCHEDULING TEAMS" tournament
  
  // Get available fields for this event
  console.log('📍 Checking available fields for event...');
  const eventFields = await db
    .select()
    .from(fields)
    .where(eq(fields.eventId, eventId));
  
  console.log(`Found ${eventFields.length} fields:`);
  eventFields.forEach(field => {
    console.log(`  Field ${field.id}: ${field.name} (${field.fieldSize}, Complex: ${field.complexId})`);
  });
  
  // Import SimpleScheduler and test field ID assignment
  console.log('\n🏗️  Testing field ID assignment logic...');
  const { SimpleScheduler } = await import('./server/services/simple-scheduler.js');
  
  // Get real complexes for the event
  const realComplexes = await SimpleScheduler.getRealComplexesForEvent(eventId);
  console.log(`Found ${realComplexes.length} complexes with fields`);
  
  // Test field ID assignment for different age groups
  const testCases = [
    { gameNumber: 1, bracketName: "U17 Boys Flight A" },
    { gameNumber: 2, bracketName: "U17 Boys Flight A" },
    { gameNumber: 3, bracketName: "U16 Girls Flight B" },
    { gameNumber: 4, bracketName: "U15 Boys Premier" }
  ];
  
  console.log('\n🎯 Testing field ID assignments:');
  for (const testCase of testCases) {
    const fieldId = await SimpleScheduler.assignRealFieldId(
      testCase.gameNumber, 
      testCase.bracketName, 
      realComplexes
    );
    const fieldName = await SimpleScheduler.assignRealField(
      testCase.gameNumber, 
      testCase.bracketName, 
      realComplexes
    );
    
    console.log(`  Game ${testCase.gameNumber} (${testCase.bracketName}):`);
    console.log(`    → Field ID: ${fieldId}`);
    console.log(`    → Field Name: ${fieldName}`);
    
    // Verify the field ID exists in the database
    if (fieldId) {
      const fieldExists = eventFields.find(f => f.id === fieldId);
      if (fieldExists) {
        console.log(`    ✅ Field ID ${fieldId} exists in database`);
      } else {
        console.log(`    ❌ Field ID ${fieldId} NOT found in database`);
      }
    } else {
      console.log(`    ⚠️  No field ID assigned`);
    }
  }
  
  console.log('\n🔍 Summary:');
  console.log(`- Event has ${eventFields.length} available fields`);
  console.log(`- SimpleScheduler found ${realComplexes.length} complexes`);
  console.log('- Field ID assignment logic should now work correctly');
  console.log('- Games should appear as assigned in Step 7 interface');
}

testFieldAssignmentFix().catch(console.error);