import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { eventFees, insertEventFeeSchema } from "@db/schema";
import { authenticateAdmin } from "../../middleware/auth";

const router = Router();

router.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, parseInt(eventId)),
      orderBy: (eventFees) => [eventFees.createdAt],
    });
    res.setHeader('Content-Type', 'application/json');
    res.json(fees);
  } catch (error) {
    console.error("Error fetching event fees:", error);
    res.status(500).json({ error: "Failed to fetch fees" });
  }
});

router.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const feeData = insertEventFeeSchema.parse({
      ...req.body,
      eventId: parseInt(eventId),
    });
    const fee = await db.insert(eventFees).values(feeData).returning();
    res.json(fee[0]);
  } catch (error) {
    console.error("Error creating fee:", error);
    res.status(500).json({ error: "Failed to create fee" });
  }
});

router.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { feeId } = req.params;
    const feeData = insertEventFeeSchema.parse(req.body);
    const fee = await db
      .update(eventFees)
      .set(feeData)
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();
    res.json(fee[0]);
  } catch (error) {
    console.error("Error updating fee:", error);
    res.status(500).json({ error: "Failed to update fee" });
  }
});

export default router;