import { sql } from 'drizzle-orm';
import { db } from '../index';

// ── Shared email styles ──────────────────────────────────────────────────────
// We reuse a consistent look across all templates.  Each template constant
// below is a self-contained HTML document so local rendering just needs
// {{variable}} replacement.  The same variables are sent as `params` when
// a Brevo dynamic template ID is configured.

const BASE_STYLES = `
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
.header h1 { color: white; margin: 0; font-size: 22px; }
.content { padding: 24px 20px; background-color: #ffffff; }
.content p { margin: 0 0 14px 0; }
.button { display: inline-block; color: white !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; margin-top: 8px; font-weight: bold; font-size: 15px; }
.info-box { background-color: #f0f4ff; border: 1px solid #d0d8f0; border-radius: 6px; padding: 16px; margin: 16px 0; }
.info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
.info-label { color: #555; }
.info-value { font-weight: 600; }
.notice { border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px; }
.notice-warning { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; }
.notice-info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
.notice-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
.footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
.footer a { color: #666; }
.dual-contact { background-color: #f9f9f9; border-top: 1px solid #eee; padding: 16px 20px; text-align: center; font-size: 13px; color: #666; }
.dual-contact a { color: #4A7BF7; }
`;

function wrap(headerColor: string, title: string, body: string, opts: { dualContact?: boolean } = {}) {
  const dualContactBlock = opts.dualContact ? `
    <div class="dual-contact">
      <p style="margin:0 0 4px 0;">Event questions: <a href="mailto:{{EVENT_ADMIN_EMAIL}}">{{EVENT_ADMIN_EMAIL}}</a></p>
      <p style="margin:0;">Technical support: <a href="mailto:support@kickdeck.xyz">support@kickdeck.xyz</a></p>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: ${headerColor};">
      <h1>${title}</h1>
    </div>
    <div class="content">
${body}
    </div>${dualContactBlock}
    <div class="footer">
      <p>This is an automated message from KickDeck. Please do not reply to this email.</p>
      <p>&copy; {{currentYear}} KickDeck &bull; <a href="https://app.kickdeck.xyz">app.kickdeck.xyz</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── PASSWORD RESET ───────────────────────────────────────────────────────────
const PASSWORD_RESET_HTML = wrap('#4A154B', 'Password Reset', `
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button" style="background-color: #4A154B;">Reset Password</a>
      </p>
      <p>Or copy and paste the following URL into your browser:</p>
      <div style="background-color: #eee; padding: 10px; border-radius: 4px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 13px;">{{resetUrl}}</div>
      <div class="notice notice-warning">
        <strong>Note:</strong> This link will expire in {{expiryHours}} hours.
      </div>
      <p>Thank you,<br>The KickDeck Team</p>`);

// ── WELCOME ──────────────────────────────────────────────────────────────────
const WELCOME_HTML = wrap('#2C5282', 'Welcome to KickDeck!', `
      <p>Hello {{firstName}},</p>
      <p>Welcome to KickDeck! We're excited to have you join our sports management platform.</p>
      <p>Your account has been successfully created:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Username:</td><td style="font-weight:600;">{{username}}</td></tr>
          <tr><td style="color:#555;">Email:</td><td style="font-weight:600;">{{email}}</td></tr>
        </table>
      </div>
      <p>With your KickDeck account, you can register teams for tournaments, manage player information, and track your tournament schedules.</p>
      <p>Thank you,<br>The KickDeck Team</p>`);

// ── ADMIN WELCOME ────────────────────────────────────────────────────────────
const ADMIN_WELCOME_HTML = wrap('#1a365d', 'Welcome to KickDeck Admin', `
      <p>Hello {{firstName}},</p>
      <p>You've been set up as an <strong>{{role}}</strong> on KickDeck. You now have access to the admin dashboard where you can manage events, teams, and registrations.</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Name:</td><td style="font-weight:600;">{{firstName}} {{lastName}}</td></tr>
          <tr><td style="color:#555;">Email:</td><td style="font-weight:600;">{{email}}</td></tr>
          <tr><td style="color:#555;">Role:</td><td style="font-weight:600;">{{role}}</td></tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="{{loginUrl}}" class="button" style="background-color: #1a365d;">Log In to Dashboard</a>
      </p>
      <p>If you didn't expect this invitation, please ignore this email or contact us at <a href="mailto:support@kickdeck.xyz">support@kickdeck.xyz</a>.</p>
      <p>Thank you,<br>The KickDeck Team</p>`);

// ── REGISTRATION CONFIRMATION (setup intent — card saved, not yet charged) ──
const REGISTRATION_CONFIRMATION_HTML = wrap('#2B6CB0', 'Registration Received', `
      <p>Hello {{firstName}},</p>
      <p>We've received your team registration. Here's a summary of what you submitted:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Submitted:</td><td style="font-weight:600;">{{registrationDate}}</td></tr>
          <tr><td style="color:#555;">Card on File:</td><td style="font-weight:600;">{{cardBrand}} ending in {{cardLastFour}}</td></tr>
        </table>
      </div>
      <div class="notice notice-info">
        <strong>What happens next?</strong> The event organizer will review your registration. Once approved, your card on file will be charged and you'll receive a confirmation email.
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #2B6CB0;">View Your Dashboard</a>
      </p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── REGISTRATION RECEIPT (payment already processed) ─────────────────────────
const REGISTRATION_RECEIPT_HTML = wrap('#2B6CB0', 'Registration Confirmation', `
      <p>Hello {{firstName}},</p>
      <p>Your team registration and payment have been processed. Here are the details:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Registration Date:</td><td style="font-weight:600;">{{registrationDate}}</td></tr>
        </table>
      </div>
      <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Amount Paid:</td><td style="font-weight:700; color: #276749;">{{totalAmount}}</td></tr>
          <tr><td style="color:#555;">Payment Status:</td><td style="font-weight:600;">{{paymentStatus}}</td></tr>
          <tr><td style="color:#555;">Payment Date:</td><td style="font-weight:600;">{{paymentDate}}</td></tr>
          <tr><td style="color:#555;">Card:</td><td style="font-weight:600;">{{cardBrand}} ending in {{cardLastFour}}</td></tr>
          <tr><td style="color:#555;">Transaction ID:</td><td style="font-weight:600; font-size:12px; font-family:monospace;">{{paymentId}}</td></tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #2B6CB0;">View Your Dashboard</a>
      </p>
      <p>Thank you for registering!<br>The KickDeck Team</p>`, { dualContact: true });

// ── REGISTRATION UNDER REVIEW ────────────────────────────────────────────────
const REGISTRATION_UNDER_REVIEW_HTML = wrap('#805AD5', 'Registration Under Review', `
      <p>Hello {{firstName}},</p>
      <p>Your registration for <strong>{{teamName}}</strong> in <strong>{{eventName}}</strong> is currently under review by the event organizer.</p>
      <div class="notice notice-info">
        <strong>No action needed right now.</strong> You'll receive an email once your registration status is updated. This typically takes 1–3 business days.
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #805AD5;">View Your Dashboard</a>
      </p>
      <p>Thank you for your patience,<br>The KickDeck Team</p>`, { dualContact: true });

// ── REGISTRATION PAY LATER ──────────────────────────────────────────────────
const REGISTRATION_PAY_LATER_HTML = wrap('#B7791F', 'Registration Received — Payment Pending', `
      <p>Hello {{firstName}},</p>
      <p>We've received your team registration. You selected <strong>Pay Later</strong> as your payment option.</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Division:</td><td style="font-weight:600;">{{division}}</td></tr>
          <tr><td style="color:#555;">Submitted:</td><td style="font-weight:600;">{{registrationDate}}</td></tr>
        </table>
      </div>
      <div class="notice notice-warning">
        <strong>Payment of {{totalAmount}} is still due.</strong> The event organizer will send you a payment link. Please complete payment before the event to secure your spot.
      </div>
      <div class="notice notice-info">
        <strong>What happens next?</strong> Once your payment is received, the event organizer will review and approve your registration. You'll receive a confirmation email at each step.
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #B7791F;">View Your Dashboard</a>
      </p>
      <p>Thank you for registering,<br>The KickDeck Team</p>`, { dualContact: true });

// ── PAYMENT CONFIRMATION ─────────────────────────────────────────────────────
const PAYMENT_CONFIRMATION_HTML = wrap('#276749', 'Payment Received', `
      <p>We've received your payment. Here are the details:</p>
      <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Amount:</td><td style="font-weight:700; color: #276749;">{{amount}}</td></tr>
          <tr><td style="color:#555;">Receipt #:</td><td style="font-weight:600; font-family:monospace;">{{receiptNumber}}</td></tr>
          <tr><td style="color:#555;">Payment ID:</td><td style="font-weight:600; font-size:12px; font-family:monospace;">{{paymentId}}</td></tr>
        </table>
      </div>
      <div class="notice notice-success">
        Your payment has been confirmed. Keep this email for your records.
      </div>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── PAYMENT COMPLETION NOTIFICATION ──────────────────────────────────────────
// NOTE: payment-completion.ts builds its own inline HTML and passes it directly,
// so this template is only used as a fallback if the route ever calls sendTemplatedEmail
// the standard way.
const PAYMENT_COMPLETION_NOTIFICATION_HTML = wrap('#276749', 'Payment Complete', `
      <p>Hello,</p>
      <p>Your payment for <strong>{{teamName}}</strong> in <strong>{{eventName}}</strong> has been completed successfully.</p>
      <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Amount:</td><td style="font-weight:700; color: #276749;">{{totalAmount}}</td></tr>
        </table>
      </div>
      <p>Your team's registration is now fully processed. You'll receive updates about the event as they become available.</p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── PAYMENT REFUNDED ─────────────────────────────────────────────────────────
const PAYMENT_REFUNDED_HTML = wrap('#C05621', 'Payment Refunded', `
      <p>Hello,</p>
      <p>A refund has been processed for your registration:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Refund Amount:</td><td style="font-weight:700; color: #C05621;">{{amount}}</td></tr>
        </table>
      </div>
      <div class="notice notice-info">
        Refunds typically appear on your statement within 5–10 business days, depending on your bank.
      </div>
      <p>If you have any questions about this refund, please contact the event organizer.</p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM APPROVED ────────────────────────────────────────────────────────────
const TEAM_APPROVED_HTML = wrap('#276749', 'Team Approved!', `
      <p>Great news! Your team has been approved for the event.</p>
      <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Approved On:</td><td style="font-weight:600;">{{approvalDate}}</td></tr>
        </table>
      </div>
      <div class="notice notice-success">
        <strong>You're all set!</strong> Tournament schedules and further updates will be sent to your email as they become available.
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #276749;">View Your Dashboard</a>
      </p>
      <p>Thank you for registering,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM APPROVED WITH PAYMENT ───────────────────────────────────────────────
const TEAM_APPROVED_WITH_PAYMENT_HTML = wrap('#276749', 'Team Approved — Payment Processed', `
      <p>Great news! Your team has been approved and your payment has been processed.</p>
      <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Approved On:</td><td style="font-weight:600;">{{approvalDate}}</td></tr>
          <tr><td style="color:#555;">Amount Charged:</td><td style="font-weight:700; color: #276749;">{{totalAmount}}</td></tr>
          <tr><td style="color:#555;">Card:</td><td style="font-weight:600;">{{cardBrand}} ending in {{cardLastFour}}</td></tr>
        </table>
      </div>
      <div class="notice notice-success">
        <strong>You're all set!</strong> Your registration is complete. Tournament schedules and further updates will be sent to your email.
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #276749;">View Your Dashboard</a>
      </p>
      <p>Thank you for registering,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM REJECTED ────────────────────────────────────────────────────────────
const TEAM_REJECTED_HTML = wrap('#9B2C2C', 'Registration Update', `
      <p>Hello,</p>
      <p>We're writing to let you know that your team registration was not approved.</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
        </table>
      </div>
      <div class="notice notice-warning">
        If your card was on file, it has <strong>not</strong> been charged. If you believe this was an error, please reach out to the event organizer.
      </div>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM WAITLISTED ──────────────────────────────────────────────────────────
const TEAM_WAITLISTED_HTML = wrap('#B7791F', 'Team Waitlisted', `
      <p>Hello,</p>
      <p>Your team has been placed on the waitlist for the following event:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
        </table>
      </div>
      <div class="notice notice-info">
        <strong>What does this mean?</strong> If a spot opens up, you'll be notified and your registration will be processed. No payment will be taken until your team is moved off the waitlist.
      </div>
      <p>Thank you for your patience,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM WITHDRAWN ───────────────────────────────────────────────────────────
const TEAM_WITHDRAWN_HTML = wrap('#718096', 'Team Withdrawn', `
      <p>Hello,</p>
      <p>Your team registration has been withdrawn from the following event:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
        </table>
      </div>
      <p>If you have questions about the withdrawal or would like to re-register, please contact the event organizer.</p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── TEAM STATUS UPDATE (generic) ─────────────────────────────────────────────
const TEAM_STATUS_UPDATE_HTML = wrap('#2B6CB0', 'Team Status Update', `
      <p>Hello,</p>
      <p>The status of your team registration has been updated:</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">New Status:</td><td style="font-weight:700;">{{status}}</td></tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="{{loginLink}}" class="button" style="background-color: #2B6CB0;">View Your Dashboard</a>
      </p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── PAYMENT FAILED ──────────────────────────────────────────────────────────
const PAYMENT_FAILED_HTML = wrap('#E53E3E', 'Payment Failed', `
      <p>Hello {{firstName}},</p>
      <p>We attempted to process payment for your team registration, but the charge was unsuccessful.</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Team:</td><td style="font-weight:600;">{{teamName}}</td></tr>
          <tr><td style="color:#555;">Event:</td><td style="font-weight:600;">{{eventName}}</td></tr>
          <tr><td style="color:#555;">Amount Due:</td><td style="font-weight:700; color: #E53E3E;">{{totalAmount}}</td></tr>
        </table>
      </div>
      <div class="notice notice-warning">
        <strong>Why did this happen?</strong> The card on file could not be charged. This can happen if the card has expired, has insufficient funds, or was flagged by your bank.
      </div>
      <p>To complete your registration, please click the button below to submit a new payment method:</p>
      <p style="text-align: center;">
        <a href="{{retryUrl}}" class="button" style="background-color: #E53E3E;">Retry Payment</a>
      </p>
      <p style="font-size: 13px; color: #666; margin-top: 16px;">Or copy and paste this link into your browser:</p>
      <div style="background-color: #eee; padding: 10px; border-radius: 4px; margin: 8px 0; word-break: break-all; font-family: monospace; font-size: 13px;">{{retryUrl}}</div>
      <div class="notice notice-info">
        <strong>What happens next?</strong> Once your payment is processed successfully, your team will be automatically approved for the tournament. No further action from the event organizer is needed.
      </div>
      <p>If you continue to experience issues, please contact the event organizer.</p>
      <p>Thank you,<br>The KickDeck Team</p>`, { dualContact: true });

// ── NEWSLETTER CONFIRMATION ──────────────────────────────────────────────────
const NEWSLETTER_CONFIRMATION_HTML = wrap('#2C5282', 'Subscription Confirmed', `
      <p>Hello,</p>
      <p>You've been subscribed to the KickDeck newsletter. You'll receive updates about tournaments, features, and announcements.</p>
      <div class="info-box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:#555;">Email:</td><td style="font-weight:600;">{{email}}</td></tr>
          <tr><td style="color:#555;">Subscribed On:</td><td style="font-weight:600;">{{subscriptionDate}}</td></tr>
        </table>
      </div>
      <p style="font-size: 13px; color: #666;">If you didn't subscribe, or would like to stop receiving these emails, you can <a href="{{unsubscribeLink}}">unsubscribe here</a>.</p>
      <p>Thank you,<br>The KickDeck Team</p>`);


// ── Lookup map for the repair query ──────────────────────────────────────────
const TEMPLATES_WITH_REAL_CONTENT: Record<string, string> = {
  password_reset: PASSWORD_RESET_HTML,
  welcome: WELCOME_HTML,
  admin_welcome: ADMIN_WELCOME_HTML,
  registration_confirmation: REGISTRATION_CONFIRMATION_HTML,
  registration_receipt: REGISTRATION_RECEIPT_HTML,
  registration_under_review: REGISTRATION_UNDER_REVIEW_HTML,
  registration_pay_later: REGISTRATION_PAY_LATER_HTML,
  payment_confirmation: PAYMENT_CONFIRMATION_HTML,
  payment_completion_notification: PAYMENT_COMPLETION_NOTIFICATION_HTML,
  payment_failed: PAYMENT_FAILED_HTML,
  payment_refunded: PAYMENT_REFUNDED_HTML,
  team_approved: TEAM_APPROVED_HTML,
  team_approved_with_payment: TEAM_APPROVED_WITH_PAYMENT_HTML,
  team_rejected: TEAM_REJECTED_HTML,
  team_waitlisted: TEAM_WAITLISTED_HTML,
  team_withdrawn: TEAM_WITHDRAWN_HTML,
  team_status_update: TEAM_STATUS_UPDATE_HTML,
  newsletter_confirmation: NEWSLETTER_CONFIRMATION_HTML,
};


/**
 * Migration to ensure all standard email template types exist.
 * Uses raw SQL to avoid Drizzle schema mismatches between
 * db/schema.ts and db/schema/emailTemplates.ts.
 */
export async function seedEmailTemplateTypes() {
  console.log('Ensuring all standard email template types exist...');

  // Account-related templates use support@kickdeck.xyz; all others use no-reply@kickdeck.xyz
  // Both are verified senders in Brevo
  const SUPPORT_EMAIL = 'support@kickdeck.xyz';
  const NOREPLY_EMAIL = 'no-reply@kickdeck.xyz';

  const standardTemplates = [
    { name: 'Welcome Email', type: 'welcome', subject: 'Welcome to KickDeck!', description: 'Sent when a new user registers', senderEmail: SUPPORT_EMAIL, content: WELCOME_HTML },
    { name: 'Admin Welcome', type: 'admin_welcome', subject: 'Welcome to KickDeck Admin', description: 'Sent when a new admin is invited', senderEmail: SUPPORT_EMAIL, content: ADMIN_WELCOME_HTML },
    { name: 'Password Reset', type: 'password_reset', subject: 'Reset Your Password', description: 'Sent when a user requests a password reset', senderEmail: SUPPORT_EMAIL, content: PASSWORD_RESET_HTML },
    { name: 'Registration Confirmation', type: 'registration_confirmation', subject: 'Registration Received — {{eventName}}', description: 'Sent when a team submits registration (setup intent flow)', senderEmail: NOREPLY_EMAIL, content: REGISTRATION_CONFIRMATION_HTML },
    { name: 'Registration Receipt', type: 'registration_receipt', subject: 'Registration Confirmation — {{eventName}}', description: 'Sent after a team registers for an event', senderEmail: NOREPLY_EMAIL, content: REGISTRATION_RECEIPT_HTML },
    { name: 'Registration Under Review', type: 'registration_under_review', subject: 'Registration Under Review — {{eventName}}', description: 'Sent when a registration is pending review', senderEmail: NOREPLY_EMAIL, content: REGISTRATION_UNDER_REVIEW_HTML },
    { name: 'Registration Pay Later', type: 'registration_pay_later', subject: 'Registration Received — Payment Pending — {{eventName}}', description: 'Sent when a team registers with Pay Later option', senderEmail: NOREPLY_EMAIL, content: REGISTRATION_PAY_LATER_HTML },
    { name: 'Payment Confirmation', type: 'payment_confirmation', subject: 'Payment Received — {{eventName}}', description: 'Sent after a successful payment', senderEmail: NOREPLY_EMAIL, content: PAYMENT_CONFIRMATION_HTML },
    { name: 'Payment Completion Notification', type: 'payment_completion_notification', subject: 'Payment Complete — {{eventName}}', description: 'Sent when full payment is completed', senderEmail: NOREPLY_EMAIL, content: PAYMENT_COMPLETION_NOTIFICATION_HTML },
    { name: 'Payment Failed', type: 'payment_failed', subject: 'Payment Failed — {{eventName}}', description: 'Sent when payment charge fails during approval', senderEmail: NOREPLY_EMAIL, content: PAYMENT_FAILED_HTML },
    { name: 'Payment Refunded', type: 'payment_refunded', subject: 'Payment Refunded — {{eventName}}', description: 'Sent when a payment is refunded', senderEmail: NOREPLY_EMAIL, content: PAYMENT_REFUNDED_HTML },
    { name: 'Team Approved', type: 'team_approved', subject: 'Team Approved — {{eventName}}', description: 'Sent when a team registration is approved', senderEmail: NOREPLY_EMAIL, content: TEAM_APPROVED_HTML },
    { name: 'Team Approved With Payment', type: 'team_approved_with_payment', subject: 'Team Approved — Payment Processed — {{eventName}}', description: 'Sent when a team is approved and payment is needed', senderEmail: NOREPLY_EMAIL, content: TEAM_APPROVED_WITH_PAYMENT_HTML },
    { name: 'Team Rejected', type: 'team_rejected', subject: 'Registration Update — {{eventName}}', description: 'Sent when a team registration is rejected', senderEmail: NOREPLY_EMAIL, content: TEAM_REJECTED_HTML },
    { name: 'Team Waitlisted', type: 'team_waitlisted', subject: 'Team Waitlisted — {{eventName}}', description: 'Sent when a team is placed on a waitlist', senderEmail: NOREPLY_EMAIL, content: TEAM_WAITLISTED_HTML },
    { name: 'Team Withdrawn', type: 'team_withdrawn', subject: 'Team Withdrawn — {{eventName}}', description: 'Sent when a team registration is withdrawn', senderEmail: NOREPLY_EMAIL, content: TEAM_WITHDRAWN_HTML },
    { name: 'Team Status Update', type: 'team_status_update', subject: 'Team Status Update — {{eventName}}', description: 'General team status change notification', senderEmail: NOREPLY_EMAIL, content: TEAM_STATUS_UPDATE_HTML },
    { name: 'Newsletter Confirmation', type: 'newsletter_confirmation', subject: 'Newsletter Subscription Confirmed', description: 'Sent when a user subscribes to the newsletter', senderEmail: NOREPLY_EMAIL, content: NEWSLETTER_CONFIRMATION_HTML },
  ];

  try {
    let insertedCount = 0;

    for (const tmpl of standardTemplates) {
      // Check if this type already exists
      const existing = await db.execute(sql`
        SELECT id FROM email_templates WHERE type = ${tmpl.type} LIMIT 1
      `);

      if (!existing.rowCount || existing.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO email_templates (name, type, subject, description, content, sender_name, sender_email, is_active, created_at, updated_at)
          VALUES (${tmpl.name}, ${tmpl.type}, ${tmpl.subject}, ${tmpl.description}, ${tmpl.content}, 'KickDeck', ${tmpl.senderEmail}, true, NOW(), NOW())
        `);
        insertedCount++;
        console.log(`  Inserted email template type: ${tmpl.type}`);
      }
    }

    if (insertedCount > 0) {
      console.log(`Seeded ${insertedCount} new email template types`);
    } else {
      console.log('All standard email template types already exist');
    }

    // ── Fix templates with placeholder content ──────────────────────────
    // If any template still has the generic placeholder, overwrite it with
    // the real HTML so local rendering works properly.
    for (const [type, html] of Object.entries(TEMPLATES_WITH_REAL_CONTENT)) {
      const result = await db.execute(sql`
        UPDATE email_templates
        SET content = ${html}, updated_at = NOW()
        WHERE type = ${type}
          AND (content = '<p>{{content}}</p>' OR content IS NULL OR content = '')
      `);
      if (result.rowCount && result.rowCount > 0) {
        console.log(`  Updated ${type} template with real HTML content`);
      }
    }

    // ── Also update subjects that were left as plain strings ────────────
    for (const tmpl of standardTemplates) {
      await db.execute(sql`
        UPDATE email_templates
        SET subject = ${tmpl.subject}, updated_at = NOW()
        WHERE type = ${tmpl.type}
          AND subject NOT LIKE '%{{%'
          AND ${tmpl.subject} LIKE '%{{%'
      `);
    }

    // ── Ensure correct verified Brevo senders ───────────────────────────
    const fixSupport = await db.execute(sql`
      UPDATE email_templates
      SET sender_email = 'support@kickdeck.xyz'
      WHERE type IN ('welcome', 'admin_welcome', 'password_reset')
        AND sender_email != 'support@kickdeck.xyz'
    `);
    if (fixSupport.rowCount && fixSupport.rowCount > 0) {
      console.log(`  Updated ${fixSupport.rowCount} account templates to use support@kickdeck.xyz`);
    }

    const fixNoreply = await db.execute(sql`
      UPDATE email_templates
      SET sender_email = 'no-reply@kickdeck.xyz'
      WHERE type NOT IN ('welcome', 'admin_welcome', 'password_reset')
        AND sender_email != 'no-reply@kickdeck.xyz'
    `);
    if (fixNoreply.rowCount && fixNoreply.rowCount > 0) {
      console.log(`  Updated ${fixNoreply.rowCount} event templates to use no-reply@kickdeck.xyz`);
    }
  } catch (error) {
    console.error('Error seeding email template types:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailTemplateTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
