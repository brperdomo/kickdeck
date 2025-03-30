import { Router } from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund } from './teams';
import { db } from '@db';
import { eventFees } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';

const router = Router();

// Get all teams with filtering
router.get('/', getTeams);

// Get team by ID
router.get('/:teamId', getTeamById);

// Get fee details for a team
router.get('/:teamId/fees', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { selectedFeeIds } = req.query;
    
    if (!selectedFeeIds) {
      return res.status(400).json({ message: "No fee IDs provided" });
    }
    
    const feeIds = (selectedFeeIds as string).split(',').map(id => parseInt(id.trim()));
    
    const fees = await db.select({
      id: eventFees.id,
      name: eventFees.name,
      amount: eventFees.amount,
      feeType: eventFees.feeType,
      isRequired: eventFees.isRequired
    })
    .from(eventFees)
    .where(inArray(eventFees.id, feeIds));
    
    res.json(fees);
  } catch (error) {
    console.error("Error fetching team fee details:", error);
    res.status(500).json({ 
      message: "Failed to fetch team fee details", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Update team status (approve/reject)
router.put('/:teamId/status', updateTeamStatus);
// Keep backward compatibility with PATCH as well
router.patch('/:teamId/status', updateTeamStatus);

// Process refund for rejected team
router.post('/:teamId/refund', processRefund);

export default router;