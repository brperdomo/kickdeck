import { Request, Response } from 'express';
import { initiatePasswordReset, resetPassword } from '../services/passwordResetService';

/**
 * Request a password reset
 * This endpoint accepts an email address and sends a reset link if the user exists
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    // Initiate the password reset process
    try {
      await initiatePasswordReset(email);
    } catch (emailError) {
      // Log the error but continue - we don't want to expose if the email failed
      // This prevents user enumeration
      console.error('Email sending failed but continuing:', emailError);
    }
    
    // Always return success to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
}

/**
 * Verify a password reset token
 * This endpoint checks if a token is valid without using it
 */
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }
    
    // The resetPassword service validates the token and returns the user id
    const userId = await resetPassword(token, '');
    
    return res.status(200).json({
      success: !!userId,
      valid: !!userId
    });
  } catch (error) {
    console.error('Error in verifyResetToken:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the token'
    });
  }
}

/**
 * Complete the password reset process
 * This endpoint sets a new password if the token is valid
 */
export async function completePasswordReset(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Reset the password
    const success = await resetPassword(token, newPassword);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    console.error('Error in completePasswordReset:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password'
    });
  }
}