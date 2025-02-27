import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "@db";
import { accountingCodes, insertAccountingCodeSchema } from "@db/schema";
import { authenticateAdmin } from "../../middleware/auth";

const router = Router();

// Get all accounting codes
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const codes = await db.query.accountingCodes.findMany({
      orderBy: (accountingCodes) => [accountingCodes.code],
    });
    res.json(codes);
  } catch (error) {
    console.error("Error fetching accounting codes:", error);
    res.status(500).json({ message: "Failed to fetch accounting codes" });
  }
});

// Create a new accounting code
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const validatedData = insertAccountingCodeSchema.parse(req.body);
    const newCode = await db.insert(accountingCodes).values({
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(newCode[0]);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === "23505") {
      res.status(400).json({ message: "An accounting code with this code already exists" });
    } else {
      console.error("Error creating accounting code:", error);
      res.status(500).json({ message: "Failed to create accounting code" });
    }
  }
});

// Update an accounting code
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertAccountingCodeSchema.parse(req.body);
    const updatedCode = await db
      .update(accountingCodes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(accountingCodes.id, parseInt(id)))
      .returning();

    if (updatedCode.length === 0) {
      return res.status(404).json({ message: "Accounting code not found" });
    }

    res.json(updatedCode[0]);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === "23505") {
      res.status(400).json({ message: "An accounting code with this code already exists" });
    } else {
      console.error("Error updating accounting code:", error);
      res.status(500).json({ message: "Failed to update accounting code" });
    }
  }
});

// Delete an accounting code
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCode = await db
      .delete(accountingCodes)
      .where(eq(accountingCodes.id, parseInt(id)))
      .returning();

    if (deletedCode.length === 0) {
      return res.status(404).json({ message: "Accounting code not found" });
    }

    res.json({ message: "Accounting code deleted successfully" });
  } catch (error) {
    console.error("Error deleting accounting code:", error);
    res.status(500).json({ message: "Failed to delete accounting code" });
  }
});

export default router;