import { Router, Request, Response, NextFunction } from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund, processTeamPaymentAfterSetup, generatePaymentCompletionUrl, deleteTeam, generatePaymentIntentCompletionUrl } from './teams';
import { db } from '@db';
import { eventFees, teams } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';
import { hasEventAccess } from '../../middleware/event-access';

// Middleware to extract eventId from team and add it to request params
// This allows hasEventAccess middleware to work with team routes
const extractEventIdFromTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    // Get the team's eventId
    const teamResult = await db
      .select({ eventId: teams.eventId })
      .from(teams)
      .where(eq(teams.id, parseInt(teamId)))
      .limit(1);
    
    if (teamResult.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Add eventId to request params so hasEventAccess can check it
    req.params.eventId = teamResult[0].eventId;
    next();
  } catch (error) {
    console.error('Error extracting eventId from team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const router = Router();

// Get all teams with filtering - no specific event check needed as filtering is handled in the controller
router.get('/', getTeams);

// Get team by ID - needs eventId extraction for permission check
router.get('/:teamId', extractEventIdFromTeam, hasEventAccess, getTeamById);

// Get fee details for a team - needs eventId extraction for permission check
router.get('/:teamId/fees', extractEventIdFromTeam, hasEventAccess, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { selectedFeeIds } = req.query;
    
    if (!selectedFeeIds) {
      return res.status(400).json({ message: "No fee IDs provided" });
    }
    
    // Get the team to access its selectedFeeIds
    const team = await db.select({
      selectedFeeIds: teams.selectedFeeIds
    })
    .from(teams)
    .where(eq(teams.id, parseInt(teamId)))
    .limit(1);
    
    // If no feeIds were provided in the query and we got them from the team, use those
    let feeIdString = selectedFeeIds as string;
    if ((!feeIdString || feeIdString === 'undefined') && team.length > 0 && team[0].selectedFeeIds) {
      feeIdString = team[0].selectedFeeIds;
    }
    
    // Split the comma-separated string and filter out any invalid values before parsing to int
    const feeIdsArray = feeIdString.split(',')
      .map(id => id.trim().replace(/[^0-9]/g, '')) // Remove any non-numeric characters
      .filter(id => id && !isNaN(parseInt(id)))    // Filter out empty or NaN values
      .map(id => parseInt(id));                    // Convert to integers
    
    // Check if we have any valid IDs after filtering
    if (feeIdsArray.length === 0) {
      return res.json([]);
    }
    
    // Convert the amount to a fixed precision to prevent displaying issues
    // This ensures that amounts are properly formatted for the client
    const fees = await db.select({
      id: eventFees.id,
      name: eventFees.name,
      amount: eventFees.amount,
      feeType: eventFees.feeType,
      isRequired: eventFees.isRequired
    })
    .from(eventFees)
    .where(inArray(eventFees.id, feeIdsArray))
    
    // Process fees to ensure correct amount format
    // Fees in the database are stored in cents, so we need to convert to dollars for display
    const processedFees = fees.map(fee => {
      // Make sure we have a valid number to start with
      let amountInCents = typeof fee.amount === 'number' ? fee.amount : 0;
      
      // Convert cents to dollars for display
      const amountInDollars = amountInCents / 100;
      
      // Apply toFixed to ensure consistent decimal places, then convert back to Number
      // This prevents JavaScript floating point issues
      const fixedAmount = Number(amountInDollars.toFixed(2));
      
      console.log(`Processing fee: id=${fee.id}, name=${fee.name}, original=${fee.amount} cents, converted=${fixedAmount} dollars`);
      
      return {
        ...fee,
        amount: fixedAmount
      };
    });
    
    console.log('Sending processed fees to client:', JSON.stringify(processedFees));
    res.json(processedFees);
  } catch (error) {
    console.error("Error fetching team fee details:", error);
    res.status(500).json({ 
      message: "Failed to fetch team fee details", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Update team details (general update)
router.patch('/:teamId', extractEventIdFromTeam, hasEventAccess, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updateData = req.body;
    
    console.log(`Updating team ${teamId} with data:`, updateData);
    
    // Build the update object dynamically
    const updateObject: any = {};
    
    if (updateData.name !== undefined) updateObject.name = updateData.name;
    if (updateData.managerName !== undefined) updateObject.managerName = updateData.managerName;
    if (updateData.managerPhone !== undefined) updateObject.managerPhone = updateData.managerPhone;
    if (updateData.managerEmail !== undefined) updateObject.managerEmail = updateData.managerEmail;
    if (updateData.clubName !== undefined) updateObject.clubName = updateData.clubName;
    if (updateData.ageGroupId !== undefined) updateObject.ageGroupId = updateData.ageGroupId;
    if (updateData.bracketId !== undefined) updateObject.bracketId = updateData.bracketId;
    
    // Handle silent status changes (no email notifications or payment processing)
    if (updateData.status !== undefined && updateData.skipEmail) {
      updateObject.status = updateData.status;
      console.log(`Silent status change for team ${teamId}: ${updateData.status} (skipEmail: ${updateData.skipEmail})`);
    }
    
    // Handle coach information
    if (updateData.coach !== undefined) {
      updateObject.headCoachName = updateData.coach.headCoachName;
      updateObject.headCoachEmail = updateData.coach.headCoachEmail;
      updateObject.headCoachPhone = updateData.coach.headCoachPhone;
      updateObject.assistantCoachName = updateData.coach.assistantCoachName;
      updateObject.assistantCoachEmail = updateData.coach.assistantCoachEmail;
      updateObject.assistantCoachPhone = updateData.coach.assistantCoachPhone;
    }
    
    console.log(`Final update object for team ${teamId}:`, updateObject);
    
    const result = await db.update(teams)
      .set(updateObject)
      .where(eq(teams.id, parseInt(teamId, 10)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`Team ${teamId} updated successfully:`, result[0]);
    res.json({ success: true, team: result[0] });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update team status (approve/reject)
router.put('/:teamId/status', extractEventIdFromTeam, hasEventAccess, updateTeamStatus);
// Keep backward compatibility with PATCH as well
router.patch('/:teamId/status', extractEventIdFromTeam, hasEventAccess, updateTeamStatus);

// Process refund for rejected team
router.post('/:teamId/refund', extractEventIdFromTeam, hasEventAccess, processRefund);

// Process payment after Setup Intent completion
router.post('/:teamId/process-payment', extractEventIdFromTeam, hasEventAccess, processTeamPaymentAfterSetup);

// Generate payment completion URL for teams with incomplete Setup Intents
router.post('/:teamId/generate-completion-url', extractEventIdFromTeam, hasEventAccess, generatePaymentCompletionUrl);

// Generate payment completion URL for teams with incomplete Payment Intents  
router.post('/:id/generate-payment-intent-completion-url', extractEventIdFromTeam, hasEventAccess, generatePaymentIntentCompletionUrl);

// Delete team registration (only for teams in 'registered' status)
router.delete('/:teamId', extractEventIdFromTeam, hasEventAccess, deleteTeam);

// Bulk operations commented out - functions not implemented
// router.post('/bulk-approve', bulkApproveTeams);
// router.post('/bulk-reject', bulkRejectTeams);

export default router;