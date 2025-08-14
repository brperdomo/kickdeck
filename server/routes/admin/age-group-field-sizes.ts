/**
 * Age Group Field Size Update API
 * 
 * This endpoint handles field size updates for age groups in events.
 * Allows updating field sizes without affecting other age group properties.
 */

import { Router } from 'express';
import { db } from '../../../db';
import { eventAgeGroups } from '../../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Update field size for a specific age group
router.patch('/:ageGroupId/field-size', async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const { fieldSize } = req.body;
    
    if (!fieldSize || !['4v4', '7v7', '9v9', '11v11'].includes(fieldSize)) {
      return res.status(400).json({ 
        error: 'Valid fieldSize is required (4v4, 7v7, 9v9, or 11v11)' 
      });
    }
    
    console.log(`Updating field size for age group ${ageGroupId} to ${fieldSize}`);
    
    await db
      .update(eventAgeGroups)
      .set({ fieldSize })
      .where(eq(eventAgeGroups.id, parseInt(ageGroupId)));
    
    console.log(`Successfully updated age group ${ageGroupId} field size to ${fieldSize}`);

    // BI-DIRECTIONAL SYNC: Update corresponding flight configuration field sizes
    // Find all brackets/flights associated with this age group and update their game formats
    try {
      const { eventBrackets, gameFormats } = await import('../../../db/schema');
      
      const brackets = await db.query.eventBrackets.findMany({
        where: eq(eventBrackets.ageGroupId, parseInt(ageGroupId))
      });
      
      console.log(`[BI-DIRECTIONAL SYNC] Found ${brackets.length} flights for age group ${ageGroupId}`);
      
      for (const bracket of brackets) {
        // Update existing game format if it exists
        const existingFormat = await db.query.gameFormats.findFirst({
          where: eq(gameFormats.bracketId, bracket.id)
        });
        
        if (existingFormat) {
          await db.update(gameFormats)
            .set({ fieldSize })
            .where(eq(gameFormats.id, existingFormat.id));
          console.log(`[BI-DIRECTIONAL SYNC] Updated game format for flight ${bracket.id} to field size ${fieldSize}`);
        } else {
          // Create new game format with field size if none exists
          const newFormatData = {
            bracketId: bracket.id,
            gameLength: 90, // Default
            restPeriod: 90, // Default
            bufferTime: 15, // Default
            fieldSize: fieldSize,
            maxGamesPerDay: 3, // Default
            templateName: 'Auto-configured'
          };
          
          await db.insert(gameFormats).values(newFormatData);
          console.log(`[BI-DIRECTIONAL SYNC] Created new game format for flight ${bracket.id} with field size ${fieldSize}`);
        }
      }
    } catch (syncError) {
      console.error('Error in bi-directional sync:', syncError);
      // Don't fail the main request if sync fails, just log the error
    }
    
    return res.json({ 
      success: true, 
      message: 'Age group field size updated successfully',
      fieldSize 
    });
  } catch (error) {
    console.error('Error updating age group field size:', error);
    return res.status(500).json({ error: 'Failed to update age group field size' });
  }
});

// Bulk update field sizes for multiple age groups
router.patch('/bulk/field-sizes', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates array is required' });
    }
    
    console.log(`Bulk updating field sizes for ${updates.length} age groups`);
    
    // Update each age group's field size
    for (const update of updates) {
      if (update.id && update.fieldSize && ['4v4', '7v7', '9v9', '11v11'].includes(update.fieldSize)) {
        await db
          .update(eventAgeGroups)
          .set({ fieldSize: update.fieldSize })
          .where(eq(eventAgeGroups.id, parseInt(update.id)));
          
        console.log(`Updated age group ${update.id} field size to ${update.fieldSize}`);
      }
    }
    
    return res.json({ 
      success: true, 
      message: `Updated field sizes for ${updates.length} age groups` 
    });
  } catch (error) {
    console.error('Error bulk updating age group field sizes:', error);
    return res.status(500).json({ error: 'Failed to update age group field sizes' });
  }
});

export default router;