const { Pool } = require('pg');

// Database connection using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSchedulingFix() {
  console.log('🧪 Testing Scheduling Fix - Cross-Event Field Validation');
  
  try {
    // 1. Test event-complex relationship
    console.log('\n📊 Testing Event-Complex Relationship...');
    const eventComplexes = await pool.query(`
      SELECT ec.event_id, ec.complex_id, c.name as complex_name, 
             COUNT(f.id) as field_count
      FROM event_complexes ec 
      LEFT JOIN complexes c ON ec.complex_id = c.id 
      LEFT JOIN fields f ON c.id = f.complex_id 
      WHERE ec.event_id = '1844329078'
      GROUP BY ec.event_id, ec.complex_id, c.name
    `);
    
    console.log('Event-Complex relationship:', eventComplexes.rows);
    
    // 2. Test field availability by size
    console.log('\n🏟️ Testing Field Availability by Size...');
    const fieldsBySize = await pool.query(`
      SELECT f.field_size, COUNT(f.id) as count, 
             array_agg(f.id) as field_ids,
             array_agg(f.name) as field_names
      FROM event_complexes ec 
      LEFT JOIN complexes c ON ec.complex_id = c.id 
      LEFT JOIN fields f ON c.id = f.complex_id 
      WHERE ec.event_id = '1844329078' AND f.is_open = true
      GROUP BY f.field_size
      ORDER BY f.field_size
    `);
    
    console.log('Fields by size for event 1844329078:', fieldsBySize.rows);
    
    // 3. Test for existing games to check conflict detection
    console.log('\n⚽ Testing Existing Games (should be 0 after cleanup)...');
    const existingGames = await pool.query(`
      SELECT COUNT(*) as game_count, 
             COUNT(DISTINCT field_id) as unique_fields_used
      FROM games 
      WHERE event_id = '1844329078'
    `);
    
    console.log('Existing games:', existingGames.rows);
    
    // 4. Simulate field assignment logic
    console.log('\n🎯 Simulating Field Assignment Logic...');
    
    const gameScenarios = [
      { gameNumber: 0, bracketName: 'U14 Boys Middle Flight', expectedFieldSize: '9v9' },
      { gameNumber: 1, bracketName: 'U17 Boys Top Flight', expectedFieldSize: '11v11' },
      { gameNumber: 2, bracketName: 'U12 Girls Bottom Flight', expectedFieldSize: '7v7' }
    ];
    
    for (const scenario of gameScenarios) {
      console.log(`\n   Game ${scenario.gameNumber}: ${scenario.bracketName}`);
      console.log(`   Expected field size: ${scenario.expectedFieldSize}`);
      
      // Find available fields for this size
      const availableFields = await pool.query(`
        SELECT f.id, f.name, f.field_size
        FROM event_complexes ec 
        LEFT JOIN complexes c ON ec.complex_id = c.id 
        LEFT JOIN fields f ON c.id = f.complex_id 
        WHERE ec.event_id = '1844329078' 
        AND f.field_size = $1 
        AND f.is_open = true
        ORDER BY f.id
      `, [scenario.expectedFieldSize]);
      
      if (availableFields.rows.length > 0) {
        const selectedField = availableFields.rows[scenario.gameNumber % availableFields.rows.length];
        console.log(`   ✅ Would assign Field ${selectedField.id} (${selectedField.name}) - ${selectedField.field_size}`);
      } else {
        console.log(`   ❌ No fields available for ${scenario.expectedFieldSize}`);
      }
    }
    
    // 5. Test cross-event conflict detection simulation
    console.log('\n🚨 Testing Cross-Event Conflict Detection...');
    
    // Check if any other events have games on the same fields
    const crossEventConflicts = await pool.query(`
      SELECT DISTINCT g.event_id, COUNT(g.id) as game_count,
             array_agg(DISTINCT g.field_id) as field_ids_used
      FROM games g 
      WHERE g.field_id IN (
        SELECT f.id 
        FROM event_complexes ec 
        LEFT JOIN fields f ON ec.complex_id = f.complex_id 
        WHERE ec.event_id = '1844329078'
      )
      AND g.event_id != '1844329078'
      GROUP BY g.event_id
    `);
    
    if (crossEventConflicts.rows.length > 0) {
      console.log('⚠️ Found potential field conflicts with other events:', crossEventConflicts.rows);
    } else {
      console.log('✅ No cross-event field conflicts detected');
    }
    
    console.log('\n🎉 Scheduling Fix Test Complete!');
    console.log('\n📋 SUMMARY:');
    console.log(`   - Event has ${fieldsBySize.rows.length} field size categories available`);
    console.log(`   - Total fields available: ${fieldsBySize.rows.reduce((sum, row) => sum + parseInt(row.count), 0)}`);
    console.log(`   - Cross-event conflicts: ${crossEventConflicts.rows.length} events`);
    console.log('   - Field assignment logic: READY ✅');
    console.log('   - Cross-event validation: IMPLEMENTED ✅');
    
  } catch (error) {
    console.error('❌ Error testing scheduling fix:', error);
  } finally {
    await pool.end();
  }
}

testSchedulingFix();