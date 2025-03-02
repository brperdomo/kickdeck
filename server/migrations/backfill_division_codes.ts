
import { db } from "../../db";
import { eventAgeGroups } from "@db/schema";
import { eq, isNull } from "drizzle-orm";

async function main() {
  try {
    // Get all age groups without division codes
    const ageGroupsWithoutCodes = await db
      .select()
      .from(eventAgeGroups)
      .where(isNull(eventAgeGroups.divisionCode));
    
    console.log(`Found ${ageGroupsWithoutCodes.length} age groups without division codes`);
    
    let updated = 0;
    
    // Process each one to add division code
    for (const group of ageGroupsWithoutCodes) {
      let divisionCode = '';
      
      if (group.ageGroup && group.gender) {
        // U10, U11, etc. - extract the age number
        if (group.ageGroup.startsWith('U') && group.ageGroup.length > 1) {
          const ageNum = parseInt(group.ageGroup.substring(1));
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - ageNum;
          divisionCode = `${group.gender.charAt(0)}${birthYear}`;
        } else {
          // Fallback - just use gender-agegroup
          divisionCode = `${group.gender.charAt(0)}-${group.ageGroup}`;
        }
        
        // Update the record
        await db
          .update(eventAgeGroups)
          .set({ divisionCode })
          .where(eq(eventAgeGroups.id, group.id));
          
        updated++;
      }
    }
    
    console.log(`Updated ${updated} age groups with new division codes`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
