/**
 * Migrate Complexes to Mapbox with Multi-Tenant Support
 * 
 * This script adds the necessary columns to support Mapbox geocoding
 * and multi-tenant complex management with unique global identifiers
 * to prevent scheduling conflicts across client instances.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function migrateComplexesToMapbox() {
  try {
    console.log('🚀 Starting Mapbox migration for complexes...');

    // Step 1: Add Mapbox-specific columns to complexes table
    console.log('📍 Adding Mapbox geocoding columns...');
    await db.execute(sql`
      ALTER TABLE complexes 
      ADD COLUMN IF NOT EXISTS mapbox_place_id TEXT,
      ADD COLUMN IF NOT EXISTS mapbox_feature_type TEXT,
      ADD COLUMN IF NOT EXISTS mapbox_relevance DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS mapbox_accuracy TEXT,
      ADD COLUMN IF NOT EXISTS global_complex_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS organization_id INTEGER,
      ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
      ADD COLUMN IF NOT EXISTS mapbox_context JSONB,
      ADD COLUMN IF NOT EXISTS address_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP
    `);

    // Step 2: Create index for faster lookups
    console.log('🔍 Creating performance indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_complexes_global_id 
      ON complexes(global_complex_id);
      
      CREATE INDEX IF NOT EXISTS idx_complexes_mapbox_place_id 
      ON complexes(mapbox_place_id);
      
      CREATE INDEX IF NOT EXISTS idx_complexes_organization 
      ON complexes(organization_id);
      
      CREATE INDEX IF NOT EXISTS idx_complexes_location 
      ON complexes(latitude, longitude);
    `);

    // Step 3: Create global complex registry table
    console.log('🌍 Creating global complex registry...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS global_complex_registry (
        id SERIAL PRIMARY KEY,
        global_complex_id TEXT UNIQUE NOT NULL,
        canonical_name TEXT NOT NULL,
        canonical_address TEXT NOT NULL,
        mapbox_place_id TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        country TEXT NOT NULL,
        state_province TEXT,
        city TEXT,
        postal_code TEXT,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_source TEXT DEFAULT 'mapbox',
        usage_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 4: Create complex conflict resolution table
    console.log('⚠️ Creating conflict resolution tracking...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS complex_conflict_log (
        id SERIAL PRIMARY KEY,
        global_complex_id TEXT NOT NULL,
        organization_id INTEGER NOT NULL,
        local_complex_id INTEGER NOT NULL,
        conflict_type TEXT NOT NULL, -- 'scheduling', 'naming', 'location'
        conflict_details JSONB,
        resolved BOOLEAN DEFAULT FALSE,
        resolution_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    // Step 5: Generate global IDs for existing complexes
    console.log('🆔 Generating global IDs for existing complexes...');
    const existingComplexes = await db.execute(sql`
      SELECT id, name, address, city, state, country, latitude, longitude 
      FROM complexes 
      WHERE global_complex_id IS NULL
    `);

    for (const complex of existingComplexes) {
      // Generate a global ID based on location and address
      const globalId = await generateGlobalComplexId(complex);
      
      await db.execute(sql`
        UPDATE complexes 
        SET 
          global_complex_id = ${globalId},
          organization_id = 1,
          address_verified = FALSE
        WHERE id = ${complex.id}
      `);

      // Add to global registry
      await db.execute(sql`
        INSERT INTO global_complex_registry (
          global_complex_id, canonical_name, canonical_address,
          latitude, longitude, country, state_province, city
        ) VALUES (
          ${globalId}, 
          ${complex.name}, 
          ${complex.address},
          ${complex.latitude ? parseFloat(complex.latitude) : null},
          ${complex.longitude ? parseFloat(complex.longitude) : null},
          ${complex.country},
          ${complex.state},
          ${complex.city}
        )
        ON CONFLICT (global_complex_id) DO UPDATE SET
          usage_count = global_complex_registry.usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `);
    }

    // Step 6: Create Mapbox verification function
    console.log('✅ Creating Mapbox verification utilities...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION verify_complex_with_mapbox(
        complex_id INTEGER,
        mapbox_place_id TEXT,
        mapbox_feature_type TEXT,
        mapbox_relevance DECIMAL,
        mapbox_context JSONB
      )
      RETURNS BOOLEAN AS $$
      BEGIN
        UPDATE complexes 
        SET 
          mapbox_place_id = verify_complex_with_mapbox.mapbox_place_id,
          mapbox_feature_type = verify_complex_with_mapbox.mapbox_feature_type,
          mapbox_relevance = verify_complex_with_mapbox.mapbox_relevance,
          mapbox_context = verify_complex_with_mapbox.mapbox_context,
          address_verified = TRUE,
          last_verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = verify_complex_with_mapbox.complex_id;
        
        RETURN FOUND;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Step 7: Create conflict detection function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION detect_complex_conflicts(
        new_global_id TEXT,
        org_id INTEGER
      )
      RETURNS TABLE(
        conflict_type TEXT,
        existing_complex_id INTEGER,
        existing_org_id INTEGER,
        similarity_score DECIMAL
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          'location'::TEXT as conflict_type,
          c.id as existing_complex_id,
          c.organization_id as existing_org_id,
          1.0::DECIMAL as similarity_score
        FROM complexes c
        WHERE c.global_complex_id = new_global_id 
          AND c.organization_id != org_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Mapbox migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Added Mapbox geocoding columns to complexes table`);
    console.log(`   - Created global complex registry for conflict prevention`);
    console.log(`   - Generated global IDs for ${existingComplexes.length} existing complexes`);
    console.log(`   - Created conflict detection and resolution system`);
    console.log(`   - Added performance indexes for faster lookups`);

  } catch (error) {
    console.error('❌ Error during Mapbox migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Generate a unique global ID for a complex based on its location and characteristics
 */
async function generateGlobalComplexId(complex) {
  const { name, address, city, state, country, latitude, longitude } = complex;
  
  // Create a hash-like identifier from key location data
  const locationString = `${latitude || '0'}_${longitude || '0'}_${city}_${state}_${country}`.toLowerCase();
  const cleanLocationString = locationString.replace(/[^a-z0-9_]/g, '');
  
  // Add name component for uniqueness
  const nameComponent = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Create global ID with format: {country}_{state}_{city}_{name_hash}_{location_hash}
  const globalId = `${country.toLowerCase()}_${state.toLowerCase()}_${city.toLowerCase()}_${nameComponent.substring(0, 10)}_${cleanLocationString.substring(0, 20)}`;
  
  return globalId;
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateComplexesToMapbox().catch(console.error);
}

export { migrateComplexesToMapbox };