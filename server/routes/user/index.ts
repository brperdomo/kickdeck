import express from 'express';
import { getCurrentUserRegistrations } from '../admin/members';
import { updateUserPreferences } from './preferences';

const userRouter = express.Router();

// Get current user's registrations
userRouter.get('/registrations', getCurrentUserRegistrations);

// Update user preferences
userRouter.put('/preferences', updateUserPreferences);

export default userRouter;