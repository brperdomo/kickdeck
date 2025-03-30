/**
 * Terms Acknowledgment API Routes
 * Handles generating and downloading PDFs for terms agreements
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { teams, events } from '@db/schema';
import { eq } from 'drizzle-orm';
import { generateTermsAcknowledgmentPDF, getTermsAcknowledgmentDownloadUrl } from '../services/pdfService';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Generate a PDF for a team's terms acknowledgment
 */
export async function generateTermsAcknowledgmentDocument(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    
    // Get team and event details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (!team.termsAcknowledged) {
      return res.status(400).json({ error: 'Team has not acknowledged terms yet' });
    }
    
    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(team.eventId))
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Instead of trying to fetch event settings which might not exist in the format we expect,
    // use the terms and refund policy from the event record
    
    // Generate PDF
    const pdfPath = await generateTermsAcknowledgmentPDF({
      teamId: team.id,
      teamName: team.name,
      eventId: team.eventId,
      eventName: event.name,
      managerName: `${team.managerFirstName} ${team.managerLastName}`,
      managerEmail: team.managerEmail,
      timestamp: team.termsAcknowledgedAt ? new Date(team.termsAcknowledgedAt) : new Date(),
      agreementText: event.agreement || 'No terms and conditions provided',
      refundPolicyText: event.refundPolicy || 'No refund policy provided'
    });
    
    // Save the PDF path to the team record
    await db.update(teams)
      .set({ 
        termsAcknowledgmentRecord: pdfPath,
        updatedAt: new Date().toISOString()
      })
      .where(eq(teams.id, teamId));
    
    // Return success with download URL
    res.json({
      success: true,
      message: 'Terms acknowledgment document generated',
      downloadUrl: getTermsAcknowledgmentDownloadUrl(path.basename(pdfPath))
    });
    
  } catch (error) {
    console.error('Error generating terms acknowledgment document:', error);
    res.status(500).json({
      error: 'Failed to generate terms acknowledgment document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Download a team's terms acknowledgment document
 */
export async function downloadTermsAcknowledgmentDocument(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    
    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (!team.termsAcknowledgmentRecord) {
      return res.status(404).json({ error: 'No terms acknowledgment document found for this team' });
    }
    
    // Check if file exists
    if (!fs.existsSync(team.termsAcknowledgmentRecord)) {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="terms-acknowledgment-team-${teamId}.pdf"`);
    
    const fileStream = fs.createReadStream(team.termsAcknowledgmentRecord);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading terms acknowledgment document:', error);
    res.status(500).json({
      error: 'Failed to download terms acknowledgment document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Admin endpoint to download a specific terms acknowledgment file by name
 */
export async function downloadTermsAcknowledgmentByFilename(req: Request, res: Response) {
  try {
    const filename = req.params.filename;
    
    // For security, validate filename to prevent path traversal
    if (!filename || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Get uploads directory path
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const termsDir = path.join(uploadsDir, 'terms-acknowledgments');
    
    // Ensure the terms-acknowledgments directory exists
    if (!fs.existsSync(termsDir)) {
      return res.status(404).json({ error: 'Terms acknowledgments directory not found' });
    }
    
    const filePath = path.join(termsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading terms acknowledgment document by filename:', error);
    res.status(500).json({
      error: 'Failed to download terms acknowledgment document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}