import { Router } from "express";
import { db } from "@db";
import { eventFees } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Fee validation schema
const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  beginDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  applyToAll: z.boolean().default(false),
  accountingCodeId: z.number().nullable().optional(),
  eventId: z.string().optional(),  // Make eventId optional since we might not always have an event context
});

type FeeInput = z.infer<typeof feeSchema>;

// Get all fees
router.get("/api/admin/fees", async (req, res) => {
  try {
    const fees = await db.select().from(eventFees).orderBy(eventFees.createdAt);
    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ error: "Failed to fetch fees" });
  }
});

// Create a new fee
router.post("/api/admin/fees", async (req, res) => {
  try {
    const feeData = feeSchema.parse(req.body);

    const [fee] = await db.insert(eventFees).values({
      name: feeData.name,
      amount: feeData.amount,
      beginDate: feeData.beginDate ? new Date(feeData.beginDate) : null,
      endDate: feeData.endDate ? new Date(feeData.endDate) : null,
      applyToAll: feeData.applyToAll,
      accountingCodeId: feeData.accountingCodeId,
      eventId: feeData.eventId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.json(fee);
  } catch (error) {
    console.error("Error creating fee:", error);
    res.status(500).json({ error: "Failed to create fee" });
  }
});

// Get fee by ID
router.get("/api/admin/fees/:id", async (req, res) => {
  try {
    const [fee] = await db.select().from(eventFees).where(eq(eventFees.id, parseInt(req.params.id)));

    if (!fee) {
      return res.status(404).json({ error: "Fee not found" });
    }

    res.json(fee);
  } catch (error) {
    console.error("Error fetching fee:", error);
    res.status(500).json({ error: "Failed to fetch fee" });
  }
});

// Update fee
router.put("/api/admin/fees/:id", async (req, res) => {
  try {
    const feeData = feeSchema.parse(req.body);

    const [fee] = await db.update(eventFees)
      .set({
        name: feeData.name,
        amount: feeData.amount,
        beginDate: feeData.beginDate ? new Date(feeData.beginDate) : null,
        endDate: feeData.endDate ? new Date(feeData.endDate) : null,
        applyToAll: feeData.applyToAll,
        accountingCodeId: feeData.accountingCodeId,
        eventId: feeData.eventId || null,
        updatedAt: new Date()
      })
      .where(eq(eventFees.id, parseInt(req.params.id)))
      .returning();

    if (!fee) {
      return res.status(404).json({ error: "Fee not found" });
    }

    res.json(fee);
  } catch (error) {
    console.error("Error updating fee:", error);
    res.status(500).json({ error: "Failed to update fee" });
  }
});

export default router;