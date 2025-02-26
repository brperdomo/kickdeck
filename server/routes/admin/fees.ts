import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { eventFees } from "@db/schema";
import { authenticateAdmin } from "../../middleware/auth";

const router = Router();

// Get all fees for an event
router.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Fetching fees for event:', eventId);

    if (!eventId) {
      console.error('Invalid event ID:', eventId);
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, BigInt(eventId)),
      orderBy: (eventFees) => [eventFees.createdAt],
    });

    console.log(`Found ${fees.length} fees for event ${eventId}`);

    res.json(fees);
  } catch (error) {
    console.error("Error fetching event fees:", error);
    res.status(500).json({ 
      message: "Failed to fetch event fees", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Create a new fee
router.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Creating fee for event:', eventId, 'with data:', req.body);

    if (!eventId) {
      console.error('Invalid event ID for fee creation:', eventId);
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const newFee = await db.insert(eventFees).values({
      ...req.body,
      eventId: BigInt(eventId),
      beginDate: req.body.beginDate ? new Date(req.body.beginDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('Created new fee:', newFee[0]);
    res.status(201).json(newFee[0]);
  } catch (error) {
    console.error("Error creating event fee:", error);
    res.status(500).json({ 
      message: "Failed to create event fee", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Update an existing fee
router.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log('Updating fee:', feeId, 'for event:', eventId, 'with data:', req.body);

    const updatedFee = await db
      .update(eventFees)
      .set({
        ...req.body,
        eventId: BigInt(eventId),
        beginDate: req.body.beginDate ? new Date(req.body.beginDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    console.log('Updated fee:', updatedFee[0]);
    res.json(updatedFee[0]);
  } catch (error) {
    console.error("Error updating event fee:", error);
    res.status(500).json({ 
      message: "Failed to update event fee", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Delete a fee
router.delete("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log('Deleting fee:', feeId, 'from event:', eventId);

    const deletedFee = await db
      .delete(eventFees)
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    console.log('Deleted fee:', deletedFee[0]);
    res.json(deletedFee[0]);
  } catch (error) {
    console.error("Error deleting event fee:", error);
    res.status(500).json({ 
      message: "Failed to delete event fee", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;