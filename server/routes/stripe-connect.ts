import type { Express } from "express";
import Stripe from "stripe";
import { db } from "@db";
import { events } from "@db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../middleware";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Registers Stripe Connect routes for tournament banking
 */
export function registerStripeConnectRoutes(app: Express) {
  // Create Stripe Connect account for an event
  app.post("/api/events/:eventId/connect-account", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { email, businessName, country = "US", type = "standard" } = req.body;

      // Check if event exists and user has access
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if Connect account already exists
      if (event.stripeConnectAccountId) {
        return res.status(400).json({ 
          error: "Connect account already exists for this event",
          accountId: event.stripeConnectAccountId
        });
      }

      // Create Stripe Connect account with secure form data
      const accountParams: any = {
        type: type as "standard" | "express" | "custom",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessName ? 'company' : 'individual',
      };

      // Add business profile if business name is provided
      if (businessName) {
        accountParams.business_profile = {
          name: businessName,
        };
        accountParams.company = {
          name: businessName,
        };
      }

      const account = await stripe.accounts.create(accountParams);

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&refresh=true`,
        return_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&success=true`,
        type: 'account_onboarding',
      });

      // Update event with Connect account info
      await db.update(events)
        .set({
          stripeConnectAccountId: account.id,
          connectAccountStatus: "pending",
          connectOnboardingUrl: accountLink.url,
          connectAccountVerified: false,
          connectPayoutsEnabled: false,
          connectChargesEnabled: false,
          connectLastUpdated: new Date(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, parseInt(eventId)));

      res.json({
        accountId: account.id,
        onboardingUrl: accountLink.url,
        status: "pending"
      });

    } catch (error: any) {
      console.error("Error creating Connect account:", error);
      res.status(500).json({ 
        error: "Failed to create Connect account",
        details: error.message 
      });
    }
  });

  // Get Connect account status for an event
  app.get("/api/events/:eventId/connect-account", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (!event.stripeConnectAccountId) {
        return res.json({ 
          connected: false,
          status: "not_connected"
        });
      }

      // Get latest account info from Stripe
      const account = await stripe.accounts.retrieve(event.stripeConnectAccountId);
      
      let status = "pending";
      if (account.payouts_enabled && account.charges_enabled) {
        status = "active";
      } else if (account.requirements?.disabled_reason) {
        status = "restricted";
      }

      // Update database with latest status
      await db.update(events)
        .set({
          connectAccountStatus: status,
          connectPayoutsEnabled: account.payouts_enabled,
          connectChargesEnabled: account.charges_enabled,
          connectAccountVerified: account.payouts_enabled && account.charges_enabled,
          connectRequirementsNeeded: JSON.stringify(account.requirements?.currently_due || []),
          connectLastUpdated: new Date(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, parseInt(eventId)));

      res.json({
        connected: true,
        accountId: event.stripeConnectAccountId,
        status,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        verified: account.payouts_enabled && account.charges_enabled,
        requirementsNeeded: account.requirements?.currently_due || [],
        onboardingUrl: event.connectOnboardingUrl,
        dashboardUrl: event.connectDashboardUrl
      });

    } catch (error: any) {
      console.error("Error fetching Connect account:", error);
      res.status(500).json({ 
        error: "Failed to fetch Connect account",
        details: error.message 
      });
    }
  });

  // Refresh Connect account onboarding link
  app.post("/api/events/:eventId/connect-account/refresh", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event || !event.stripeConnectAccountId) {
        return res.status(404).json({ error: "Connect account not found" });
      }

      // Create new account link
      const accountLink = await stripe.accountLinks.create({
        account: event.stripeConnectAccountId,
        refresh_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&refresh=true`,
        return_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&success=true`,
        type: 'account_onboarding',
      });

      // Update onboarding URL
      await db.update(events)
        .set({
          connectOnboardingUrl: accountLink.url,
          connectLastUpdated: new Date(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, parseInt(eventId)));

      res.json({
        onboardingUrl: accountLink.url
      });

    } catch (error: any) {
      console.error("Error refreshing onboarding link:", error);
      res.status(500).json({ 
        error: "Failed to refresh onboarding link",
        details: error.message 
      });
    }
  });

  // Get Stripe Express dashboard link
  app.get("/api/events/:eventId/connect-account/dashboard", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event || !event.stripeConnectAccountId) {
        return res.status(404).json({ error: "Connect account not found" });
      }

      // Create login link to Stripe Express dashboard
      const loginLink = await stripe.accounts.createLoginLink(event.stripeConnectAccountId);

      // Update dashboard URL
      await db.update(events)
        .set({
          connectDashboardUrl: loginLink.url,
          connectLastUpdated: new Date(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, parseInt(eventId)));

      res.json({
        dashboardUrl: loginLink.url
      });

    } catch (error: any) {
      console.error("Error creating dashboard link:", error);
      res.status(500).json({ 
        error: "Failed to create dashboard link",
        details: error.message 
      });
    }
  });

  // Webhook endpoint for Connect account updates
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle Connect account updates
      if (event.type === 'account.updated') {
        const account = event.data.object as Stripe.Account;
        
        // Find event with this Connect account
        const eventRecord = await db.query.events.findFirst({
          where: eq(events.stripeConnectAccountId, account.id)
        });

        if (eventRecord) {
          let status = "pending";
          if (account.payouts_enabled && account.charges_enabled) {
            status = "active";
          } else if (account.requirements?.disabled_reason) {
            status = "restricted";
          }

          // Update database with latest status
          await db.update(events)
            .set({
              connectAccountStatus: status,
              connectPayoutsEnabled: account.payouts_enabled,
              connectChargesEnabled: account.charges_enabled,
              connectAccountVerified: account.payouts_enabled && account.charges_enabled,
              connectRequirementsNeeded: JSON.stringify(account.requirements?.currently_due || []),
              connectLastUpdated: new Date(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(events.id, eventRecord.id));
        }
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: error.message });
    }
  });
}