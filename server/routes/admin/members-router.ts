import express from 'express';
import { 
  getAllMembers, 
  getMemberById, 
  getTeamRegistrationDetails, 
  resendPaymentConfirmation,
  getCurrentUserRegistrations,
  updateMemberEmail,
  mergeMembers
} from './members';

const membersRouter = express.Router();

// Get all members with search and pagination
membersRouter.get('/', getAllMembers);

// Get team registration details
membersRouter.get('/registrations/:teamId', getTeamRegistrationDetails);

// Get a specific member by ID with their registrations
membersRouter.get('/:id', getMemberById);

// Update member email (both users table and teams table)
membersRouter.put('/:id/email', updateMemberEmail);

// Merge two member accounts
membersRouter.post('/:id/merge', mergeMembers);

// Resend payment confirmation email
membersRouter.post('/registrations/:teamId/resend-payment-confirmation', resendPaymentConfirmation);

// Get current user's registrations
membersRouter.get('/me/registrations', getCurrentUserRegistrations);

export default membersRouter;