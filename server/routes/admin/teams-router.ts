import express from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund } from './teams';

const router = express.Router();

// Get all teams with optional filtering
router.get('/', getTeams);

// Get a specific team by ID
router.get('/:teamId', getTeamById);

// Update team status (approve/reject)
router.put('/:teamId/status', updateTeamStatus);

// Process refund for a team
router.post('/:teamId/refund', processRefund);

export default router;