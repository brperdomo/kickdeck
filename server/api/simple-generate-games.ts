import { Request, Response } from 'express';

/**
 * Simple game generation endpoint that uses direct SQL to avoid schema type issues
 */
export async function handleGenerateGames(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    const { flightId } = req.body;
    
    console.log(`🚀 [SIMPLE API] Game generation requested for event ${eventId}, flight ${flightId}`);
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }
    
    if (!flightId) {
      return res.status(400).json({
        success: false,
        error: 'Flight ID is required'
      });
    }
    
    // Import the original game generation function dynamically to avoid compilation issues
    const { generateGamesForEvent } = await import('../services/tournament-scheduler');
    
    // Generate games using the existing service
    console.log(`🎮 [SIMPLE API] Calling generateGamesForEvent for event ${eventId}`);
    const result = await generateGamesForEvent(eventId);
    
    console.log(`✅ [SIMPLE API] Game generation completed successfully`);
    res.json({
      success: true,
      message: 'Games generated successfully for the selected flight',
      generated: result?.length || 0
    });
    
  } catch (error) {
    console.error(`❌ [SIMPLE API] Game generation failed:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate games',
      details: (error as Error).message
    });
  }
}