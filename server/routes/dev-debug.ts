/**
 * Development Debug API Routes
 * Only used in development environment
 */
import { Router } from 'express';
import { isDevelopment } from '../utils/env';

const router = Router();

// Only allow in development environments
router.use((req, res, next) => {
  if (!isDevelopment()) {
    return res.status(404).json({ error: 'Not found in production environment' });
  }
  next();
});

// Return session data for debugging
router.get('/api/dev/session-debug', (req, res) => {
  try {
    // Sanitize session data (remove any sensitive information)
    const sanitizedSession = { ...req.session };
    
    // Remove any sensitive fields
    if (sanitizedSession.passport && sanitizedSession.passport.user) {
      // Keep user ID but remove any sensitive fields
      const userId = sanitizedSession.passport.user;
      sanitizedSession.passport = { user: userId };
    }
    
    // Return session data
    res.json({
      id: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      session: sanitizedSession,
      cookies: req.cookies,
    });
  } catch (error) {
    console.error('Error fetching session debug data:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

// Clear the current session (for testing purposes)
router.post('/api/dev/clear-session', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error clearing session:', err);
        return res.status(500).json({ error: 'Failed to clear session' });
      }
      res.clearCookie('matchpro.sid');
      res.json({ success: true, message: 'Session cleared successfully' });
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

export default router;