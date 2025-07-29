#!/usr/bin/env node

/**
 * Check Age Groups Configuration Status
 * 
 * This script analyzes your tournament to show:
 * 1. How many age groups you've configured (4)
 * 2. How many your teams actually need
 * 3. Exactly what you need to add to proceed
 */

import { db } from './db/index.js';
import { eventAgeGroups, teams } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function checkAgeGroupStatus() {
  try {
    console.log('🔍 ANALYZING YOUR TOURNAMENT AGE GROUP REQUIREMENTS...');
    console.log('=' .repeat(60));
    
    const eventId = '1656618593'; // Your current tournament
    
    // Get your configured age groups
    const configuredAgeGroups = await db.select({
      name: eventAgeGroups.name,
      gender: eventAgeGroups.gender,
      format: eventAgeGroups.format
    }).from(eventAgeGroups).where(eq(eventAgeGroups.eventId, parseInt(eventId)));
    
    // Get your actual registered teams
    const registeredTeams = await db.select({
      name: teams.name,
      ageGroup: teams.ageGroup,
      gender: teams.gender
    }).from(teams).where(eq(teams.eventId, parseInt(eventId)));
    
    // Calculate unique age/gender combinations from teams
    const actualAgeGroups = [...new Set(registeredTeams.map(team => {
      const gender = team.gender || 'Mixed';
      return `${team.ageGroup} ${gender}`;
    }))].sort();
    
    // Calculate what's missing
    const configuredList = configuredAgeGroups.map(ag => `${ag.name} ${ag.gender}`);
    const missingAgeGroups = actualAgeGroups.filter(actual => 
      !configuredList.includes(actual)
    );
    
    console.log('\n📊 YOUR CURRENT STATUS:');
    console.log(`✅ Age Groups Configured: ${configuredAgeGroups.length}`);
    configuredAgeGroups.forEach(ag => {
      console.log(`   • ${ag.name} ${ag.gender} (${ag.format})`);
    });
    
    console.log(`\n👥 Age Groups Needed (from ${registeredTeams.length} teams): ${actualAgeGroups.length}`);
    actualAgeGroups.forEach(ag => {
      const teamCount = registeredTeams.filter(team => {
        const teamAgeGender = `${team.ageGroup} ${team.gender || 'Mixed'}`;
        return teamAgeGender === ag;
      }).length;
      console.log(`   • ${ag} (${teamCount} teams)`);
    });
    
    console.log('\n🎯 WHAT YOU NEED TO DO:');
    if (missingAgeGroups.length === 0) {
      console.log('✨ PERFECT! You have configured all required age groups.');
      console.log('🚀 You can now proceed to the next step in the tournament system.');
    } else {
      console.log(`⚠️  You need to configure ${missingAgeGroups.length} more age groups:`);
      missingAgeGroups.forEach((missing, index) => {
        console.log(`   ${index + 1}. ${missing}`);
      });
      console.log('\n📝 TO ADD THESE:');
      console.log('1. Click "Add Age Group" button in the Age Groups tab');
      console.log('2. Fill in the name and format for each missing age group');
      console.log('3. Save your configuration');
    }
    
    console.log('\n📈 PROGRESS:');
    const progress = Math.round((configuredAgeGroups.length / actualAgeGroups.length) * 100);
    console.log(`${progress}% Complete (${configuredAgeGroups.length}/${actualAgeGroups.length})`);
    
    if (progress < 100) {
      console.log(`\n🔄 You need ${actualAgeGroups.length - configuredAgeGroups.length} more age group${actualAgeGroups.length - configuredAgeGroups.length === 1 ? '' : 's'} to proceed.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking age groups:', error.message);
    process.exit(1);
  }
}

checkAgeGroupStatus();