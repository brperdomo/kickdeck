import express from 'express';
import { db } from '../../db';
import { productUpdates, insertProductUpdateSchema } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * Get all product updates
 * Public route - available to all users
 */
router.get('/', async (req, res) => {
  try {
    // Allow filtering by category
    const category = req.query.category;
    
    // Allow limiting the number of results
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    // Handle highlighted flag
    const highlighted = req.query.highlighted === 'true';
    
    let query = db.select().from(productUpdates);
    
    // Apply filters
    if (category) {
      query = query.where(eq(productUpdates.category, category));
    }
    
    if (highlighted) {
      query = query.where(eq(productUpdates.isHighlighted, true));
    }
    
    // Always sort by release date descending
    query = query.orderBy(desc(productUpdates.releaseDate));
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }
    
    const updates = await query;
    
    res.json({ updates });
  } catch (error) {
    console.error('Error fetching product updates:', error);
    res.status(500).json({ error: 'An error occurred while fetching product updates' });
  }
});

/**
 * Get a single product update by ID
 * Public route - available to all users
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product update ID' });
    }
    
    const update = await db.select().from(productUpdates).where(eq(productUpdates.id, id)).limit(1);
    
    if (update.length === 0) {
      return res.status(404).json({ error: 'Product update not found' });
    }
    
    res.json({ update: update[0] });
  } catch (error) {
    console.error('Error fetching product update:', error);
    res.status(500).json({ error: 'An error occurred while fetching the product update' });
  }
});

/**
 * Create a new product update
 * Admin only
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const validatedData = insertProductUpdateSchema.parse(req.body);
    
    const newUpdate = await db.insert(productUpdates).values({
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    res.status(201).json({ 
      message: 'Product update created successfully', 
      update: newUpdate[0] 
    });
  } catch (error) {
    console.error('Error creating product update:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid product update data', details: error.errors });
    }
    
    res.status(500).json({ error: 'An error occurred while creating the product update' });
  }
});

/**
 * Update an existing product update
 * Admin only
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product update ID' });
    }
    
    const validatedData = insertProductUpdateSchema.parse(req.body);
    
    const updatedUpdate = await db.update(productUpdates)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(productUpdates.id, id))
      .returning();
    
    if (updatedUpdate.length === 0) {
      return res.status(404).json({ error: 'Product update not found' });
    }
    
    res.json({ 
      message: 'Product update updated successfully', 
      update: updatedUpdate[0] 
    });
  } catch (error) {
    console.error('Error updating product update:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid product update data', details: error.errors });
    }
    
    res.status(500).json({ error: 'An error occurred while updating the product update' });
  }
});

/**
 * Delete a product update
 * Admin only
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product update ID' });
    }
    
    const deletedUpdate = await db.delete(productUpdates)
      .where(eq(productUpdates.id, id))
      .returning();
    
    if (deletedUpdate.length === 0) {
      return res.status(404).json({ error: 'Product update not found' });
    }
    
    res.json({ 
      message: 'Product update deleted successfully', 
      update: deletedUpdate[0] 
    });
  } catch (error) {
    console.error('Error deleting product update:', error);
    res.status(500).json({ error: 'An error occurred while deleting the product update' });
  }
});

export default router;