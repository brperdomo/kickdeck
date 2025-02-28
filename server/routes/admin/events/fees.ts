
import express from "express";
import { db } from "@db";
import { eventFees, eventAgeGroupFees, accountingCodes } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../../../middleware/auth";

const router = express.Router({ mergeParams: true });

// Get all fees for an event
router.get("/", requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    const fees = await db
      .select()
      .from(eventFees)
      .where(eq(eventFees.eventId, eventId));
    
    res.json(fees);
  } catch (error) {
    console.error("Error fetching event fees:", error);
    res.status(500).json({ 
      error: "Failed to fetch event fees",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounting codes
router.get("/accounting-codes", requireAdmin, async (_req, res) => {
  try {
    const codes = await db.select().from(accountingCodes);
    res.json(codes);
  } catch (error) {
    console.error("Error fetching accounting codes:", error);
    res.status(500).json({ 
      error: "Failed to fetch accounting codes",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all fee assignments for an event
router.get("/assignments", requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    const assignments = await db
      .select({
        feeId: eventAgeGroupFees.feeId,
        ageGroupId: eventAgeGroupFees.ageGroupId,
      })
      .from(eventAgeGroupFees)
      .innerJoin(eventFees, eq(eventAgeGroupFees.feeId, eventFees.id))
      .where(eq(eventFees.eventId, eventId));
    
    // Format assignments as required by the frontend
    const formattedAssignments: Record<number, string[]> = {};
    
    assignments.forEach(assignment => {
      if (!formattedAssignments[assignment.feeId]) {
        formattedAssignments[assignment.feeId] = [];
      }
      formattedAssignments[assignment.feeId].push(assignment.ageGroupId);
    });
    
    res.json(formattedAssignments);
  } catch (error) {
    console.error("Error fetching fee assignments:", error);
    res.status(500).json({ 
      error: "Failed to fetch fee assignments",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update fee assignments
router.post("/assignments", requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const assignments = req.body as Record<number, string[]>;
    
    // Begin transaction
    await db.transaction(async (tx) => {
      // Get all fees for this event
      const fees = await tx
        .select({ id: eventFees.id })
        .from(eventFees)
        .where(eq(eventFees.eventId, eventId));
      
      const feeIds = fees.map(f => f.id);
      
      // Delete all existing assignments for these fees
      if (feeIds.length > 0) {
        await tx
          .delete(eventAgeGroupFees)
          .where(
            eventAgeGroupFees.feeId.in(feeIds)
          );
      }
      
      // Create new assignments
      for (const [feeId, ageGroupIds] of Object.entries(assignments)) {
        const numericFeeId = parseInt(feeId, 10);
        
        // Skip if fee doesn't belong to this event
        if (!feeIds.includes(numericFeeId)) continue;
        
        for (const groupId of ageGroupIds) {
          await tx
            .insert(eventAgeGroupFees)
            .values({
              ageGroupId: groupId,
              feeId: numericFeeId,
              createdAt: new Date().toISOString(),
            });
        }
      }
    });
    
    res.json({ message: "Fee assignments updated successfully" });
  } catch (error) {
    console.error("Error updating fee assignments:", error);
    res.status(500).json({
      error: "Failed to update fee assignments",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
