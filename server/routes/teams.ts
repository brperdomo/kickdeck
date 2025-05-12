/**
 * Team API routes for retrieving team information
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { teams, users } from '@db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

/**
 * Get teams associated with the current authenticated user as coach or manager
 * Used in the "My Teams" component in the member dashboard
 */
export async function getMyTeams(req: Request, res: Response) {
  try {
    // User must be authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'You must be logged in to view your teams' });
    }
    
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }
    
    // Query teams where the user is either the coach or manager
    const myTeams = await db.query.teams.findMany({
      where: or(
        // Check if user is coach (coach data is stored in JSON)
        sql`(coach->>'email')::text = ${userEmail}`,
        // Check if user is manager
        eq(teams.managerEmail, userEmail)
      ),
      with: {
        event: {
          columns: {
            id: true,
            name: true,
            startDate: true
          }
        },
        ageGroup: {
          columns: {
            id: true,
            ageGroup: true
          }
        }
      }
    });
    
    // Format the teams for the response
    const formattedTeams = myTeams.map(team => {
      // Parse the coach data from JSON
      const coach = team.coach ? 
        (typeof team.coach === 'string' ? JSON.parse(team.coach) : team.coach) 
        : null;
      
      // Determine the user's role on this team
      const role = coach?.email === userEmail ? 'coach' : 'manager';
      
      return {
        id: team.id,
        name: team.name,
        eventId: team.eventId,
        eventName: team.event.name,
        ageGroup: team.ageGroup.ageGroup,
        status: team.status,
        createdAt: team.createdAt,
        startDate: team.event.startDate,
        role
      };
    });
    
    return res.json(formattedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch teams',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}