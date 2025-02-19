import { Request, Response } from "express";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for coupon creation/update
const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z.string().datetime().nullable().optional(),
  description: z.string().nullable().optional(),
  eventId: z.union([z.coerce.number().positive(), z.null()]).optional(),
  maxUses: z.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z.boolean().default(true),
  accountingNumber: z.string().optional(),
});

export async function createCoupon(req: Request, res: Response) {
  try {
    const validatedData = couponSchema.parse(req.body);

    // Allow null eventId for global coupons
    const eventIdToUse = validatedData.eventId || null;

    // Check if code exists for this event
    const existingCoupon = await db.execute(sql`
      SELECT id FROM coupons 
      WHERE code = ${validatedData.code}
      AND event_id = ${eventIdToUse}
    `);

    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ error: "Coupon code already exists for this event" });
    }

    const result = await db.execute(sql`
      INSERT INTO coupons (
        code,
        discount_type,
        amount,
        expiration_date,
        description,
        event_id,
        max_uses,
        is_active,
        accounting_number
      ) VALUES (
        ${validatedData.code},
        ${validatedData.discountType},
        ${validatedData.amount},
        ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        ${validatedData.description || null},
        ${validatedData.eventId || null},
        ${validatedData.maxUses || null},
        ${validatedData.isActive},
        ${validatedData.accountingNumber || null}
      ) RETURNING *;
    `);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating coupon:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create coupon" });
  }
}

export async function getCoupons(req: Request, res: Response) {
  try {
    const eventId = req.query.eventId;
    let query = sql`SELECT * FROM coupons`;

    if (eventId && !isNaN(Number(eventId))) {
      query = sql`SELECT * FROM coupons WHERE event_id = ${Number(eventId)} OR event_id IS NULL`;
    }

    const result = await db.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = couponSchema.partial().parse(req.body);

    const result = await db.execute(sql`
      UPDATE coupons SET 
        code = ${validatedData.code},
        discount_type = ${validatedData.discountType},
        amount = ${validatedData.amount},
        expiration_date = ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        description = ${validatedData.description},
        event_id = ${validatedData.eventId},
        max_uses = ${validatedData.maxUses},
        is_active = ${validatedData.isActive},
        accounting_number = ${validatedData.accountingNumber},
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating coupon:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update coupon" });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await db.execute(sql`
      DELETE FROM coupons WHERE id = ${Number(id)} RETURNING *;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
}