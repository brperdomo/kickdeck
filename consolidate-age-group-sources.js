/**
 * Consolidate Age Group Sources
 * 
 * This script consolidates the 4 different age group creation sources 
 * into a single, unified system for better consistency and maintenance.
 */

import { db } from './db/index.ts';
import { eventAgeGroups } from './db/schema.ts';
import { eq } from 'drizzle-orm';

// Single source of truth for standard age groups
const STANDARD_AGE_GROUPS = [
  { ageGroup: 'U4', birthYear: 2021, gender: 'Boys', divisionCode: 'B2021' },
  { ageGroup: 'U4', birthYear: 2021, gender: 'Girls', divisionCode: 'G2021' },
  { ageGroup: 'U5', birthYear: 2020, gender: 'Boys', divisionCode: 'B2020' },
  { ageGroup: 'U5', birthYear: 2020, gender: 'Girls', divisionCode: 'G2020' },
  { ageGroup: 'U6', birthYear: 2019, gender: 'Boys', divisionCode: 'B2019' },
  { ageGroup: 'U6', birthYear: 2019, gender: 'Girls', divisionCode: 'G2019' },
  { ageGroup: 'U7', birthYear: 2018, gender: 'Boys', divisionCode: 'B2018' },
  { ageGroup: 'U7', birthYear: 2018, gender: 'Girls', divisionCode: 'G2018' },
  { ageGroup: 'U8', birthYear: 2017, gender: 'Boys', divisionCode: 'B2017' },
  { ageGroup: 'U8', birthYear: 2017, gender: 'Girls', divisionCode: 'G2017' },
  { ageGroup: 'U9', birthYear: 2016, gender: 'Boys', divisionCode: 'B2016' },
  { ageGroup: 'U9', birthYear: 2016, gender: 'Girls', divisionCode: 'G2016' },
  { ageGroup: 'U10', birthYear: 2015, gender: 'Boys', divisionCode: 'B2015' },
  { ageGroup: 'U10', birthYear: 2015, gender: 'Girls', divisionCode: 'G2015' },
  { ageGroup: 'U11', birthYear: 2014, gender: 'Boys', divisionCode: 'B2014' },
  { ageGroup: 'U11', birthYear: 2014, gender: 'Girls', divisionCode: 'G2014' },
  { ageGroup: 'U12', birthYear: 2013, gender: 'Boys', divisionCode: 'B2013' },
  { ageGroup: 'U12', birthYear: 2013, gender: 'Girls', divisionCode: 'G2013' },
  { ageGroup: 'U13', birthYear: 2012, gender: 'Boys', divisionCode: 'B2012' },
  { ageGroup: 'U13', birthYear: 2012, gender: 'Girls', divisionCode: 'G2012' },
  { ageGroup: 'U14', birthYear: 2011, gender: 'Boys', divisionCode: 'B2011' },
  { ageGroup: 'U14', birthYear: 2011, gender: 'Girls', divisionCode: 'G2011' },
  { ageGroup: 'U15', birthYear: 2010, gender: 'Boys', divisionCode: 'B2010' },
  { ageGroup: 'U15', birthYear: 2010, gender: 'Girls', divisionCode: 'G2010' },
  { ageGroup: 'U16', birthYear: 2009, gender: 'Boys', divisionCode: 'B2009' },
  { ageGroup: 'U16', birthYear: 2009, gender: 'Girls', divisionCode: 'G2009' },
  { ageGroup: 'U17', birthYear: 2008, gender: 'Boys', divisionCode: 'B2008' },
  { ageGroup: 'U17', birthYear: 2008, gender: 'Girls', divisionCode: 'G2008' },
  { ageGroup: 'U18', birthYear: 2007, gender: 'Boys', divisionCode: 'B2007' },
  { ageGroup: 'U18', birthYear: 2007, gender: 'Girls', divisionCode: 'G2007' },
  { ageGroup: 'U19', birthYear: 2006, gender: 'Boys', divisionCode: 'B2006' },
  { ageGroup: 'U19', birthYear: 2006, gender: 'Girls', divisionCode: 'G2006' }
];

function getFieldSize(ageGroup) {
  if (!ageGroup.startsWith('U')) return '11v11';
  const age = parseInt(ageGroup.substring(1));
  if (age <= 7) return '4v4';
  if (age <= 10) return '7v7';
  if (age <= 12) return '9v9';
  return '11v11';
}

async function createStandardAgeGroups(eventId) {
  console.log(`Creating standard age groups for event ${eventId}...`);
  
  const ageGroupsToInsert = STANDARD_AGE_GROUPS.map(group => ({
    eventId: eventId.toString(),
    ageGroup: group.ageGroup,
    birthYear: group.birthYear,
    gender: group.gender,
    divisionCode: group.divisionCode,
    fieldSize: getFieldSize(group.ageGroup),
    projectedTeams: 8,
    createdAt: new Date().toISOString(),
    birthDateStart: new Date(group.birthYear, 0, 1).toISOString().split('T')[0],
    birthDateEnd: new Date(group.birthYear, 11, 31).toISOString().split('T')[0]
  }));

  await db.insert(eventAgeGroups).values(ageGroupsToInsert);
  console.log(`✅ Created ${ageGroupsToInsert.length} standard age groups for event ${eventId}`);
  
  return ageGroupsToInsert;
}

async function consolidateEventAgeGroups(eventId) {
  console.log(`\n🔄 Consolidating age groups for event ${eventId}...`);
  
  // Get existing age groups
  const existing = await db
    .select()
    .from(eventAgeGroups)
    .where(eq(eventAgeGroups.eventId, eventId.toString()));

  console.log(`Found ${existing.length} existing age groups`);
  
  // Check which standard groups are missing
  const existingMap = new Map();
  existing.forEach(group => {
    existingMap.set(group.divisionCode, group);
  });
  
  const missingGroups = STANDARD_AGE_GROUPS.filter(standard => 
    !existingMap.has(standard.divisionCode)
  );
  
  if (missingGroups.length > 0) {
    console.log(`Adding ${missingGroups.length} missing age groups...`);
    
    const groupsToInsert = missingGroups.map(group => ({
      eventId: eventId.toString(),
      ageGroup: group.ageGroup,
      birthYear: group.birthYear,
      gender: group.gender,
      divisionCode: group.divisionCode,
      fieldSize: getFieldSize(group.ageGroup),
      projectedTeams: 8,
      createdAt: new Date().toISOString(),
      birthDateStart: new Date(group.birthYear, 0, 1).toISOString().split('T')[0],
      birthDateEnd: new Date(group.birthYear, 11, 31).toISOString().split('T')[0]
    }));

    await db.insert(eventAgeGroups).values(groupsToInsert);
    console.log(`✅ Added ${groupsToInsert.length} missing age groups`);
  } else {
    console.log('✅ All standard age groups already exist');
  }
}

async function main() {
  console.log('🚀 Starting age group source consolidation...\n');
  
  try {
    // Consolidate your specific event first
    await consolidateEventAgeGroups(1251362271);
    
    // Get all events that have age groups
    const events = await db.execute(`
      SELECT DISTINCT event_id 
      FROM event_age_groups 
      WHERE event_id != '1251362271'
      ORDER BY event_id
    `);
    
    console.log(`\nFound ${events.length} other events with age groups to consolidate`);
    
    for (const event of events) {
      await consolidateEventAgeGroups(parseInt(event.event_id));
    }
    
    console.log('\n🎉 Age group consolidation complete!');
    console.log('✅ All events now have complete, standardized age groups');
    console.log('✅ Single source of truth established');
    
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    throw error;
  }
}

main();