import { Router } from 'express';
import { db } from '../../../db/index.js';
import { teams, eventBrackets } from '../../../db/schema.js';
import { eq, isNotNull, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

// GET /api/admin/manager-reports/:eventId/csv - Export team and coaching staff data as CSV
router.get('/:eventId/csv', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Manager Reports] Generating CSV export for event ${eventId}`);

    // Fetch teams with their flight information
    const teamsData = await db
      .select({
        teamName: teams.name,
        coachData: teams.coach, // Full JSON object with coach info
        submitterEmail: teams.submitterEmail,
        managerName: teams.managerName,
        managerEmail: teams.managerEmail,
        managerPhone: teams.managerPhone,
        flightName: eventBrackets.name,
        flightLevel: eventBrackets.level,
      })
      .from(teams)
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(
        and(
          eq(teams.eventId, eventId.toString()),
          eq(teams.status, 'approved') // Only include approved teams
        )
      )
      .orderBy(teams.name);

    console.log(`[Manager Reports] Found ${teamsData.length} approved teams for export`);

    // Helper function to parse coach data
    const parseCoachData = (coachData: string | null) => {
      if (!coachData) return { name: '', email: '', phone: '' };
      
      try {
        const coach = JSON.parse(coachData);
        return {
          name: coach.headCoachName || '',
          email: coach.headCoachEmail || '',
          phone: coach.headCoachPhone || ''
        };
      } catch (e) {
        console.error('[Manager Reports] Error parsing coach data:', e);
        return { name: '', email: '', phone: '' };
      }
    };

    // Create CSV headers
    const headers = [
      'Team Name',
      'Coach Name', 
      'Coach Email',
      'Coach Phone',
      'Manager Name',
      'Manager Email', 
      'Manager Phone',
      'Level of Play Desired (Flight)'
    ];

    // Create CSV rows with proper field mapping
    const csvRows = teamsData.map(team => {
      const coach = parseCoachData(team.coachData);
      
      return [
        team.teamName || '',
        coach.name,
        coach.email,
        coach.phone,
        team.managerName || '',
        team.managerEmail || '',
        team.managerPhone || '',
        team.flightName || team.flightLevel || ''
      ];
    });

    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => 
        row.map(field => `"${field.toString().replace(/"/g, '""')}"`) // Escape quotes and wrap in quotes
        .join(',')
      )
    ].join('\n');

    // Set response headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `manager-reports-event-${eventId}-${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log(`[Manager Reports] ✅ CSV export completed: ${filename} with ${csvRows.length} teams`);
    
    res.send(csvContent);

  } catch (error) {
    console.error('[Manager Reports] Error generating CSV export:', error);
    res.status(500).json({ 
      error: 'Failed to generate manager reports CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;