/**
 * Payment Integrity Service
 * 
 * Prevents payment failures by ensuring every team has proper Stripe customer
 * and payment method setup before they can be approved.
 */

import Stripe from 'stripe';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PaymentIntegrityReport {
  teamId: number;
  teamName: string;
  issues: string[];
  canBeApproved: boolean;
  recommendedActions: string[];
}

/**
 * Validates payment setup for a specific team
 */
export async function validateTeamPaymentSetup(teamId: number): Promise<PaymentIntegrityReport> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      id: true,
      name: true,
      setupIntentId: true,
      paymentMethodId: true,
      stripeCustomerId: true,
      paymentStatus: true,
      submitterEmail: true,
      managerEmail: true,
      managerName: true,
      totalAmount: true
    }
  });

  if (!team) {
    throw new Error(`Team ${teamId} not found`);
  }

  const report: PaymentIntegrityReport = {
    teamId: team.id,
    teamName: team.name || 'Unknown Team',
    issues: [],
    canBeApproved: true,
    recommendedActions: []
  };

  // Check for missing customer ID
  if (!team.stripeCustomerId) {
    report.issues.push('No Stripe customer ID');
    report.canBeApproved = false;
    report.recommendedActions.push('Create Stripe customer and attach payment method');
  }

  // Check for missing payment method
  if (!team.paymentMethodId) {
    report.issues.push('No payment method ID');
    report.canBeApproved = false;
    report.recommendedActions.push('Team needs to complete payment setup');
  }

  // Check Setup Intent status
  if (team.setupIntentId) {
    try {
      const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        report.issues.push(`Setup Intent not completed (status: ${setupIntent.status})`);
        report.canBeApproved = false;
        report.recommendedActions.push('Team needs to complete payment method setup');
      }

      // Check if payment method is accessible for charging
      if (setupIntent.payment_method && team.stripeCustomerId) {
        try {
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
          
          // If payment method is attached to a different customer, it's still usable
          // We just need to ensure we can charge it during approval
          if (paymentMethod.customer !== team.stripeCustomerId) {
            report.issues.push('Payment method attached to different customer (fixable during approval)');
            report.recommendedActions.push('Payment method will be re-attached during approval');
            // Don't block approval for this - it's auto-fixable
          }

          // Check for Link payments (problematic)
          if (paymentMethod.type === 'link') {
            report.issues.push('Link payment method detected (cannot be reliably charged)');
            report.canBeApproved = false;
            report.recommendedActions.push('Generate new payment URL without Link support');
          }
        } catch (paymentMethodError) {
          report.issues.push('Payment method not accessible');
          report.canBeApproved = false;
          report.recommendedActions.push('Create new payment method');
        }
      }
    } catch (stripeError) {
      report.issues.push(`Setup Intent validation failed: ${stripeError}`);
      report.canBeApproved = false;
      report.recommendedActions.push('Create new Setup Intent');
    }
  }

  // Check for missing contact information
  if (!team.submitterEmail && !team.managerEmail) {
    report.issues.push('No contact email available');
    report.recommendedActions.push('Update team contact information');
  }

  return report;
}

/**
 * Automatically fixes payment setup issues for a team
 */
export async function autoFixTeamPaymentSetup(teamId: number): Promise<{ success: boolean; actions: string[]; errors: string[] }> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        id: true,
        name: true,
        setupIntentId: true,
        paymentMethodId: true,
        stripeCustomerId: true,
        submitterEmail: true,
        managerEmail: true,
        managerName: true,
        submitterName: true
      }
    });

    if (!team) {
      errors.push(`Team ${teamId} not found`);
      return { success: false, actions, errors };
    }

    const primaryEmail = team.submitterEmail || team.managerEmail;
    const primaryName = team.managerName || team.submitterName || team.name;

    // Fix 1: Create customer if missing
    if (!team.stripeCustomerId && primaryEmail) {
      try {
        const customer = await stripe.customers.create({
          email: primaryEmail,
          name: primaryName,
          metadata: {
            teamId: teamId.toString(),
            teamName: team.name || 'Unknown Team',
            autoCreated: 'payment_integrity_fix',
            createdAt: new Date().toISOString()
          }
        });

        await db.update(teams)
          .set({ stripeCustomerId: customer.id })
          .where(eq(teams.id, teamId));

        actions.push(`Created Stripe customer ${customer.id}`);
        team.stripeCustomerId = customer.id;
      } catch (customerError) {
        errors.push(`Failed to create customer: ${customerError}`);
      }
    }

    // Fix 2: Attach payment method to customer if both exist
    if (team.stripeCustomerId && team.setupIntentId) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        
        if (setupIntent.payment_method && setupIntent.status === 'succeeded') {
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
          
          // Only attach if not already attached and not a Link payment
          if (paymentMethod.customer !== team.stripeCustomerId && paymentMethod.type !== 'link') {
            await stripe.paymentMethods.attach(setupIntent.payment_method as string, {
              customer: team.stripeCustomerId
            });
            
            actions.push(`Attached payment method ${setupIntent.payment_method} to customer ${team.stripeCustomerId}`);
          }
        }
      } catch (attachError) {
        errors.push(`Failed to attach payment method: ${attachError}`);
      }
    }

    return { success: errors.length === 0, actions, errors };
  } catch (error) {
    errors.push(`Auto-fix failed: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Scans all teams and identifies payment setup issues
 */
export async function scanAllTeamsForPaymentIssues(): Promise<PaymentIntegrityReport[]> {
  console.log('🔍 Scanning all teams for payment integrity issues...');
  
  const teamsWithAmounts = await db.select({
    id: teams.id,
    name: teams.name,
    paymentStatus: teams.paymentStatus,
    setupIntentId: teams.setupIntentId,
    stripeCustomerId: teams.stripeCustomerId,
    paymentMethodId: teams.paymentMethodId,
    totalAmount: teams.totalAmount
  })
  .from(teams)
  .where(
    and(
      isNotNull(teams.totalAmount),
      eq(teams.status, 'registered') // Only check teams that could be approved
    )
  );

  console.log(`Found ${teamsWithAmounts.length} teams with amounts in registered status`);
  
  const reports: PaymentIntegrityReport[] = [];
  
  for (const team of teamsWithAmounts) {
    if (team.totalAmount && team.totalAmount > 0) {
      try {
        const report = await validateTeamPaymentSetup(team.id);
        if (!report.canBeApproved) {
          reports.push(report);
        }
      } catch (error) {
        console.error(`Error validating team ${team.id}:`, error);
      }
    }
  }

  return reports;
}

/**
 * Prevention middleware for team approval
 */
export async function preventApprovalWithoutPaymentSetup(teamId: number): Promise<{ canApprove: boolean; reason?: string; fixUrl?: string }> {
  try {
    const report = await validateTeamPaymentSetup(teamId);
    
    if (!report.canBeApproved) {
      return {
        canApprove: false,
        reason: `Payment setup incomplete: ${report.issues.join(', ')}`,
        fixUrl: `/admin/teams/${teamId}/fix-payment`
      };
    }
    
    return { canApprove: true };
  } catch (error) {
    return {
      canApprove: false,
      reason: `Payment validation failed: ${error}`
    };
  }
}