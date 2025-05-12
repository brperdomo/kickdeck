/**
 * Team API routes for retrieving team information
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { eq, and, or, sql } from 'drizzle-orm';
import { teams, events, age_groups } from '@db/schema';

/**
 * Get teams associated with the current authenticated user as coach or manager
 * Used in the "My Teams" component in the member dashboard
 */
export async function getMyTeams(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userEmail = req.user.email;
  
  try {
    // Query for teams where user is either a coach or manager
    const myTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        eventId: teams.event_id,
        eventName: events.name,
        ageGroup: age_groups.age_group,
        status: teams.status,
        createdAt: teams.created_at,
        startDate: events.start_date,
      })
      .from(teams)
      .leftJoin(events, eq(teams.event_id, events.id))
      .leftJoin(age_groups, eq(teams.age_group_id, age_groups.id))
      .where(
        or(
          // Raw SQL with CAST needed because coach data is stored as JSON
          sql`CAST(${teams.head_coach}->>'email' AS TEXT) = ${userEmail}`,
          eq(teams.manager_email, userEmail)
        )
      )
      .orderBy(teams.created_at);

    // Add a role field to each team to indicate if the user is a coach or manager
    const teamsWithRole = await Promise.all(myTeams.map(async (team) => {
      try {
        // Fetch the team details to check coach email
        const teamDetails = await db
          .select({
            headCoach: teams.head_coach,
            managerEmail: teams.manager_email
          })
          .from(teams)
          .where(eq(teams.id, team.id))
          .limit(1);

        // Get the head coach data - typically stored as a JSON object with email, name, etc.
        const headCoachData = teamDetails[0]?.headCoach;
        const headCoachEmail = headCoachData ? headCoachData.email : null;

        // Determine role based on email matches
        let role = 'manager'; // Default
        if (headCoachEmail === userEmail) {
          role = 'coach';
        }
        
        return {
          ...team,
          role
        };
      } catch (error) {
        console.error(`Error determining role for team ${team.id}:`, error);
        return {
          ...team,
          role: 'unknown' // Fallback
        };
      }
    }));
    
    return res.status(200).json(teamsWithRole);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
}