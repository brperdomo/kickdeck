app.get('/api/admin/organization-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.query.organizationSettings.findFirst();
    res.set('Cache-Control', 'public, max-age=300');
    res.json(settings);
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    res.status(500).json({ error: 'Failed to fetch organization settings' });
  }
});

// Import and use automated scheduling routes
import automatedSchedulingRouter from './admin/automated-scheduling.js';
app.use('/api/admin', automatedSchedulingRouter);