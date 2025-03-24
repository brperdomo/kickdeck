import { Router } from 'express';
import { getAllMembers, getMemberById, getTeamRegistrationDetails, resendPaymentConfirmation } from './members';
import { validateAdmin } from '../../middleware/auth';

const membersRouter = Router();

// Apply admin validation middleware to all routes
membersRouter.use(validateAdmin);

// Get all members with pagination and search
membersRouter.get('/', getAllMembers);

// Get a specific member by ID with their registrations
membersRouter.get('/:id', getMemberById);

// Get team registration details
membersRouter.get('/registrations/:registrationId', getTeamRegistrationDetails);

// Resend payment confirmation email
membersRouter.post('/registrations/:registrationId/resend-payment-confirmation', resendPaymentConfirmation);

export default membersRouter;