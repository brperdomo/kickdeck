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
  eventId: z.string().nullable().optional(),  // Make eventId optional since we might not always have an event context
});

type FeeInput = z.infer<typeof feeSchema>;

// Get all fees
router.get("/api/admin/fees", async (req, res) => {
  try {
    console.log("Fetching all fees...");
    const fees = await db.select().from(eventFees).orderBy(eventFees.createdAt);
    console.log("Retrieved fees:", fees);
    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ error: "Failed to fetch fees" });
  }
});

// Create a new fee
router.post("/api/admin/fees", async (req, res) => {
  try {
    console.log("Creating new fee with data:", req.body);
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

    console.log("Created fee:", fee);
    res.json(fee);
  } catch (error) {
    console.error("Error creating fee:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid fee data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create fee" });
    }
  }
});

// Get fee by ID
router.get("/api/admin/fees/:id", async (req, res) => {
  try {
    console.log("Fetching fee with ID:", req.params.id);
    const [fee] = await db.select().from(eventFees).where(eq(eventFees.id, parseInt(req.params.id)));

    if (!fee) {
      console.log("Fee not found with ID:", req.params.id);
      return res.status(404).json({ error: "Fee not found" });
    }

    console.log("Retrieved fee:", fee);
    res.json(fee);
  } catch (error) {
    console.error("Error fetching fee:", error);
    res.status(500).json({ error: "Failed to fetch fee" });
  }
});

// Update fee
router.put("/api/admin/fees/:id", async (req, res) => {
  try {
    console.log("Updating fee with ID:", req.params.id, "Data:", req.body);
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
      console.log("Fee not found for update with ID:", req.params.id);
      return res.status(404).json({ error: "Fee not found" });
    }

    console.log("Updated fee:", fee);
    res.json(fee);
  } catch (error) {
    console.error("Error updating fee:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid fee data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to update fee" });
    }
  }
});

export default router;