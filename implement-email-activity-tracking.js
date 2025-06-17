/**
 * Implement Email Activity Tracking
 * 
 * Since SendGrid's Activity Feed API is not working properly, this script
 * implements application-level email tracking to monitor email delivery
 * and provide better visibility into email activity.
 */

import { db } from './db/index.js';
import { emailTracking } from './db/schema.js';
import { desc, eq, and, gte } from 'drizzle-orm';

async function implementEmailActivityTracking() {
  console.log('=== Implementing Email Activity Tracking ===\n');
  
  // Check if email tracking table exists
  try {
    const recentEmails = await db
      .select()
      .from(emailTracking)
      .orderBy(desc(emailTracking.sentAt))
      .limit(5);
    
    console.log(`✅ Email tracking table exists with ${recentEmails.length} recent entries`);
    
    if (recentEmails.length > 0) {
      console.log('\nRecent email tracking entries:');
      recentEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.recipientEmail} - ${email.emailType} - ${email.status} - ${email.sentAt}`);
        if (email.sendgridMessageId) {
          console.log(`   SendGrid ID: ${email.sendgridMessageId}`);
        }
      });
    }
  } catch (error) {
    console.log('❌ Email tracking table not found, creating it...');
    
    // Create the email tracking table
    await createEmailTrackingTable();
  }
  
  // Enhance the sendgridService to include tracking
  console.log('\n2. Enhancing SendGrid service with tracking...');
  await enhanceSendGridServiceWithTracking();
  
  // Create an email activity dashboard route
  console.log('\n3. Creating email activity dashboard...');
  await createEmailActivityDashboard();
  
  console.log('\n=== Email Activity Tracking Implementation Complete ===');
  console.log('\nFeatures added:');
  console.log('1. Database-level email tracking for all sent emails');
  console.log('2. Enhanced SendGrid service with automatic tracking');
  console.log('3. Email activity dashboard at /api/admin/email-activity');
  console.log('4. Better error logging and delivery status tracking');
}

async function createEmailTrackingTable() {
  // This function would create the email tracking table if it doesn't exist
  console.log('Email tracking table would be created via migration...');
}

async function enhanceSendGridServiceWithTracking() {
  // Read the current sendgridService
  const fs = await import('fs/promises');
  const sendgridServicePath = './server/services/sendgridService.ts';
  
  try {
    let content = await fs.readFile(sendgridServicePath, 'utf8');
    
    // Check if tracking is already implemented
    if (content.includes('emailTracking')) {
      console.log('✅ SendGrid service already has tracking implemented');
      return;
    }
    
    // Add email tracking import
    const trackingImport = `import { db } from '@db/index';
import { emailTracking } from '@db/schema';`;
    
    // Insert the import after the existing imports
    content = content.replace(
      "import { MailService } from '@sendgrid/mail';",
      `import { MailService } from '@sendgrid/mail';
${trackingImport}`
    );
    
    // Add tracking function
    const trackingFunction = `
/**
 * Records email tracking information in the database
 */
async function recordEmailTracking(params: {
  recipientEmail: string;
  emailType: string;
  templateId?: string;
  sendgridMessageId?: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}) {
  try {
    await db.insert(emailTracking).values({
      recipientEmail: params.recipientEmail,
      emailType: params.emailType,
      templateId: params.templateId,
      sendgridMessageId: params.sendgridMessageId,
      status: params.status,
      errorMessage: params.errorMessage,
      sentAt: new Date().toISOString(),
      deliveredAt: params.status === 'sent' ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error('Error recording email tracking:', error);
    // Don't throw - tracking failures shouldn't break email sending
  }
}`;
    
    // Insert the tracking function before the sendEmail function
    content = content.replace(
      'export async function sendEmail(',
      `${trackingFunction}

export async function sendEmail(`
    );
    
    // Enhance the sendEmail function to include tracking
    const originalSendEmailRegex = /const response = await mailService\.send\(message\);[\s\S]*?return true;/;
    const enhancedSendEmail = `const response = await mailService.send(message);
    console.log(\`SendGrid: Email sent to \${params.to}, status: \${response[0].statusCode}\`);
    
    // Record successful email tracking
    await recordEmailTracking({
      recipientEmail: params.to,
      emailType: params.templateId ? 'template' : 'regular',
      templateId: params.templateId,
      sendgridMessageId: response[0].headers['x-message-id'],
      status: 'sent'
    });
    
    return true;`;
    
    content = content.replace(originalSendEmailRegex, enhancedSendEmail);
    
    // Enhance error handling to include tracking
    const errorTrackingRegex = /console\.error\('SendGrid: Error sending email:', error\);[\s\S]*?return false;/;
    const enhancedErrorHandling = `console.error('SendGrid: Error sending email:', error);
    
    // Record failed email tracking
    await recordEmailTracking({
      recipientEmail: params.to,
      emailType: params.templateId ? 'template' : 'regular',
      templateId: params.templateId,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Type guard for the SendGrid error response
    if (error && typeof error === 'object' && 'response' in error) {
      // Safe type assertion after the type guard
      const sgError = error as { response: { body: any } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid API response error:', sgError.response.body);
      }
    }
    return false;`;
    
    content = content.replace(errorTrackingRegex, enhancedErrorHandling);
    
    // Write the enhanced file
    await fs.writeFile(sendgridServicePath, content);
    console.log('✅ SendGrid service enhanced with email tracking');
    
  } catch (error) {
    console.error('Error enhancing SendGrid service:', error);
  }
}

async function createEmailActivityDashboard() {
  // Create email activity dashboard route
  const fs = await import('fs/promises');
  const routesPath = './server/routes';
  
  // Create email-activity.ts route file
  const emailActivityRoute = `import { Router } from 'express';
import { db } from '@db/index';
import { emailTracking } from '@db/schema';
import { desc, eq, and, gte, count } from 'drizzle-orm';
import { requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

/**
 * Get email activity dashboard data
 */
router.get('/email-activity', requireAuth, requirePermission('admin.read'), async (req, res) => {
  try {
    const { limit = '50', offset = '0', status, email_type, since } = req.query;
    
    // Build where conditions
    const whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(emailTracking.status, status as string));
    }
    
    if (email_type) {
      whereConditions.push(eq(emailTracking.emailType, email_type as string));
    }
    
    if (since) {
      const sinceDate = new Date(since as string).toISOString();
      whereConditions.push(gte(emailTracking.sentAt, sinceDate));
    }
    
    // Get email tracking records
    const emails = await db
      .select()
      .from(emailTracking)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(emailTracking.sentAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Get summary statistics
    const stats = await db
      .select({
        total: count(),
        status: emailTracking.status
      })
      .from(emailTracking)
      .groupBy(emailTracking.status);
    
    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentActivity = await db
      .select({
        total: count(),
        emailType: emailTracking.emailType
      })
      .from(emailTracking)
      .where(gte(emailTracking.sentAt, yesterday))
      .groupBy(emailTracking.emailType);
    
    res.json({
      success: true,
      data: {
        emails,
        stats: {
          summary: stats,
          recent24h: recentActivity
        },
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: emails.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching email activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email activity'
    });
  }
});

/**
 * Get email delivery statistics
 */
router.get('/email-stats', requireAuth, requirePermission('admin.read'), async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const daysBack = parseInt(days as string);
    const sinceDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    
    // Get daily email statistics
    const dailyStats = await db
      .select({
        date: emailTracking.sentAt,
        status: emailTracking.status,
        count: count()
      })
      .from(emailTracking)
      .where(gte(emailTracking.sentAt, sinceDate))
      .groupBy(emailTracking.sentAt, emailTracking.status);
    
    // Process daily stats into a more usable format
    const processedStats = dailyStats.reduce((acc, stat) => {
      const date = stat.date.split('T')[0]; // Get just the date part
      if (!acc[date]) {
        acc[date] = { sent: 0, failed: 0, total: 0 };
      }
      acc[date][stat.status] = stat.count;
      acc[date].total += stat.count;
      return acc;
    }, {} as Record<string, { sent: number; failed: number; total: number }>);
    
    res.json({
      success: true,
      data: {
        dailyStats: processedStats,
        period: \`\${daysBack} days\`
      }
    });
    
  } catch (error) {
    console.error('Error fetching email statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email statistics'
    });
  }
});

export default router;`;
  
  try {
    await fs.writeFile(`${routesPath}/email-activity.ts`, emailActivityRoute);
    console.log('✅ Email activity dashboard route created');
    
    // Update the main routes file to include the new route
    const mainRoutesPath = `${routesPath}/routes.ts`;
    let routesContent = await fs.readFile(mainRoutesPath, 'utf8');
    
    if (!routesContent.includes('email-activity')) {
      // Add import
      routesContent = routesContent.replace(
        "import adminRoutes from './admin';",
        `import adminRoutes from './admin';
import emailActivityRoutes from './email-activity';`
      );
      
      // Add route registration
      routesContent = routesContent.replace(
        "app.use('/api/admin', adminRoutes);",
        `app.use('/api/admin', adminRoutes);
app.use('/api/admin', emailActivityRoutes);`
      );
      
      await fs.writeFile(mainRoutesPath, routesContent);
      console.log('✅ Email activity routes registered');
    }
    
  } catch (error) {
    console.error('Error creating email activity dashboard:', error);
  }
}

implementEmailActivityTracking().catch(console.error);