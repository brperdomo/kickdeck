/**
 * Direct test of Field Availability Service
 */

import { FieldAvailabilityService } from './server/services/field-availability-service.js';

async function testFieldAvailability() {
  console.log('🧪 Testing Field Availability Service...\n');
  
  const eventId = '1656618593';
  
  try {
    // Test 1: Get available fields
    console.log('1️⃣ Testing getAvailableFields...');
    const fields = await FieldAvailabilityService.getAvailableFields(eventId);
    console.log(`✅ Found ${fields.length} available fields`);
    console.log(`   Field sizes: ${[...new Set(fields.map(f => f.fieldSize))].join(', ')}`);
    console.log(`   Complexes: ${[...new Set(fields.map(f => f.complexName))].join(', ')}\n`);
    
    // Test 2: Get venue capacity
    console.log('2️⃣ Testing getVenueCapacity...');
    const capacity = await FieldAvailabilityService.getVenueCapacity(eventId);
    console.log(`✅ Analyzed ${capacity.length} complexes`);
    capacity.forEach(c => {
      console.log(`   ${c.complexName}: ${c.availableFields}/${c.totalFields} fields available`);
      console.log(`     Field sizes: ${Object.entries(c.fieldsBySize).map(([size, count]) => `${size}(${count})`).join(', ')}`);
    });
    console.log('');
    
    // Test 3: Check field availability
    console.log('3️⃣ Testing checkFieldAvailability...');
    const fieldId = fields[0]?.id;
    if (fieldId) {
      const availability = await FieldAvailabilityService.checkFieldAvailability(
        eventId, fieldId, '08:00', '09:30', 0
      );
      console.log(`✅ Field ${fieldId} availability: ${availability.isAvailable ? 'AVAILABLE' : 'CONFLICTS'}`);
      if (availability.conflicts.length > 0) {
        console.log(`   Conflicts: ${availability.conflicts.map(c => c.message).join(', ')}`);
      }
    }
    console.log('');
    
    // Test 4: Find available time slots
    console.log('4️⃣ Testing findAvailableTimeSlots...');
    const slots = await FieldAvailabilityService.findAvailableTimeSlots(
      eventId, '11v11', 0, 90, 15
    );
    console.log(`✅ Found ${slots.length} available time slots for 11v11 fields on day 0`);
    if (slots.length > 0) {
      console.log(`   Sample slots: ${slots.slice(0, 3).map(s => `${s.startTime}-${s.endTime}`).join(', ')}`);
    }
    console.log('');
    
    // Test 5: Field utilization
    console.log('5️⃣ Testing getFieldUtilization...');
    const utilization = await FieldAvailabilityService.getFieldUtilization(eventId);
    const utilizationValues = Object.values(utilization);
    console.log(`✅ Analyzed utilization for ${utilizationValues.length} fields`);
    utilizationValues.slice(0, 3).forEach(u => {
      console.log(`   ${u.fieldName}: ${u.bookedSlots}/${u.totalSlots} slots (${u.utilizationPercentage}%)`);
    });
    
    console.log('\n🎉 All Field Availability Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testFieldAvailability();