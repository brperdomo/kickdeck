import { Request, Response } from "express";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for coupon creation/update
const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z.string().nullable().optional().transform(val => val ? new Date(val).toISOString() : null),
  description: z.string().nullable().optional(),
  eventId: z.union([z.coerce.number().positive(), z.null()]).optional(),
  maxUses: z.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function createCoupon(req: Request, res: Response) {
  try {
    const validatedData = couponSchema.parse(req.body);

    // Allow null eventId for global coupons
    const eventIdToUse = validatedData.eventId || null;

    // Check if code exists for this event
    const existingCoupon = await db.execute(sql`
      SELECT id FROM coupons 
      WHERE LOWER(code) = LOWER(${validatedData.code})
      AND (expiration_date IS NULL OR expiration_date > NOW())
      AND is_active = true
    `);

    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ 
        error: "Coupon code already exists",
        code: "DUPLICATE_CODE"
      });
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
        is_active
      ) VALUES (
        ${validatedData.code},
        ${validatedData.discountType},
        ${validatedData.amount},
        ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        ${validatedData.description || null},
        ${validatedData.eventId || null},
        ${validatedData.maxUses || null},
        ${validatedData.isActive}
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
    let query;

    if (!eventId) {
      query = sql`SELECT * FROM coupons`;
    } else {
      const numericEventId = parseInt(eventId as string, 10);
      if (isNaN(numericEventId)) {
        return res.status(400).json({ error: "Invalid event ID format" });
      }
      query = sql`SELECT * FROM coupons WHERE event_id = ${numericEventId}`;
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
        code = ${validatedData.code || null},
        discount_type = ${validatedData.discountType || null},
        amount = ${validatedData.amount || null},
        expiration_date = ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        description = ${validatedData.description || null},
        event_id = ${validatedData.eventId || null},
        max_uses = ${validatedData.maxUses || null},
        is_active = ${validatedData.isActive === undefined ? true : validatedData.isActive},
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