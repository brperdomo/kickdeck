/**
 * SendGrid Service
 * 
 * This service handles communications with the SendGrid API,
 * particularly for sending emails with dynamic templates.
 */

import sgMail from '@sendgrid/mail';

// Initialize the SendGrid client if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. SendGrid functionality will not work properly.');
}

/**
 * Sends an email using the SendGrid API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.from - Sender email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<boolean>} Whether the email was sent successfully
 */
export async function sendEmail(options) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }

    // Create the email message
    const msg = {
      to: options.to,
      from: options.from,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    // Send the email
    await sgMail.send(msg);
    console.log(`Email sent to ${options.to} via SendGrid`);
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return false;
  }
}

/**
 * Sends an email using a SendGrid dynamic template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.from - Sender email address
 * @param {string} options.templateId - SendGrid dynamic template ID
 * @param {Object} options.dynamicTemplateData - Data to be injected into the template
 * @returns {Promise<boolean>} Whether the email was sent successfully
 */
export async function sendDynamicTemplateEmail(options) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }

    // Create the email message with dynamic template
    const msg = {
      to: options.to,
      from: options.from,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData || {}
    };

    // Send the email
    await sgMail.send(msg);
    console.log(`Dynamic template email sent to ${options.to} using template ${options.templateId}`);
    return true;
  } catch (error) {
    console.error('Error sending dynamic template email with SendGrid:', error);
    return false;
  }
}

/**
 * Verifies that SendGrid is properly configured
 * @returns {Promise<boolean>} Whether SendGrid is properly configured
 */
export async function verifyConfiguration() {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    return false;
  }
  
  try {
    // Make a simple API call to test authentication
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('SendGrid API key is valid');
      return true;
    } else {
      console.error(`SendGrid API key verification failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('Error verifying SendGrid configuration:', error);
    return false;
  }
}