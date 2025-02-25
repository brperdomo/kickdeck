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
    if (!eventId) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("Fetching fees for event ID:", eventId, "Type:", typeof eventId);

    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, parseInt(eventId)),
    });

    console.log("Found fees:", fees.length, "fees for event", eventId);
    console.log("Fee details:", fees);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Type', 'application/json');
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
    const parsedEventId = parseInt(eventId);

    const validatedData = insertEventFeeSchema.parse({
      ...req.body,
      eventId: parsedEventId,
    });

    const newFee = await db.insert(eventFees).values({
      ...validatedData,
      eventId: parsedEventId,
      beginDate: validatedData.beginDate ? new Date(validatedData.beginDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.status(201).json(newFee[0]);
  } catch (error: any) {
    console.error("Error creating event fee:", error);
    if (error.errors) {
      // Zod validation error
      res.status(400).json({ message: error.errors[0].message });
    } else {
      res.status(500).json({ message: error.message || "Failed to create event fee" });
    }
  }
});

// Update a fee
router.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    const parsedEventId = parseInt(eventId);

    const validatedData = insertEventFeeSchema.parse({
      ...req.body,
      eventId: parsedEventId,
    });

    const updatedFee = await db
      .update(eventFees)
      .set({
        ...validatedData,
        eventId: parsedEventId,
        beginDate: validatedData.beginDate ? new Date(validatedData.beginDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    if (updatedFee.length === 0) {
      return res.status(404).json({ message: "Fee not found" });
    }

    res.json(updatedFee[0]);
  } catch (error: any) {
    console.error("Error updating event fee:", error);
    res.status(500).json({ message: error.message || "Failed to update event fee" });
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
  } catch (error: any) {
    console.error("Error deleting event fee:", error);
    res.status(500).json({ message: error.message || "Failed to delete event fee" });
  }
});

export default router;