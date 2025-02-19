import { Request, Response } from "express";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for coupon creation/update
const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.number().positive("Amount must be positive"),
  expirationDate: z.string().datetime().optional(),
  description: z.string().optional(),
  eventId: z.number().optional(),
  maxUses: z.number().positive("Max uses must be positive").optional(),
  isActive: z.boolean().default(true),
});

export async function createCoupon(req: Request, res: Response) {
  try {
    const validatedData = couponSchema.parse(req.body);
    
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
    let query = sql`SELECT * FROM coupons`;
    
    if (eventId) {
      query = sql`SELECT * FROM coupons WHERE event_id = ${Number(eventId)}`;
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
      UPDATE coupons
      SET 
        code = COALESCE(${validatedData.code}, code),
        discount_type = COALESCE(${validatedData.discountType}, discount_type),
        amount = COALESCE(${validatedData.amount}, amount),
        expiration_date = COALESCE(${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null}, expiration_date),
        description = COALESCE(${validatedData.description}, description),
        event_id = COALESCE(${validatedData.eventId}, event_id),
        max_uses = COALESCE(${validatedData.maxUses}, max_uses),
        is_active = COALESCE(${validatedData.isActive}, is_active),
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
