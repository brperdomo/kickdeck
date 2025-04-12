import express from 'express';
import { getCurrentUserRegistrations } from '../admin/members';

const userRouter = express.Router();

// Get current user's registrations
userRouter.get('/registrations', getCurrentUserRegistrations);

export default userRouter;