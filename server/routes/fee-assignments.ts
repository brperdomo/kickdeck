
import { Request, Response } from 'express';
import { db } from '@db';
import { eventAgeGroupFees, eventFees, eventAgeGroups } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Get fee assignments for an event
export const getFeeAssignments = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    // Get all age groups for this event
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId),
    });

    // Get all fees for this event
    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, eventId),
    });

    // Get all fee assignments
    const allAgeGroupIds = ageGroups.map(group => group.id);
    const allFeeIds = fees.map(fee => fee.id);
    
    // Only attempt to query if we have age groups and fees
    let assignments = [];
    
    if (allAgeGroupIds.length > 0 && allFeeIds.length > 0) {
      try {
        assignments = await db.query.eventAgeGroupFees.findMany({
          where: and(
            inArray(eventAgeGroupFees.ageGroupId, allAgeGroupIds),
            inArray(eventAgeGroupFees.feeId, allFeeIds)
          ),
        });
        console.log(`Found ${assignments.length} fee assignments for event ${eventId}`);
      } catch (dbError) {
        console.error('Database error when fetching assignments:', dbError);
        assignments = []; // Ensure we have an empty array to return
      }
    }
    
    // Make sure we return an array for clients
    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching fee assignments:', error);
    return res.status(500).json({ error: 'Failed to fetch fee assignments' });
  }
};

// Update fee assignments for a specific fee
export const updateFeeAssignments = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { feeId, ageGroupIds } = req.body;

  console.log('Updating fee assignments:', { eventId, feeId, ageGroupIds });

  if (!feeId || !Array.isArray(ageGroupIds)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Get all age groups for this event to validate the input
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId),
    });
    
    const allAgeGroupIds = ageGroups.map(group => group.id);
    console.log('Valid age group IDs for this event:', allAgeGroupIds);
    
    // Validate that the fee belongs to this event
    const fee = await db.query.eventFees.findFirst({
      where: and(
        eq(eventFees.id, feeId),
        eq(eventFees.eventId, eventId)
      ),
    });
    
    if (!fee) {
      console.error('Fee not found or does not belong to this event');
      return res.status(404).json({ error: 'Fee not found for this event' });
    }
    
    // Filter out invalid age group IDs
    const validAgeGroupIds = ageGroupIds.filter(id => allAgeGroupIds.includes(id));
    console.log('Valid age group IDs to assign:', validAgeGroupIds);
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete existing assignments for this fee
      await tx
        .delete(eventAgeGroupFees)
        .where(eq(eventAgeGroupFees.feeId, feeId));
      
      // Create new assignments
      if (validAgeGroupIds.length > 0) {
        for (const ageGroupId of validAgeGroupIds) {
          await tx.insert(eventAgeGroupFees).values({
            ageGroupId,
            feeId,
          });
        }
        console.log(`Created ${validAgeGroupIds.length} new fee assignments`);
      } else {
        console.log('No valid age groups to assign');
      }
    });

    // Query the updated assignments to return to client
const updatedAssignments = await db.query.eventAgeGroupFees.findMany({
  where: eq(eventAgeGroupFees.feeId, feeId)
});

return res.status(200).json(updatedAssignments);
  } catch (error) {
    console.error('Error updating fee assignments:', error);
    return res.status(500).json({ 
      error: 'Failed to update fee assignments', 
      message: error.message
    });
  }
};
