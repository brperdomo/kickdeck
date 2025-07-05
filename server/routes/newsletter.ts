import { Request, Response } from 'express';
import { db } from '../../db';
import { newsletterSubscriptions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendNewsletterConfirmationEmail } from '../services/emailService';

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(req: Request, res: Response) {
  try {
    const { email, source = 'website' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      });
    }

    // Check if email already exists
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email))
      .limit(1);

    if (existingSubscription.length > 0) {
      const subscription = existingSubscription[0];
      
      if (subscription.isActive) {
        return res.status(200).json({ 
          success: true, 
          message: 'You are already subscribed to our newsletter',
          alreadySubscribed: true
        });
      } else {
        // Reactivate inactive subscription
        await db
          .update(newsletterSubscriptions)
          .set({ 
            isActive: true, 
            subscribedAt: new Date(),
            confirmationSent: false,
            confirmationSentAt: null
          })
          .where(eq(newsletterSubscriptions.id, subscription.id));
      }
    } else {
      // Create new subscription
      await db.insert(newsletterSubscriptions).values({
        email,
        source,
        isActive: true,
        confirmationSent: false
      });
    }

    // Send confirmation email
    try {
      await sendNewsletterConfirmationEmail(email);
      
      // Update confirmation sent status
      await db
        .update(newsletterSubscriptions)
        .set({ 
          confirmationSent: true,
          confirmationSentAt: new Date()
        })
        .where(eq(newsletterSubscriptions.email, email));

      console.log(`Newsletter confirmation email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send newsletter confirmation email:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter! Please check your email for confirmation.',
      emailSent: true
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to subscribe to newsletter. Please try again.' 
    });
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      });
    }

    await db
      .update(newsletterSubscriptions)
      .set({ 
        isActive: false 
      })
      .where(eq(newsletterSubscriptions.email, email));

    res.status(200).json({ 
      success: true, 
      message: 'Successfully unsubscribed from newsletter' 
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unsubscribe. Please try again.' 
    });
  }
}

/**
 * Get newsletter subscription status
 */
export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      });
    }

    const subscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email as string))
      .limit(1);

    const isSubscribed = subscription.length > 0 && subscription[0].isActive;

    res.status(200).json({ 
      success: true, 
      isSubscribed,
      subscription: isSubscribed ? subscription[0] : null
    });

  } catch (error) {
    console.error('Newsletter status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check subscription status' 
    });
  }
}