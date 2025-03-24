import express from 'express';
import { 
  getAllMembers,
  getMemberById,
  getTeamRegistrationDetails,
  resendPaymentConfirmation
} from './members';

const router = express.Router();

// Get all members (with search/pagination)
router.get('/', getAllMembers);

// Get member details by ID
router.get('/:id', getMemberById);

// Get team registration details 
router.get('/registration/:teamId', getTeamRegistrationDetails);

// Resend payment confirmation email
router.post('/registration/:teamId/resend-confirmation', resendPaymentConfirmation);

export default router;