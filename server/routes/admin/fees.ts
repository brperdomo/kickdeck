import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { eventFees, insertEventFeeSchema } from "@db/schema";
import { authenticateAdmin } from "../../middleware/auth";

const router = Router();

// Get all fees for an event
router.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, parseInt(eventId)),
      orderBy: (eventFees) => [eventFees.createdAt],
    });
    res.json(fees);
  } catch (error) {
    console.error("Error fetching event fees:", error);
    res.status(500).json({ message: "Failed to fetch event fees" });
  }
});

// Create a new fee
router.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = insertEventFeeSchema.parse({
      ...req.body,
      eventId: parseInt(eventId),
    });

    const newFee = await db.insert(eventFees).values({
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.status(201).json(newFee[0]);
  } catch (error) {
    console.error("Error creating event fee:", error);
    res.status(500).json({ message: "Failed to create event fee" });
  }
});

// Update a fee
router.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    const validatedData = insertEventFeeSchema.parse({
      ...req.body,
      eventId: parseInt(eventId),
    });

    const updatedFee = await db
      .update(eventFees)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    if (updatedFee.length === 0) {
      return res.status(404).json({ message: "Fee not found" });
    }

    res.json(updatedFee[0]);
  } catch (error) {
    console.error("Error updating event fee:", error);
    res.status(500).json({ message: "Failed to update event fee" });
  }
});

// Delete a fee
router.delete("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    const deletedFee = await db
      .delete(eventFees)
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    if (deletedFee.length === 0) {
      return res.status(404).json({ message: "Fee not found" });
    }

    res.json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("Error deleting event fee:", error);
    res.status(500).json({ message: "Failed to delete event fee" });
  }
});

export default router;
