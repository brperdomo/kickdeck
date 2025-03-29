import { Request, Response } from 'express';
import { log } from '../vite';

/**
 * Get TinyMCE API key configuration
 */
export async function getTinyMCEConfig(req: Request, res: Response) {
  try {
    // Return the TinyMCE API key from environment variables
    const apiKey = process.env.TINYMCE_API_KEY;
    
    if (!apiKey) {
      log('TinyMCE API key not found in environment variables', 'config');
      return res.status(500).json({ error: 'TinyMCE configuration is missing' });
    }
    
    return res.json({
      apiKey
    });
  } catch (error) {
    log(`Error retrieving TinyMCE config: ${error instanceof Error ? error.message : String(error)}`, 'config');
    return res.status(500).json({ 
      error: 'Failed to retrieve TinyMCE configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}