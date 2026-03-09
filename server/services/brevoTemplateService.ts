/**
 * Brevo Template Service
 *
 * This service provides functionality to interact with Brevo's transactional
 * templates API and map them to our application's email templates.
 */

import fetch from "node-fetch";
import { db } from "@db";
import { emailTemplates } from "@db/schema";
import { emailProviderSettings } from "@db/schema";
import { eq, and, isNull } from "drizzle-orm";

const BREVO_TEMPLATES_URL = "https://api.brevo.com/v3/smtp/templates";
const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

if (!process.env.BREVO_API_KEY) {
  console.warn(
    "BREVO_API_KEY environment variable is not set. Brevo template features will be unavailable.",
  );
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
 * Get all transactional templates from Brevo
 * @returns {Promise<Array>} Array of template objects
 */
export async function getTemplatesFromBrevo() {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY environment variable is not set");
    }

    const response = await fetch(
      `${BREVO_TEMPLATES_URL}?templateStatus=true&limit=100`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error:", errorText);
      throw new Error(
        `Brevo API returned ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    // Brevo returns { templates: [...], count: number }
    return data.templates || [];
  } catch (error) {
    console.error("Error fetching Brevo templates:", error);
    throw error;
  }
}

/**
 * Get all email templates with their Brevo template mappings
 * @returns {Promise<Array>} Array of email templates with Brevo mappings
 */
export async function listEmailTemplatesWithBrevoMapping() {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
    return templates;
  } catch (error) {
    console.error("Error fetching email templates with mappings:", error);
    throw error;
  }
}

/**
 * Map a Brevo template to an email template type
 * @param {string} templateType - Email template type (e.g., 'welcome', 'password_reset')
 * @param {string|null} brevoTemplateId - Brevo template ID or null to remove mapping
 * @returns {Promise<Object>} Updated template
 */
export async function mapBrevoTemplateToEmailType(
  templateType: string,
  brevoTemplateId: string | null,
) {
  try {
    // Find all templates of this type
    const templatesOfType = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, templateType));

    if (templatesOfType.length === 0) {
      throw new Error(
        `No email templates found with type: ${templateType}`,
      );
    }

    // Update all templates of this type
    const updatePromises = templatesOfType.map((template) =>
      db
        .update(emailTemplates)
        .set({
          brevoTemplateId: brevoTemplateId,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, template.id))
        .returning(),
    );

    const results = await Promise.all(updatePromises);
    return {
      success: true,
      updatedCount: results.length,
      templateType,
      brevoTemplateId,
    };
  } catch (error) {
    console.error("Error mapping Brevo template:", error);
    throw error;
  }
}

/**
 * Get Brevo provider status and metrics
 * @returns {Promise<Object>} Provider status information
 */
export async function getBrevoStatus() {
  try {
    // Get Brevo provider from email_provider_settings table
    const providers = await db
      .select()
      .from(emailProviderSettings)
      .where(
        and(
          eq(emailProviderSettings.providerType, "brevo"),
          eq(emailProviderSettings.isActive, true),
        ),
      );

    const provider = providers.length > 0 ? providers[0] : null;

    // Get count of templates with Brevo mappings
    const templatesWithBrevo = await db
      .select()
      .from(emailTemplates)
      .where(isNull(emailTemplates.brevoTemplateId).not());

    return {
      provider,
      templatesWithBrevo,
      hasApiKey: !!process.env.BREVO_API_KEY,
    };
  } catch (error) {
    console.error("Error getting Brevo status:", error);
    throw error;
  }
}

/**
 * Send a test email using a Brevo template
 * @param {number|string} templateId - Brevo template ID
 * @param {string} recipientEmail - Email address to send the test to
 * @param {Object} testData - Test data to use in the template
 * @returns {Promise<boolean>} True if email was sent successfully
 */
export async function testBrevoTemplate(
  templateId: number | string,
  recipientEmail: string,
  testData: any,
) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY environment variable is not set");
    }

    const senderEmail =
      process.env.DEFAULT_FROM_EMAIL || "support@kickdeck.io";
    const numericTemplateId =
      typeof templateId === "string" ? parseInt(templateId, 10) : templateId;

    const payload = {
      sender: { email: senderEmail, name: "KickDeck" },
      to: [{ email: recipientEmail }],
      templateId: numericTemplateId,
      params: testData || {},
    };

    const response = await fetch(BREVO_SEND_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(
        `Brevo API returned ${response.status}: ${errorMessage}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error sending test email with Brevo:", error);
    throw error;
  }
}
