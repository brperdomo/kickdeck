/**
 * Standalone Game Generation Endpoint
 * 
 * This file provides a clean endpoint for game generation that bypasses
 * the complex routes.ts file with its compilation issues.
 * 
 * Add this to your main server to enable game generation functionality.
 */

import express from 'express';
import { handleGenerateGames } from './api/simple-generate-games';

const router = express.Router();

// Game generation endpoint
router.post('/api/admin/events/:eventId/bracket-creation/generate-games', handleGenerateGames);

export default router;