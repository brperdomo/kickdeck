import nodemailer, { Transporter } from "nodemailer";
import { db } from "@db/index";
import { emailProviderSettings } from "@db/schema";
import { emailTemplates } from "@db/schema/emailTemplates";
import { eq, and } from "drizzle-orm";
import * as brevoService from "./brevoService";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface TemplateContext {
  [key: string]: any;
}

// Cache for email transporter
let emailTransporter: Transporter | null = null;
let emailTransporterLastFetch: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for from email
let cachedFromEmail: string | null = null;
let fromEmailLastFetch: number = 0;

// Brevo specific types
type EmailProvider = "smtp" | "brevo";

/**
 * Gets the configured "from" email address.
 * Priority: DB provider settings → DEFAULT_FROM_EMAIL env var → fallback
 * Cached for 5 minutes to avoid repeated DB queries.
 */
export async function getFromEmail(): Promise<string> {
  const now = Date.now();
  if (cachedFromEmail && now - fromEmailLastFetch < CACHE_TTL) {
    return cachedFromEmail;
  }

  try {
    const provider = await getEmailProvider();
    const fromAddr = (provider.settings as any)?.from;
    if (fromAddr) {
      cachedFromEmail = fromAddr;
      fromEmailLastFetch = now;
      return fromAddr;
    }
  } catch {
    // Provider not configured yet — fall through
  }

  const fallback = process.env.DEFAULT_FROM_EMAIL || "no-reply@kickdeck.xyz";
  cachedFromEmail = fallback;
  fromEmailLastFetch = now;
  return fallback;
}

/**
 * Gets the formatted "From" header: "KickDeck <from@email.com>"
 */
export async function getFormattedFrom(): Promise<string> {
  const email = await getFromEmail();
  return `KickDeck <${email}>`;
}

/**
 * Gets the configured email provider settings, prioritizing Brevo as the primary provider
 * First checks the database, then falls back to Brevo environment variables
 */
async function getEmailProvider() {
  try {
    // First, check if there's a Brevo provider in the database
    const brevoProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(
        and(
          eq(emailProviderSettings.providerType, "brevo"),
          eq(emailProviderSettings.isActive, true),
        ),
      );

    // If we have an active Brevo provider, use it
    if (brevoProviders.length > 0) {
      // Prefer the default provider if there are multiple
      const defaultProvider = brevoProviders.find((p) => p.isDefault);
      return defaultProvider || brevoProviders[0];
    }

    // If no Brevo provider in database, use environment variables
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      console.log("Using Brevo API key from environment variables");

      // Create a Brevo provider from environment variables
      return {
        id: 0,
        providerType: "brevo" as EmailProvider,
        providerName: "Brevo Provider",
        settings: {
          apiKey: brevoApiKey,
          from: process.env.DEFAULT_FROM_EMAIL || "no-reply@kickdeck.xyz",
        },
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Brevo is not available - this is an error as we require Brevo
    throw new Error(
      "Brevo is not configured. Please set BREVO_API_KEY in environment variables.",
    );
  } catch (error) {
    console.error("Error getting email provider:", error);
    throw error;
  }
}

/**
 * Gets and caches an email transporter based on the configured provider
 */
async function getEmailTransporter(): Promise<Transporter> {
  const now = Date.now();

  // Return cached transporter if valid
  if (emailTransporter && now - emailTransporterLastFetch < CACHE_TTL) {
    return emailTransporter;
  }

  try {
    const provider = await getEmailProvider();

    if (provider.providerType === "smtp") {
      const { host, port, username, password, secure } =
        provider.settings as any;

      emailTransporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === "true",
        auth: {
          user: username,
          pass: password,
        },
      });
    } else if (provider.providerType === "brevo") {
      // For Brevo, we return a dummy transporter that will be overridden
      // by Brevo-specific methods later
      const { apiKey } = provider.settings as any;

      // Make sure the Brevo API key is valid
      if (!apiKey) {
        throw new Error("Missing Brevo API key in provider settings");
      }

      // Create a "dummy" nodemailer transport using Brevo's SMTP relay
      // We'll bypass this by using Brevo's REST API directly in the sendEmail function
      emailTransporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_LOGIN || "apikey",
          pass: apiKey,
        },
      });

      // We don't need to explicitly set the API key here as it's handled in the brevoService
    } else {
      throw new Error(
        `Unsupported email provider type: ${provider.providerType}`,
      );
    }

    emailTransporterLastFetch = now;
    return emailTransporter;
  } catch (error) {
    console.error("Error creating email transporter:", error);
    throw error;
  }
}

