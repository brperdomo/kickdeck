import express from 'express';
import { db } from '@db';
import { fields, complexes } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// GET /api/admin/fields - Get all available fields
router.get('/', async (req, res) => {
  try {
    console.log('[Fields API] Fetching all available fields');

    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name,
        isOpen: fields.isOpen,
        hasLights: fields.hasLights,
        openTime: fields.openTime,
        closeTime: fields.closeTime
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.isOpen, true));

    console.log(`[Fields API] Found ${availableFields.length} available fields`);

    res.json({
      success: true,
      fields: availableFields,
      totalFields: availableFields.length
    });

  } catch (error) {
    console.error('[Fields API] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;