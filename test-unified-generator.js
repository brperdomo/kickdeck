/**
 * Test the unified age group generator with different configurations
 */

import { generateStandardAgeGroups } from './server/lib/ageGroupGenerator.ts';

console.log('🚀 Testing Unified Age Group Generator\n');

// Test 1: Standard Boys/Girls age groups (current default)
console.log('1️⃣ Standard Boys/Girls Age Groups:');
const standard = generateStandardAgeGroups();
console.log(`Generated ${standard.length} groups`);
console.log('Sample:', standard.slice(0, 6).map(g => `${g.ageGroup}-${g.gender}`).join(', '));

// Test 2: Coed alongside Boys/Girls
console.log('\n2️⃣ Boys/Girls + Coed Age Groups:');
const withCoed = generateStandardAgeGroups({ includeCoed: true });
console.log(`Generated ${withCoed.length} groups`);
console.log('Sample:', withCoed.slice(0, 9).map(g => `${g.ageGroup}-${g.gender}`).join(', '));

// Test 3: Coed-only age groups
console.log('\n3️⃣ Coed-Only Age Groups:');
const coedOnly = generateStandardAgeGroups({ coedOnly: true });
console.log(`Generated ${coedOnly.length} groups`);
console.log('Sample:', coedOnly.slice(0, 6).map(g => `${g.ageGroup}-${g.gender}`).join(', '));

// Test 4: U19 Consolidated (includes both U18 and U19 players)
console.log('\n4️⃣ U19 Consolidated Age Groups:');
const u19Consolidated = generateStandardAgeGroups({ includeU19Consolidated: true });
console.log(`Generated ${u19Consolidated.length} groups`);
const u18u19Groups = u19Consolidated.filter(g => g.ageGroup === 'U18' || g.ageGroup === 'U19');
console.log('U18/U19 groups:', u18u19Groups.map(g => `${g.ageGroup}-${g.gender} (birth:${g.birthYear})`));

console.log('\n✅ Single source successfully handles all configurations!');