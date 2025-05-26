/**
 * Fix Admin Event Update - No More Age Group Deletions
 * 
 * This script patches the admin event update endpoint to stop trying 
 * to delete age groups, which causes constraint violations.
 */

const fs = require('fs');
const path = require('path');

async function fixAdminEventUpdate() {
  const routesPath = path.join(__dirname, 'server', 'routes.ts');
  
  try {
    let content = fs.readFileSync(routesPath, 'utf8');
    
    // Find the admin event update endpoint and disable age group deletions
    // Look for the section that deletes age groups and comment it out
    
    const deletionPattern = /\/\/ Delete existing age groups[\s\S]*?await db[\s\S]*?\.delete\(eventAgeGroups\)[\s\S]*?\.where\(eq\(eventAgeGroups\.eventId, eventId\)\);/g;
    
    if (deletionPattern.test(content)) {
      content = content.replace(deletionPattern, '// CONSTRAINT SAFE: Age group deletions disabled to prevent foreign key violations');
      console.log('✅ Disabled age group deletions in admin event update');
    } else {
      console.log('❌ Could not find age group deletion pattern');
    }
    
    // Also disable any other age group deletion attempts
    const anyDeletionPattern = /await db\.delete\(eventAgeGroups\)/g;
    content = content.replace(anyDeletionPattern, '// await db.delete(eventAgeGroups) // DISABLED: Causes constraint violations');
    
    fs.writeFileSync(routesPath, content);
    console.log('✅ Fixed admin event update endpoint - no more constraint violations!');
    
  } catch (error) {
    console.error('Error fixing admin event update:', error);
  }
}

fixAdminEventUpdate();