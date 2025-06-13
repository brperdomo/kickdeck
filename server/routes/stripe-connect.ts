import { Router } from "express";
import Stripe from "stripe";
import { db } from "@db";
import { events } from "@db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../middleware";

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Create Stripe Connect account for an event
router.post("/events/:eventId/connect-account", isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email, country = "US", type = "standard" } = req.body;

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

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: type as "standard" | "express" | "custom",
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // Can be modified based on requirements
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&refresh=true`,
      return_url: `${req.protocol}://${req.get('host')}/admin/events/${eventId}/settings?tab=banking&success=true`,
      type: 'account_onboarding',
    });

    // Update event with Connect account details
    await db.update(events)
      .set({
        stripeConnectAccountId: account.id,
        connectAccountStatus: "pending",
        connectOnboardingUrl: accountLink.url,
        connectAccountType: type,
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
router.get("/events/:eventId/connect-account", isAdmin, async (req, res) => {
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
        status: "not_connected",
        accountId: null,
        requirements: [],
        payoutsEnabled: false,
        chargesEnabled: false
      });
    }

    // Fetch latest account status from Stripe
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
      status,
      accountId: account.id,
      requirements: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      businessProfile: account.business_profile,
      country: account.country,
      defaultCurrency: account.default_currency,
      detailsSubmitted: account.details_submitted,
    });

  } catch (error: any) {
    console.error("Error fetching Connect account:", error);
    res.status(500).json({ 
      error: "Failed to fetch Connect account status",
      details: error.message 
    });
  }
});

// Create new onboarding link for existing account
router.post("/events/:eventId/connect-account/reauth", isAdmin, async (req, res) => {
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
    console.error("Error creating reauth link:", error);
    res.status(500).json({ 
      error: "Failed to create reauth link",
      details: error.message 
    });
  }
});

// Get Stripe Express dashboard link
router.get("/events/:eventId/connect-account/dashboard", isAdmin, async (req, res) => {
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
router.post("/webhook", async (req, res) => {
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

export default router;