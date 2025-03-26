import { Router } from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund } from './teams';

const router = Router();

// Get all teams with filtering
router.get('/', getTeams);

// Get team by ID
router.get('/:teamId', getTeamById);

// Update team status (approve/reject)
router.patch('/:teamId/status', updateTeamStatus);

// Process refund for rejected team
router.post('/:teamId/refund', processRefund);

export default router;