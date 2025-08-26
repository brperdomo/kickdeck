import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { teams, events, eventAgeGroups } from './db/schema.ts';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

async function exportFinancialData() {
  try {
    const approvedTeams = await db
      .select({
        teamName: teams.name,
        clubName: teams.clubName,
        submitterName: teams.submitterName,
        submitterEmail: teams.submitterEmail,
        managerName: teams.managerName,
        managerEmail: teams.managerEmail,
        registrationFee: teams.registrationFee,
        totalAmount: teams.totalAmount,
        paymentStatus: teams.paymentStatus,
        paymentDate: teams.paymentDate,
        cardBrand: teams.cardBrand,
        cardLast4: teams.cardLast4,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(eq(teams.status, 'approved'), eq(teams.eventId, 1825427780)))
      .orderBy(teams.name);

    console.log(`Found ${approvedTeams.length} approved teams`);

    // Format for CSV
    const csvRows = [
      'Team Name,Club,Submitter Name,Submitter Email,Manager Name,Manager Email,Registration Fee,Total Amount,Payment Status,Payment Date,Card Brand,Card Last 4,Event,Age Group'
    ];

    approvedTeams.forEach(team => {
      const formatValue = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const row = [
        formatValue(team.teamName),
        formatValue(team.clubName),
        formatValue(team.submitterName),
        formatValue(team.submitterEmail),
        formatValue(team.managerName),
        formatValue(team.managerEmail),
        formatValue(team.registrationFee || 0),
        formatValue(team.totalAmount || 0),
        formatValue(team.paymentStatus || 'pending'),
        formatValue(team.paymentDate),
        formatValue(team.cardBrand),
        formatValue(team.cardLast4),
        formatValue(team.eventName),
        formatValue(`${team.ageGroup} ${team.gender}`)
      ].join(',');

      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');
    fs.writeFileSync('rise_cup_complete_export.csv', csvContent);
    console.log(`Export complete! ${approvedTeams.length} teams exported to rise_cup_complete_export.csv`);
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await pool.end();
  }
}

exportFinancialData();