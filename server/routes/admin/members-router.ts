import express from 'express';
import { getAllMembers, getMemberById, getTeamRegistrationDetails, resendPaymentConfirmation } from './members';

const router = express.Router();

// GET /api/admin/members - Get all members with pagination and search
router.get('/', getAllMembers);

// GET /api/admin/members/:id - Get specific member details with their registrations
router.get('/:id', getMemberById);

// GET /api/admin/members/registrations/:teamId - Get specific team registration details
router.get('/registrations/:teamId', getTeamRegistrationDetails);

// POST /api/admin/members/registrations/:teamId/resend-payment-confirmation - Resend payment confirmation email
router.post('/registrations/:teamId/resend-payment-confirmation', resendPaymentConfirmation);

export default router;