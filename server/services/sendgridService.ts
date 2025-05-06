import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SendGrid API key not found in environment variables");
}

// Initialize the mail service with the API key
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface SendGridEmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface SendGridDynamicTemplateParams {
  to: string;
  from: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
}

/**
 * Set the SendGrid API key
 * @param apiKey The SendGrid API key
 */
export function setApiKey(apiKey: string): void {
  mailService.setApiKey(apiKey);
  console.log('SendGrid API key configured');
}

/**
 * Sends an email using SendGrid
 * @param params Email parameters
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendEmail(params: SendGridEmailParams): Promise<boolean> {
  try {
    // Check if API key is set
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    // Determine if we're using a template or regular email
    const message: any = {
      to: params.to,
      from: params.from,
      subject: params.subject
    };

    if (params.templateId) {
      message.templateId = params.templateId;
      message.dynamicTemplateData = params.dynamicTemplateData || {};
    } else {
      // Ensure both text and html are strings with at least one character
      message.text = params.text || 'Please view this email in a compatible email client.';
      message.html = params.html || '<p>Please view this email in a compatible email client.</p>';
    }

    const response = await mailService.send(message);
    console.log(`SendGrid: Email sent to ${params.to}, status: ${response[0].statusCode}`);
    return true;
  } catch (error: unknown) {
    console.error('SendGrid: Error sending email:', error);
    // Type guard for the SendGrid error response
    if (error && typeof error === 'object' && 'response' in error) {
      // Safe type assertion after the type guard
      const sgError = error as { response: { body: any } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid API response error:', sgError.response.body);
      }
    }
    return false;
  }
}

/**
 * Send an email using a SendGrid dynamic template
 * @param params Parameters including templateId and dynamic template data
 * @returns Promise resolving to true if email was sent successfully 
 */
export async function sendDynamicTemplateEmail(params: SendGridDynamicTemplateParams): Promise<boolean> {
  try {
    // Check if API key is set
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    if (!params.templateId) {
      console.error('SendGrid template ID is required');
      return false;
    }

    // Create message with dynamic template data
    const message = {
      to: params.to,
      from: params.from,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData || {}
    };

    // Log template data in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('SendGrid Dynamic Template Email:');
      console.log(`Template ID: ${params.templateId}`);
      console.log('Dynamic Template Data:', JSON.stringify(params.dynamicTemplateData, null, 2));
    }

    const response = await mailService.send(message);
    console.log(`SendGrid: Dynamic template email sent to ${params.to}, status: ${response[0].statusCode}`);
    return true;
  } catch (error: unknown) {
    console.error('SendGrid: Error sending dynamic template email:', error);
    // Type guard for the SendGrid error response
    if (error && typeof error === 'object' && 'response' in error) {
      // Safe type assertion after the type guard
      const sgError = error as { response: { body: any } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid API response error:', sgError.response.body);
      }
    }
    return false;
  }
}

/**
 * Verifies the SendGrid configuration by sending a test email
 * @param testEmail Email address to send the test to
 * @returns Promise resolving to true if test email was sent successfully
 */
export async function verifyConfiguration(testEmail: string): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    if (!testEmail) {
      throw new Error('Test email address required');
    }

    const message = {
      to: testEmail,
      from: testEmail, // Use the same email for testing (must be verified sender in SendGrid)
      subject: 'SendGrid Configuration Test',
      text: 'This is a test email to verify your SendGrid configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">SendGrid Configuration Test</h2>
          <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    };

    const response = await mailService.send(message);
    console.log(`SendGrid configuration verified, status: ${response[0].statusCode}`);
    return response[0].statusCode >= 200 && response[0].statusCode < 300;
  } catch (error: unknown) {
    console.error('SendGrid configuration verification failed:', error);
    // Type guard for the SendGrid error response
    if (error && typeof error === 'object' && 'response' in error) {
      // Safe type assertion after the type guard
      const sgError = error as { response: { body: any } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid API response error:', sgError.response.body);
      }
    }
    return false;
  }
}

/**
 * Tests a SendGrid dynamic template by sending a test email
 * @param testEmail Email address to send the test to
 * @param templateId SendGrid dynamic template ID
 * @param sampleData Sample data to use for the template
 * @returns Promise resolving to true if test was successful
 */
export async function testDynamicTemplate(
  testEmail: string, 
  templateId: string, 
  sampleData: Record<string, any>
): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    if (!testEmail) {
      throw new Error('Test email address required');
    }

    if (!templateId) {
      throw new Error('SendGrid template ID is required');
    }

    console.log(`Testing SendGrid dynamic template: ${templateId}`);
    console.log(`Sending to: ${testEmail}`);
    console.log('Sample data:', sampleData);

    return await sendDynamicTemplateEmail({
      to: testEmail,
      from: 'support@matchpro.ai', // Must be a verified sender in SendGrid
      templateId,
      dynamicTemplateData: sampleData
    });
  } catch (error: unknown) {
    console.error('SendGrid dynamic template test failed:', error);
    // Type guard for the SendGrid error response
    if (error && typeof error === 'object' && 'response' in error) {
      // Safe type assertion after the type guard
      const sgError = error as { response: { body: any } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid API response error:', sgError.response.body);
      }
    }
    return false;
  }
}