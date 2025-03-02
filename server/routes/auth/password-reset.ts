import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
// import { emailService } from "../../services/email-service";  Removed as per changes
import { getEmailTemplate } from "../../services/email-service";


const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (foundUsers.length === 0) {
      // Don't reveal if the email exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent' 
      });
    }

    const user = foundUsers[0];

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 1); // Token expires in 1 hour

    // Update user with reset token and expiration
    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresDate.toISOString(),
      })
      .where(eq(users.id, user.id));

    // Get the email template for password reset
    const template = await getEmailTemplate('password_reset');

    // Create reset URL
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Prepare email content
    let emailContent = template?.content || `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Replace placeholders if they exist in the template
    emailContent = emailContent
      .replace(/\{resetUrl\}/g, resetUrl)
      .replace(/\{username\}/g, user.username || user.email)
      .replace(/\{email\}/g, user.email);

    // Send email using nodemailer directly since it's already initialized
    const { transporter } = await import("../../services/email-service");
    await transporter.sendMail({
      to: user.email,
      subject: template?.subject || 'Password Reset Request',
      html: emailContent,
      from: template?.senderName ? `${template.senderName} <${template.senderEmail}>` : undefined
    });


    // For development: log the token and reset URL in a VERY VISIBLE way
    console.log(`\n=============== PASSWORD RESET TOKEN ===============`);
    console.log(`Password reset requested for ${user.email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Use the token in the URL: ${resetUrl}`);
    console.log(`Token expires: ${expiresDate}`);
    console.log(`====================================================\n`);

    return res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

export default router;
import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { z } from "zod";
import { hashPassword } from "../../auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { emailService } from "../../services/email-service";

const router = Router();

// Token storage - in a production app, this would be in a database
// Maps token to {userId, expiresAt}
const passwordResetTokens = new Map<string, { userId: number, expiresAt: Date }>();

// Request password reset schema
const requestResetSchema = z.object({
  email: z.string().email(),
});

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

// Request password reset
router.post("/request", async (req, res) => {
  try {
    const { email } = requestResetSchema.parse(req.body);
    
    // Find user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });

    if (!user) {
      // Don't reveal if the email exists or not for security
      return res.json({ 
        ok: true,
        message: "If your email exists in our system, you will receive a password reset link." 
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Store token with expiry (1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    passwordResetTokens.set(token, {
      userId: user.id,
      expiresAt
    });

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5000"}/reset-password?token=${token}`;
    
    // Send email with reset link
    await emailService.sendPasswordResetEmail(user.email, {
      firstName: user.firstName,
      resetLink
    });

    res.json({ 
      ok: true,
      message: "If your email exists in our system, you will receive a password reset link." 
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Password reset request failed" });
  }
});

// Reset password
router.post("/reset", async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    // Check if token exists and is valid
    const tokenData = passwordResetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({ 
        ok: false,
        message: "Invalid or expired token" 
      });
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ 
        ok: false,
        message: "Token has expired" 
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, tokenData.userId));

    // Remove used token
    passwordResetTokens.delete(token);

    res.json({ 
      ok: true,
      message: "Password has been reset successfully" 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Password reset failed" });
  }
});

export default router;