/**
 * Gets an email template by type
 * @param type The template type to fetch
 * @param throwIfNotFound Whether to throw an error if template not found (default: false)
 * @returns The template or null if not found and throwIfNotFound is false
 */
async function getEmailTemplate(type: string, throwIfNotFound = false) {
  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(eq(emailTemplates.type, type), eq(emailTemplates.isActive, true)),
      );

    if (!template) {
      if (throwIfNotFound) {
        throw new Error(`No active template found for type: ${type}`);
      }
      console.warn(
        `No active template found for type: ${type}, using fallback`,
      );
      return null;
    }

    return template;
  } catch (error) {
    console.error(`Error getting email template for type ${type}:`, error);
    if (throwIfNotFound) {
      throw error;
    }
    return null;
  }
}

/**
 * Renders a template with context variables
 */
function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    // Direct key lookup
    if (context[trimmedKey] !== undefined) return context[trimmedKey];
    // Handle Brevo-style "params.KEY" — strip prefix and retry
    if (trimmedKey.startsWith('params.')) {
      const stripped = trimmedKey.slice(7);
      if (context[stripped] !== undefined) return context[stripped];
    }
    return match;
  });
}

/**
 * Generates plain text content from HTML for better email deliverability
 */
function generateTextFromHtml(html: string, context: TemplateContext): string {
  // For password reset specifically, create a clean text version
  if (context.resetUrl && context.username) {
    return `Hello ${context.username},

We received a request to reset your password for your KickDeck account.

To reset your password, please visit this link:
${context.resetUrl}

This link will expire in ${context.expiryHours || 24} hours.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
KickDeck Support Team
no-reply@kickdeck.xyz`;
  }

  // General HTML to text conversion (basic)
  let text = html
    .replace(/<style[^>]*>.*?<\/style>/gis, "") // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gis, "") // Remove script tags
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Replace &amp; with &
    .replace(/&lt;/g, "<") // Replace &lt; with <
    .replace(/&gt;/g, ">") // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .trim();

  return (
    text ||
    "You have received a notification from KickDeck. Please check your account for more information."
  );
}

/**
 * Sends an email using the Brevo API
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    // Log the email content in development mode for debugging
    if (isDevelopment) {
      console.log("\n===== DEVELOPMENT MODE: EMAIL CONTENT =====");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`From: ${options.from || "default-sender"}`);
      console.log("Content:");
      console.log(options.html);
      console.log("=============================================\n");
      // Still proceed to send the email - don't return early
    }

    // Get the Brevo provider
    const provider = await getEmailProvider();
    console.log(`[Email] Provider resolved: ${provider.providerType || 'unknown'}, API key present: ${!!process.env.BREVO_API_KEY}`);

    // Use Brevo to send the email
    const from =
      options.from ||
      `KickDeck <${(provider.settings as any).from || await getFromEmail()}>`;

    console.log(`[Email] Sending via Brevo: to=${options.to}, from=${from}, subject="${options.subject}"`);

    const result = await brevoService.sendEmail({
      to: options.to,
      from: from,
      subject: options.subject,
      html:
        options.html ||
        "<p>Please view this email in a compatible email client.</p>",
      text:
        options.text || "Please view this email in a compatible email client.",
    });

    if (result) {
      console.log(`✅ EMAIL SENT: ${options.subject} → ${options.to}`);
    } else {
      throw new Error("Failed to send email via Brevo — brevoService.sendEmail() returned false");
    }
  } catch (error) {
    console.error("Error sending email:", error);

    if (isDevelopment) {
      // In development, still log but don't throw
      console.log("Email sending failed, but continuing in development mode");
      console.error(error);
      return;
    }

    // In production, log error but don't crash the application
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send email to ${options.to}: ${errorMessage}`);

    // Don't rethrow the error in production as this could interrupt important flows
    // such as payment processing or user registration just because an email failed
  }
}

/**
 * Sends a templated email using a specific template type
 * If the template has a Brevo template ID, it will use Brevo dynamic templates.
 * Otherwise, it will render the template locally and send it as a regular email.
 */

