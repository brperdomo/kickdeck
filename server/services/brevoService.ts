/**
 * Brevo (formerly Sendinblue) Service for Email Communication
 *
 * This service handles sending emails through the Brevo REST API with both
 * regular email content and dynamic templates.
 * Uses direct HTTP calls via node-fetch — no SDK dependency.
 */

import fetch from "node-fetch";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

if (!process.env.BREVO_API_KEY) {
  console.warn("Brevo API key not found in environment variables");
}

export interface BrevoEmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: number;
  params?: Record<string, any>;
}

export interface BrevoDynamicTemplateParams {
  to: string;
  from: string;
  templateId: number;
  params: Record<string, any>;
}

// Also export the old interface name so callers that imported SendEmailParams still work
export type SendEmailParams = BrevoEmailParams;

/**
 * Parse a "Name <email>" formatted string into { name, email }
 */
function parseSender(from: string): { name?: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: from.trim() };
}

/**
 * Get Brevo API headers
 */
function getHeaders(): Record<string, string> {
  return {
    "api-key": process.env.BREVO_API_KEY || "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Sends an email using the Brevo API
 * @param params Email parameters
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendEmail(
  params: BrevoEmailParams,
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("[Brevo] ❌ API key not configured — cannot send email");
      return false;
    }

    const sender = parseSender(params.from);
    console.log(`[Brevo] Preparing email: to=${params.to}, sender=${JSON.stringify(sender)}, subject="${params.subject || '(template)'}"`);

    // Build the Brevo payload
    let payload: any;

    if (params.templateId) {
      // Template-based email
      payload = {
        sender,
        to: [{ email: params.to }],
        templateId: params.templateId,
        params: params.params || {},
      };
    } else {
      // Regular email with content
      payload = {
        sender,
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent:
          params.html ||
          "<p>Please view this email in a compatible email client.</p>",
        textContent:
          params.text ||
          "Please view this email in a compatible email client.",
      };
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `[Brevo] ❌ API error (${response.status}): ${errorData}`,
      );
      console.error(`[Brevo] Request payload sender: ${JSON.stringify(sender)}, to: ${params.to}`);
      return false;
    }

    const data = (await response.json()) as any;
    console.log(
      `[Brevo] ✅ Email sent to ${params.to}, messageId: ${data.messageId || "ok"}`,
    );
    return true;
  } catch (error: unknown) {
    console.error("[Brevo] ❌ Error sending email:", error);
    if (error && typeof error === "object" && "message" in error) {
      console.error("[Brevo] Error details:", (error as Error).message);
    }
    return false;
  }
}

/**
 * Send an email using a Brevo template
 * @param params Parameters including templateId and template params
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendDynamicTemplateEmail(
  params: BrevoDynamicTemplateParams,
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("Brevo API key not configured");
      return false;
    }

    if (!params.templateId) {
      console.error("Brevo template ID is required");
      return false;
    }

    const sender = parseSender(params.from);

    const payload = {
      sender,
      to: [{ email: params.to }],
      templateId: params.templateId,
      params: params.params || {},
    };

    // Log template data in development mode
    if (process.env.NODE_ENV !== "production") {
      console.log("Brevo Template Email:");
      console.log(`Template ID: ${params.templateId}`);
      console.log(
        "Template Params:",
        JSON.stringify(params.params, null, 2),
      );
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Brevo API error (${response.status}):`,
        errorData,
      );
      return false;
    }

    const data = (await response.json()) as any;
    console.log(
      `Brevo: Template email sent to ${params.to}, messageId: ${data.messageId || "ok"}`,
    );
    return true;
  } catch (error: unknown) {
    console.error("Brevo: Error sending template email:", error);
    if (error && typeof error === "object" && "message" in error) {
      console.error("Brevo error details:", (error as Error).message);
    }
    return false;
  }
}

/**
 * Verifies the Brevo configuration by sending a test email
 * @param testEmail Email address to send the test to
 * @returns Promise resolving to true if test email was sent successfully
 */
export async function verifyConfiguration(
  testEmail: string,
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("Brevo API key not configured");
    }

    if (!testEmail) {
      throw new Error("Test email address required");
    }

    const result = await sendEmail({
      to: testEmail,
      from: `KickDeck <${process.env.DEFAULT_FROM_EMAIL || "support@kickdeck.io"}>`,
      subject: "Brevo Configuration Test",
      text: "This is a test email to verify your Brevo configuration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">Brevo Configuration Test</h2>
          <p>This is a test email to verify your Brevo configuration is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (result) {
      console.log("Brevo configuration verified successfully");
    }
    return result;
  } catch (error: unknown) {
    console.error("Brevo configuration verification failed:", error);
    return false;
  }
}

/**
 * Tests a Brevo template by sending a test email
 * @param testEmail Email address to send the test to
 * @param templateId Brevo template ID (integer)
 * @param sampleData Sample data to use for the template
 * @returns Promise resolving to true if test was successful
 */
export async function testDynamicTemplate(
  testEmail: string,
  templateId: number | string,
  sampleData: Record<string, any>,
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("Brevo API key not configured");
    }

    if (!testEmail) {
      throw new Error("Test email address required");
    }

    if (!templateId) {
      throw new Error("Brevo template ID is required");
    }

    const numericTemplateId =
      typeof templateId === "string" ? parseInt(templateId, 10) : templateId;

    console.log(`Testing Brevo template: ${numericTemplateId}`);
    console.log(`Sending to: ${testEmail}`);
    console.log("Sample data:", sampleData);

    return await sendDynamicTemplateEmail({
      to: testEmail,
      from: `KickDeck <${process.env.DEFAULT_FROM_EMAIL || "support@kickdeck.io"}>`,
      templateId: numericTemplateId,
      params: sampleData,
    });
  } catch (error: unknown) {
    console.error("Brevo template test failed:", error);
    return false;
  }
}
