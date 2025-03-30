/**
 * PDF Generation Service
 * Handles creating PDFs for terms acknowledgments and other documents
 */
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { htmlToText } from 'html-to-text';

// Set up constants
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const TERMS_DOCS_DIR = path.join(UPLOADS_DIR, 'terms-acknowledgments');

// Ensure upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(TERMS_DOCS_DIR)) {
  fs.mkdirSync(TERMS_DOCS_DIR, { recursive: true });
}

export interface TermsAcknowledgmentData {
  teamId: number;
  teamName: string;
  eventId: string | number;
  eventName: string;
  managerName: string;
  managerEmail: string;
  timestamp: Date;
  agreementText: string;
  refundPolicyText: string;
}

/**
 * Convert HTML to plain text for PDF
 * @param html HTML content to convert
 * @returns Plain text version with basic formatting
 */
function convertHtmlToText(html: string): string {
  return htmlToText(html, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'h1', options: { uppercase: true } },
      { selector: 'h2', options: { uppercase: true } },
      { selector: 'h3', options: { uppercase: true } }
    ]
  });
}

/**
 * Generate a PDF document that records a team's acknowledgment of terms
 * @param data The terms acknowledgment data
 * @returns The path to the saved PDF file
 */
export async function generateTermsAcknowledgmentPDF(data: TermsAcknowledgmentData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create unique filename
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const filename = `terms_acknowledgment_team_${data.teamId}_${timestamp}.pdf`;
      const filepath = path.join(TERMS_DOCS_DIR, filename);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      
      // Handle stream events
      stream.on('error', (err) => {
        console.error('Error writing PDF file:', err);
        reject(err);
      });
      
      stream.on('finish', () => {
        resolve(filepath);
      });
      
      // Pipe PDF to output stream
      doc.pipe(stream);
      
      // Add header with logo (if exists) or text
      doc.fontSize(24)
         .text('Terms & Conditions Acknowledgment', { align: 'center' })
         .moveDown(0.5);
      
      // Add event and team information
      doc.fontSize(12)
         .text(`Event: ${data.eventName}`, { continued: false })
         .text(`Team: ${data.teamName}`, { continued: false })
         .text(`Manager: ${data.managerName}`, { continued: false })
         .text(`Email: ${data.managerEmail}`, { continued: false })
         .text(`Date: ${data.timestamp.toLocaleDateString()}`, { continued: false })
         .text(`Time: ${data.timestamp.toLocaleTimeString()}`, { continued: false })
         .moveDown(1);
      
      // Add separator line
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1);
      
      // Add terms and conditions section
      doc.fontSize(14)
         .text('TERMS AND CONDITIONS', { continued: false })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .text(convertHtmlToText(data.agreementText))
         .moveDown(1);
      
      // Add refund policy section
      doc.fontSize(14)
         .text('REFUND POLICY', { continued: false })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .text(convertHtmlToText(data.refundPolicyText))
         .moveDown(1);
      
      // Add checkbox confirmation
      doc.fontSize(12)
         .text('✓ I have read and agree to the terms and conditions and refund policy.', { continued: false })
         .moveDown(0.5);
      
      // Add signature line
      doc.fontSize(10)
         .text(`Electronic acknowledgment by: ${data.managerName}`, { continued: false })
         .text(`Date and time: ${data.timestamp.toLocaleDateString()} at ${data.timestamp.toLocaleTimeString()}`, { continued: false })
         .text(`Email: ${data.managerEmail}`, { continued: false })
         .moveDown(0.5);
      
      // Add legal notice at bottom
      doc.fontSize(9)
         .text('This document serves as an electronic record of agreement. It is stored securely and may be used for legal purposes.', { align: 'center' })
         .moveDown(0.5);
      
      // Add page numbers
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .text(`Page ${i + 1} of ${totalPages}`, doc.page.width - 100, doc.page.height - 50);
      }
      
      // Finalize PDF file
      doc.end();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Get the download URL for a terms acknowledgment PDF
 * @param filename The filename or path of the PDF
 * @returns The relative URL to download the PDF
 */
export function getTermsAcknowledgmentDownloadUrl(filename: string): string {
  return `/api/download/terms-acknowledgment/${filename}`;
}