export async function sendTemplatedEmail(
  to: string,
  templateType: string,
  context: TemplateContext,
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    // First get the email template using the updated non-throwing version
    const template = await getEmailTemplate(templateType, false);

    // If no template found, use a fallback
    const emailTemplate =
      template || createFallbackTemplate(templateType, context, isDevelopment);

    // At this point emailTemplate is guaranteed to exist because createFallbackTemplate always returns a value
    if (!emailTemplate || !emailTemplate.subject || !emailTemplate.content) {
      throw new Error(
        `Failed to generate a valid email template for ${templateType}`,
      );
    }

    try {
      // Check if we should use Brevo Dynamic Templates
      const numericTemplateId = emailTemplate.brevoTemplateId
        ? parseInt(String(emailTemplate.brevoTemplateId), 10)
        : NaN;
      const useBrevoTemplate = emailTemplate.brevoTemplateId && !isNaN(numericTemplateId);

      // Determine the correct sender: use the template's senderEmail (kept in sync by
      // the seed migration) so account emails come from support@ and event emails from no-reply@.
      // Fall back to getFromEmail() only if the template has no senderEmail stored.
      const senderAddr = emailTemplate.senderEmail || await getFromEmail();
      const senderName = emailTemplate.senderName || 'KickDeck';
      const fromAddress = `${senderName} <${senderAddr}>`;

      if (useBrevoTemplate) {
        console.log(
          `Using Brevo dynamic template for ${templateType} (ID: ${numericTemplateId}), from: ${fromAddress}`,
        );

        // Use Brevo dynamic template
        const result = await brevoService.sendDynamicTemplateEmail({
          to,
          from: fromAddress,
          templateId: numericTemplateId,
          params: context,
        });

        if (result) {
          console.log(
            `✅ TEMPLATE EMAIL SENT: ${templateType} → ${to} (Brevo ID: ${numericTemplateId})`,
          );
        } else {
          throw new Error(
            `Failed to send Brevo dynamic template email to ${to}`,
          );
        }
      } else {
        // Use regular template rendering (local HTML + Brevo transactional API)
        if (emailTemplate.brevoTemplateId && isNaN(numericTemplateId)) {
          console.warn(`Invalid Brevo template ID "${emailTemplate.brevoTemplateId}" for ${templateType} — falling back to local render.`);
        }
        console.log(`Sending ${templateType} email to ${to} via local render + Brevo transactional API`);

        const subject =
          renderTemplate(emailTemplate.subject, context) || "Notification";
        let html = renderTemplate(emailTemplate.content, context);

        // Ensure html is never empty or undefined
        if (!html || html.trim() === "") {
          html =
            "<p>You have received a notification from KickDeck. Please check your account for more information.</p>";
        }

        // Generate text version for better deliverability
        let text: string;
        if (
          emailTemplate &&
          "textContent" in emailTemplate &&
          emailTemplate.textContent
        ) {
          text = renderTemplate(emailTemplate.textContent, context);
        } else {
          // Auto-generate text from HTML if no text template exists
          text = generateTextFromHtml(html, context);
        }

        await sendEmail({
          to,
          subject,
          html,
          text,
          from: fromAddress,
        });

        console.log(`✅ TEMPLATE EMAIL SENT: ${templateType} → ${to} (local render)`);
      }
    } catch (renderError) {
      console.error(
        `Error rendering or sending email (${templateType}):`,
        renderError,
      );

      // In production, provide detailed error information for debugging
      if (process.env.NODE_ENV === "production") {
        console.error(`PRODUCTION EMAIL ERROR DETAILS:`);
        console.error(`Template Type: ${templateType}`);
        console.error(`Recipient: ${to}`);
        console.error(`Error Stack:`, renderError);

        // Log the specific error type to help with debugging
        if (
          renderError &&
          typeof renderError === "object" &&
          "response" in renderError
        ) {
          const apiError = renderError as {
            response: { body: any; status?: number };
          };
          console.error(`Brevo Error Status:`, apiError.response?.status);
          console.error(`Brevo Error Body:`, apiError.response?.body);
        }
      }

      // Don't throw here to prevent API failures, but ensure errors are visible
    }
  } catch (error) {
    console.error(
      `Unexpected error in sendTemplatedEmail (${templateType}):`,
      error,
    );

    // In production, provide comprehensive error logging
    if (process.env.NODE_ENV === "production") {
      console.error(`PRODUCTION EMAIL SERVICE ERROR:`);
      console.error(`Template Type: ${templateType}`);
      console.error(`Recipient: ${to}`);
      console.error(`Error Stack:`, error);

      // Check if it's a database/template error
      if (error && typeof error === "object" && "message" in error) {
        console.error(`Error Message: ${error.message}`);
      }
    }

    // Always log but never throw to keep API endpoints working
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send templated email to ${to}: ${errorMessage}`);
  }
}

/**
 * Creates a fallback template when a requested template is not found
 */
function createFallbackTemplate(
  templateType: string,
  context: TemplateContext,
  isDevelopment: boolean,
) {
  if (isDevelopment) {
    // In development, use a more detailed debug template
    console.log(
      `Using detailed development fallback template for ${templateType}`,
    );
    return {
      subject: `[DEV MODE] ${templateType} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Development Mode - Template Missing</h2>
          <p>This is a development placeholder for the <strong>${templateType}</strong> template which was not found in the database.</p>
          <h3>Context Data:</h3>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${JSON.stringify(context, null, 2)}</pre>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This template was generated automatically as a fallback in development mode.</p>
        </div>
      `,
      senderName: "KickDeck",
      senderEmail: cachedFromEmail || process.env.DEFAULT_FROM_EMAIL || "no-reply@kickdeck.xyz",
      isActive: true,
      type: templateType,
      providerId: null,
      brevoTemplateId: null,
    };
  } else {
    // In production, use a generic professional template
    console.log(
      `Using generic production fallback template for ${templateType}`,
    );
    return {
      subject: `${templateType.replace(/_/g, " ")} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Team Registration Update</h2>
          <p>This is a notification regarding your team registration status.</p>
          <p>Please check your dashboard for more details.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated notification.</p>
        </div>
      `,
      senderName: "KickDeck",
      senderEmail: cachedFromEmail || process.env.DEFAULT_FROM_EMAIL || "no-reply@kickdeck.xyz",
      isActive: true,
      type: templateType,
      providerId: null,
      brevoTemplateId: null,
    };
  }
}

/**
 * Helper function to get the application URL for email links
 */
function getAppUrl(
  isDevelopment: boolean = process.env.NODE_ENV !== "production",
): string {
  if (isDevelopment) {
    // Development environment - use local domain
    return (
      process.env.APP_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`
    );
  } else {
    // Production environment - use correct production domain
    return "https://app.kickdeck.io";
  }
}

