
import { Router } from "express";
import { z } from "zod";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { eventFees } from "@db/schema";
import { authenticateAdmin } from "../../middleware/auth";

const router = Router();

const feeSchema = z.object({
  name: z.string(),
  amount: z.number(),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  applyToAll: z.boolean(),
  eventId: z.string()
});

router.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const fees = await db
      .select()
      .from(eventFees)
      .where(eq(eventFees.eventId, parseInt(eventId)));
    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ message: "Failed to fetch fees" });
  }
});

router.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const parsedFee = feeSchema.parse({
      ...req.body,
      eventId
    });

    const fee = await db
      .insert(eventFees)
      .values({
        name: parsedFee.name,
        amount: parsedFee.amount,
        beginDate: parsedFee.beginDate ? new Date(parsedFee.beginDate) : null,
        endDate: parsedFee.endDate ? new Date(parsedFee.endDate) : null,
        applyToAll: parsedFee.applyToAll,
        eventId: parseInt(eventId),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json(fee[0]);
  } catch (error) {
    console.error("Error creating fee:", error);
    res.status(500).json({ message: "Failed to create fee" });
  }
});

export default router;
