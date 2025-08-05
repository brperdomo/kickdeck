// Quick test to verify field assignment is working
console.log('Starting field assignment test...');

// Since this is TypeScript, let's use a direct SQL query approach
const { db } = require('./db/index.js');

async function testFieldAssignment() {
  console.log('🧪 Testing event-complex relationship...');
  
  // Query event complexes directly
  const result = await db.query(`
    SELECT ec.event_id, ec.complex_id, c.name as complex_name, 
           f.id as field_id, f.name as field_name, f.field_size 
    FROM event_complexes ec 
    LEFT JOIN complexes c ON ec.complex_id = c.id 
    LEFT JOIN fields f ON c.id = f.complex_id 
    WHERE ec.event_id = '1844329078' 
    ORDER BY f.id
  `);
  
  console.log('Database result:', result.rows);
  return result.rows;
}

async function testFieldAssignment() {
  console.log('🧪 Testing field assignment for event 1844329078...');
  
  try {
    // Test getting real complexes for the event
    const realComplexes = await SimpleScheduler.getRealComplexesForEvent('1844329078');
    console.log(`📍 Found ${realComplexes.length} complexes:`, JSON.stringify(realComplexes, null, 2));
    
    // Test field assignment for U14 bracket
    const fieldId = SimpleScheduler.assignRealFieldIdSync(0, 'U14 Boys Middle Flight', realComplexes);
    console.log(`🏟️ Assigned field ID: ${fieldId}`);
    
    if (fieldId) {
      console.log('✅ SUCCESS: Field assignment is working!');
    } else {
      console.log('❌ FAILURE: Field assignment still returning null');
    }
  } catch (error) {
    console.error('❌ Error testing field assignment:', error);
  }
}

testFieldAssignment();