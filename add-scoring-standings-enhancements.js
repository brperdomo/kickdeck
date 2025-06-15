/**
 * Add Scoring and Standings Enhancements
 * 
 * This script adds comprehensive scoring system enhancements and team standings
 * tracking to support both Three-Point and Ten-Point scoring systems with
 * configurable tiebreakers.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;

async function addScoringStandingsEnhancements() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add new columns to event_scoring_rules table
    console.log('Adding new columns to event_scoring_rules table...');
    
    // Add system_type column
    try {
      await client.query(`
        ALTER TABLE event_scoring_rules 
        ADD COLUMN IF NOT EXISTS system_type TEXT NOT NULL DEFAULT 'three_point'
      `);
      console.log('✓ Added system_type column');
    } catch (error) {
      console.log('system_type column already exists or error:', error.message);
    }

    // Add goal_scored column
    try {
      await client.query(`
        ALTER TABLE event_scoring_rules 
        ADD COLUMN IF NOT EXISTS goal_scored INTEGER NOT NULL DEFAULT 0
      `);
      console.log('✓ Added goal_scored column');
    } catch (error) {
      console.log('goal_scored column already exists or error:', error.message);
    }

    // Add goal_cap column
    try {
      await client.query(`
        ALTER TABLE event_scoring_rules 
        ADD COLUMN IF NOT EXISTS goal_cap INTEGER NOT NULL DEFAULT 3
      `);
      console.log('✓ Added goal_cap column');
    } catch (error) {
      console.log('goal_cap column already exists or error:', error.message);
    }

    // Add yellow_card column
    try {
      await client.query(`
        ALTER TABLE event_scoring_rules 
        ADD COLUMN IF NOT EXISTS yellow_card INTEGER NOT NULL DEFAULT 0
      `);
      console.log('✓ Added yellow_card column');
    } catch (error) {
      console.log('yellow_card column already exists or error:', error.message);
    }

    // Add tiebreaker columns
    const tiebreakerColumns = [
      'tiebreaker_1', 'tiebreaker_2', 'tiebreaker_3', 'tiebreaker_4',
      'tiebreaker_5', 'tiebreaker_6', 'tiebreaker_7', 'tiebreaker_8'
    ];
    
    const defaultTiebreakers = [
      'total_points', 'head_to_head', 'goal_differential', 'goals_scored',
      'goals_allowed', 'shutouts', 'fair_play', 'coin_toss'
    ];

    for (let i = 0; i < tiebreakerColumns.length; i++) {
      try {
        await client.query(`
          ALTER TABLE event_scoring_rules 
          ADD COLUMN IF NOT EXISTS ${tiebreakerColumns[i]} TEXT NOT NULL DEFAULT '${defaultTiebreakers[i]}'
        `);
        console.log(`✓ Added ${tiebreakerColumns[i]} column`);
      } catch (error) {
        console.log(`${tiebreakerColumns[i]} column already exists or error:`, error.message);
      }
    }

    // Add is_active column
    try {
      await client.query(`
        ALTER TABLE event_scoring_rules 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('✓ Added is_active column');
    } catch (error) {
      console.log('is_active column already exists or error:', error.message);
    }

    // Add card statistics to games table
    console.log('Adding card statistics to games table...');
    
    const cardColumns = [
      'home_yellow_cards', 'away_yellow_cards', 'home_red_cards', 'away_red_cards'
    ];

    for (const column of cardColumns) {
      try {
        await client.query(`
          ALTER TABLE games 
          ADD COLUMN IF NOT EXISTS ${column} INTEGER NOT NULL DEFAULT 0
        `);
        console.log(`✓ Added ${column} column`);
      } catch (error) {
        console.log(`${column} column already exists or error:`, error.message);
      }
    }

    // Create team_standings table
    console.log('Creating team_standings table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS team_standings (
          id SERIAL PRIMARY KEY,
          event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          age_group_id INTEGER NOT NULL REFERENCES event_age_groups(id),
          bracket_id INTEGER REFERENCES event_brackets(id),
          team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          -- Game statistics
          games_played INTEGER NOT NULL DEFAULT 0,
          wins INTEGER NOT NULL DEFAULT 0,
          losses INTEGER NOT NULL DEFAULT 0,
          ties INTEGER NOT NULL DEFAULT 0,
          -- Goal statistics
          goals_scored INTEGER NOT NULL DEFAULT 0,
          goals_allowed INTEGER NOT NULL DEFAULT 0,
          goal_differential INTEGER NOT NULL DEFAULT 0,
          shutouts INTEGER NOT NULL DEFAULT 0,
          -- Card statistics
          yellow_cards INTEGER NOT NULL DEFAULT 0,
          red_cards INTEGER NOT NULL DEFAULT 0,
          fair_play_points INTEGER NOT NULL DEFAULT 0,
          -- Point calculations
          total_points INTEGER NOT NULL DEFAULT 0,
          win_points INTEGER NOT NULL DEFAULT 0,
          tie_points INTEGER NOT NULL DEFAULT 0,
          goal_points INTEGER NOT NULL DEFAULT 0,
          shutout_points INTEGER NOT NULL DEFAULT 0,
          card_penalty_points INTEGER NOT NULL DEFAULT 0,
          -- Standings position
          position INTEGER,
          last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
        )
      `);
      console.log('✓ Created team_standings table');
    } catch (error) {
      console.log('team_standings table already exists or error:', error.message);
    }

    // Create default scoring rules for existing events
    console.log('Creating default scoring rules for existing events...');
    
    const existingEvents = await client.query('SELECT id FROM events WHERE id NOT IN (SELECT DISTINCT event_id FROM event_scoring_rules)');
    
    for (const event of existingEvents.rows) {
      try {
        // Create Three-Point System rule
        await client.query(`
          INSERT INTO event_scoring_rules (
            event_id, title, system_type, win, loss, tie, shutout, goal_scored, goal_cap, red_card, yellow_card
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          event.id,
          'Three-Point System (Standard)',
          'three_point',
          3, // win
          0, // loss
          1, // tie
          0, // shutout
          0, // goal_scored
          3, // goal_cap
          0, // red_card
          0  // yellow_card
        ]);

        // Create Ten-Point System rule
        await client.query(`
          INSERT INTO event_scoring_rules (
            event_id, title, system_type, win, loss, tie, shutout, goal_scored, goal_cap, red_card, yellow_card, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          event.id,
          'Ten-Point System (Performance-Based)',
          'ten_point',
          6, // win
          0, // loss
          3, // tie
          1, // shutout
          1, // goal_scored
          3, // goal_cap
          -1, // red_card
          0,  // yellow_card
          false // is_active (default to Three-Point)
        ]);

        console.log(`✓ Created default scoring rules for event ${event.id}`);
      } catch (error) {
        console.log(`Error creating scoring rules for event ${event.id}:`, error.message);
      }
    }

    console.log('✅ Scoring and standings enhancements added successfully');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  addScoringStandingsEnhancements()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addScoringStandingsEnhancements };