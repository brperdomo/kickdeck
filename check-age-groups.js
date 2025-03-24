import { db } from "./db/index.js";
import { eventAgeGroups } from "./db/schema.js";
import { sql } from "drizzle-orm";

// Count how many age groups still need updating
async function checkAgeGroups() {
  console.log("Checking age groups...");

  try {
    // Get count of age groups that need updating
    const ageGroupsWithoutCorrectDivisionCode = await db
      .select({ count: sql`count(*)` })
      .from(eventAgeGroups)
      .where(
        sql`division_code IS NULL OR division_code NOT SIMILAR TO '[BG][0-9]{4}'`
      );
    
    console.log(`Age groups without proper division codes: ${ageGroupsWithoutCorrectDivisionCode[0]?.count || 0}`);
    
    // Now count total number of age groups
    const totalAgeGroups = await db
      .select({ count: sql`count(*)` })
      .from(eventAgeGroups);
    
    console.log(`Total age groups: ${totalAgeGroups[0]?.count || 0}`);
    
    // Calculate percentage complete
    const needUpdate = parseInt(ageGroupsWithoutCorrectDivisionCode[0]?.count || '0');
    const total = parseInt(totalAgeGroups[0]?.count || '0');
    
    if (total > 0) {
      const percentComplete = ((total - needUpdate) / total) * 100;
      console.log(`Migration ${percentComplete.toFixed(2)}% complete`);
    }
    
    return true;
  } catch (error) {
    console.error("Error checking age groups:", error);
    return false;
  }
}

// Run the check
checkAgeGroups()
  .then(() => {
    console.log("Check complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });