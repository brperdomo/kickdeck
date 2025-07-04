import { Router, Request, Response, NextFunction } from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund, processTeamPaymentAfterSetup, generatePaymentCompletionUrl, deleteTeam, bulkApproveTeams, bulkRejectTeams } from './teams';
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

// Delete team registration (only for teams in 'registered' status)
router.delete('/:teamId', extractEventIdFromTeam, hasEventAccess, deleteTeam);

// Bulk approve multiple teams
router.post('/bulk-approve', bulkApproveTeams);

// Bulk reject multiple teams
router.post('/bulk-reject', bulkRejectTeams);

export default router;