/**
 * Sends a registration receipt email with transaction details
 */
export async function sendRegistrationReceiptEmail(
  to: string,
  teamData: any, // Team registration data
  paymentData: any, // Payment transaction data
  eventName: string,
  eventAdminEmail?: string,
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;

    // Format numbers and dates consistently
    const formatCurrency = (amount: number) => {
      return (amount / 100).toFixed(2);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Format payment date if it exists
    const paymentDate = paymentData?.paymentDate || teamData?.paymentDate;
    const formattedPaymentDate = paymentDate ? formatDate(paymentDate) : "";

    // Format selected fees if they exist
    let selectedFees: any[] = [];
    if (teamData.selectedFeeIds) {
      // This would normally be populated by a database query to get fee details
      // This is a placeholder - actual implementation would fetch fee info
      selectedFees = [
        {
          name: "Registration Fee",
          amount: formatCurrency(
            teamData.totalAmount || teamData.registrationFee || 0,
          ),
        },
      ];
    }

    // Prepare template context data
    const context = {
      teamName: teamData.name || "Team Registration",
      eventName: eventName || "Event Registration",
      submitterName: teamData.submitterName || teamData.managerName || "",
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || "",
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(
        teamData.totalAmount || teamData.registrationFee || 0,
      ),
      paymentStatus: paymentData?.status || teamData.paymentStatus || "pending",
      paymentDate: formattedPaymentDate,
      paymentMethod: paymentData?.paymentMethodType || "card",
      cardLastFour: paymentData?.cardLastFour || teamData.cardLastFour || "",
      cardBrand: paymentData?.cardBrand || teamData.cardBrand || "",
      paymentId: paymentData?.paymentIntentId || teamData.paymentIntentId || "",
      selectedFees: selectedFees,
      loginLink: loginLink,
      clubName: teamData.clubName || "",
      currentYear: new Date().getFullYear(),
      EVENT_ADMIN_EMAIL: eventAdminEmail || 'support@kickdeck.xyz',
    };

    // Send the email using the registration_receipt template
    await sendTemplatedEmail(to, "registration_receipt", context);

    console.log(`Registration receipt email sent to ${to}`);
  } catch (error) {
    console.error("Error sending registration receipt email:", error);

    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }

    // In production, log error but don't crash the application
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send registration receipt email to ${to}: ${errorMessage}`,
    );
  }
}

/**
 * Sends a registration confirmation email for setup intent payment workflow
 * This is sent when a team submits registration with payment method saved but not charged yet
 */
export async function sendRegistrationConfirmationEmail(
  to: string,
  teamData: any, // Team registration data
  eventData: any, // Event information
  ageGroupData?: any, // Age group information
  bracketData?: any, // Bracket information
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;

    // Format numbers and dates consistently
    const formatCurrency = (amount: number) => {
      if (!amount) return "0.00";
      return (amount / 100).toFixed(2);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Parse coach data if it's a JSON string
    let headCoachName = "";
    if (teamData.coach) {
      try {
        const coachData =
          typeof teamData.coach === "string"
            ? JSON.parse(teamData.coach)
            : teamData.coach;
        headCoachName = coachData.headCoachName || "";
      } catch (e) {
        console.log("Could not parse coach data, using as string");
        headCoachName = teamData.coach;
      }
    }

    // Format selected fees if they exist
    let selectedFees: any[] = [];
    if (teamData.selectedFeeIds && teamData.selectedFeeIds.length > 0) {
      // This would normally be populated by a database query to get fee details
      // For now, we'll create a basic fee entry based on the total amount
      selectedFees = [
        {
          name: "Registration Fee",
          amount: formatCurrency(
            teamData.totalAmount || teamData.registrationFee || 0,
          ),
        },
      ];
    }

    // Prepare template context data
    const context = {
      teamName: teamData.name || "Team Registration",
      eventName: eventData?.name || "Event Registration",
      ageGroup: ageGroupData?.ageGroup || ageGroupData?.name || "Age Group",
      bracket: bracketData?.name || "",
      clubName: teamData.clubName || "",
      submitterName: teamData.submitterName || teamData.managerName || "",
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || "",
      headCoachName: headCoachName,
      managerName: teamData.managerName || "",
      managerEmail: teamData.managerEmail || "",
      managerPhone: teamData.managerPhone || "",
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(
        teamData.totalAmount || teamData.registrationFee || 0,
      ),
      selectedFees: selectedFees,
      cardBrand: teamData.cardBrand || "Card",
      cardLastFour: teamData.cardLast4 || teamData.cardLastFour || "****",
      setupIntentId: teamData.setupIntentId || "",
      addRosterLater: teamData.addRosterLater || false,
      loginLink: loginLink,
      supportEmail: cachedFromEmail || process.env.DEFAULT_FROM_EMAIL || "no-reply@kickdeck.xyz",
      organizationName: "KickDeck",
      currentYear: new Date().getFullYear(),
      EVENT_ADMIN_EMAIL: eventData?.adminEmail || 'support@kickdeck.xyz',
    };

    // Send the email using the registration_confirmation template
    await sendTemplatedEmail(to, "registration_confirmation", context);

    console.log(`Registration confirmation email sent to ${to}`);
  } catch (error) {
    console.error("Error sending registration confirmation email:", error);

    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }

    // In production, log error but don't crash the application
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send registration confirmation email to ${to}: ${errorMessage}`,
    );
  }
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  username: string,
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    const appUrl = getAppUrl(isDevelopment);
    console.log(`Using URL for password reset: ${appUrl}`);

    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    if (process.env.BREVO_API_KEY) {
      console.log("Brevo API key found, configuring mail service");
    } else {
      console.log("Brevo API key not found");
    }

    await sendTemplatedEmail(to, "password_reset", {
      username,
      resetUrl,
      token: resetToken,
      expiryHours: 24, // Token validity period
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);

    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }

    // In production, log error but don't crash the application
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send password reset email to ${to}: ${errorMessage}`,
    );
  }
}

/**
 * Sends a newsletter subscription confirmation email
 */
export async function sendNewsletterConfirmationEmail(
  to: string,
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    const appUrl = getAppUrl(isDevelopment);
    const unsubscribeLink = `${appUrl}/newsletter/unsubscribe?email=${encodeURIComponent(to)}`;

    // Prepare template context data
    const context = {
      email: to,
      unsubscribeLink,
      appUrl,
      subscriptionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    await sendTemplatedEmail(to, "newsletter_confirmation", context);
  } catch (error) {
    console.error("Error sending newsletter confirmation email:", error);

    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }

    // In production, log error but don't crash the application
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send newsletter confirmation email to ${to}: ${errorMessage}`,
    );
  }
}
