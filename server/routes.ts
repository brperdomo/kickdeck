import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { log } from "./vite";
import { crypto } from "./crypto";
import { db } from "@db";
import { isAdmin, hasEventAccess } from "./middleware";
import seasonalScopesRouter from "./routes/seasonal-scopes";
import uploadRouter from "./routes/upload";
import csvUploadRouter from "./routes/csv-upload";
import accountingCodesRouter from "./routes/admin/accounting-codes";
import feesRouter from "./routes/admin/fees";
import eventsRouter from "./routes/admin/events";
import ageGroupsRouter from "./routes/admin/age-groups";
import foldersRouter from "./routes/folders";
import organizationsRouter from "./routes/admin/organizations"; 
import emailProvidersRouter from "./routes/admin/email-providers";
import emailTemplateRoutingsRouter from "./routes/admin/email-template-routings";
import membersRouter from "./routes/admin/members-router";
import teamsRouter from "./routes/admin/teams-router";
import playersRouter from "./routes/admin/players-router";
import { createCoupon, getCoupons, updateCoupon, deleteCoupon } from "./routes/coupons";
import { getFeeAssignments, updateFeeAssignments } from "./routes/fee-assignments";
import { createStripePaymentIntent, getPaymentIntentStatus, handleStripeWebhook, getStripeConfig } from "./routes/payments";
import { getTinyMCEConfig } from "./services/configService";
import { requestPasswordReset, verifyResetToken, completePasswordReset } from "./routes/auth";
import { generateTermsAcknowledgmentDocument, downloadTermsAcknowledgmentDocument, downloadTermsAcknowledgmentByFilename } from "./routes/terms-acknowledgments";
import { getCurrentUserRegistrations } from "./routes/admin/members";
import { 
  getRolesWithPermissions, 
  getRoleWithPermissions, 
  updateRolePermissions, 
  getAllPermissions,
  resetRolePermissions 
} from "./routes/admin/role-permissions";
import {
  getEmulatableAdmins,
  startEmulatingAdmin,
  stopEmulatingAdmin,
  getEmulationStatus
} from "./routes/admin/emulation";
import { getCurrentUserPermissions } from "./routes/admin/permissions";
import {
  getEventAdministrators,
  getAvailableAdministrators,
  addEventAdministrator,
  updateEventAdministrator,
  removeEventAdministrator
} from "./routes/admin/event-administrators";
import userRouter from "./routes/user";
import { sql, eq, and, or, inArray, notInArray } from "drizzle-orm";
import {
  users,
  organizationSettings,
  complexes,
  fields,
  events,
  eventAgeGroups,
  seasonalScopes,
  eventScoringRules,
  tournamentGroups,
  chatRooms,  
  chatParticipants,
  messages,
  households,
  householdInvitations,
  roles,
  adminRoles,
  eventComplexes,
  eventFieldSizes,
  files,
  coupons,
  eventFormTemplates,
  formFields,
  formFieldOptions,
  formResponses,
  teams,
  players,
  games,
  gameTimeSlots,
  eventSettings,
  ageGroupSettings,
  eventAdministrators,
} from "@db/schema";
import fs from "fs/promises";
import path from "path";
import session from "express-session";
import passport from "passport";
import { randomBytes } from "crypto";

// Domain-based organization identification middleware
const identifyOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostname = req.hostname;
    
    // Extract the subdomain (e.g., 'client' from 'client.matchpro.ai')
    const parts = hostname.split('.');
    const isSubdomain = parts.length > 2;
    
    if (isSubdomain) {
      const subdomain = parts[0];
      
      // Skip for specific subdomains that aren't client organizations
      if (subdomain === 'app' || subdomain === 'www' || subdomain === 'api') {
        return next();
      }
      
      // Look up organization by domain
      const [organization] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.domain, subdomain))
        .limit(1);
      
      if (organization) {
        // Attach organization to request object for use in route handlers
        (req as any).organization = organization;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error identifying organization:', error);
    next();
  }
};

// Admin middleware (unchanged)
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  if (!req.user?.isAdmin) {
    return res.status(403).send("Not authorized");
  }

  next();
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  
  try {
    // Authentication is already set up in index.ts, no need to call setupAuth again
    log("Using existing authentication middleware");
    
    // WebSocket server setup
    setupWebSocketServer(httpServer);
    
    // Add organization identification middleware
    app.use(identifyOrganization);

    // Register admin routes
    app.use('/api/admin/accounting-codes', isAdmin, accountingCodesRouter);
    app.use('/api/admin/seasonal-scopes', isAdmin, seasonalScopesRouter);
    app.use('/api/admin/events', isAdmin, eventsRouter);
    app.use('/api/admin/events', isAdmin, feesRouter); // Mount fees router under events path
    app.use('/api/admin/age-groups', isAdmin, ageGroupsRouter); // Add age groups router
    app.use('/api/admin/organizations', isAdmin, organizationsRouter); // Add organizations router
    app.use('/api/admin/email-providers', isAdmin, emailProvidersRouter); // Add email providers router
    app.use('/api/admin/email-template-routings', isAdmin, emailTemplateRoutingsRouter); // Add email template routings router
    app.use('/api/admin/members', isAdmin, membersRouter); // Member management router
    app.use('/api/admin/teams', isAdmin, teamsRouter); // Team management router
    app.use('/api/admin/teams', isAdmin, playersRouter); // Player management router
    
    // Role permissions management endpoints
    app.get('/api/admin/roles', isAdmin, getRolesWithPermissions);
    app.get('/api/admin/roles/:id', isAdmin, getRoleWithPermissions);
    app.patch('/api/admin/roles/:id/permissions', isAdmin, updateRolePermissions);
    app.post('/api/admin/roles/:id/permissions/reset', isAdmin, resetRolePermissions);
    app.get('/api/admin/permissions', isAdmin, getAllPermissions);
    
    // Emulation endpoints for admin testing
    app.get('/api/admin/emulation/admins', isAdmin, getEmulatableAdmins);
    app.post('/api/admin/emulation/start/:adminId', isAdmin, startEmulatingAdmin);
    app.post('/api/admin/emulation/stop/:token', isAdmin, stopEmulatingAdmin);
    app.get('/api/admin/emulation/status', isAdmin, getEmulationStatus);
    
    // Get current user permissions for role-based UI
    app.get('/api/admin/permissions/me', isAdmin, getCurrentUserPermissions);
    
    // Event administrator management endpoints
    app.get('/api/admin/events/:eventId/administrators', isAdmin, getEventAdministrators);
    app.post('/api/admin/events/:eventId/administrators', isAdmin, addEventAdministrator);
    app.patch('/api/admin/events/:eventId/administrators/:adminId', isAdmin, updateEventAdministrator);
    app.delete('/api/admin/events/:eventId/administrators/:adminId', isAdmin, removeEventAdministrator);
    app.get('/api/admin/available-admins', isAdmin, getAvailableAdministrators);

    // Register fee assignment routes for admin
    app.get('/api/admin/events/:eventId/fee-assignments', isAdmin, getFeeAssignments);
    app.post('/api/admin/events/:eventId/fee-assignments', isAdmin, updateFeeAssignments);

    // Register coupon routes
    app.post('/api/admin/coupons', isAdmin, createCoupon);
    app.get('/api/admin/coupons', isAdmin, getCoupons);
    app.patch('/api/admin/coupons/:id', isAdmin, updateCoupon);
    app.delete('/api/admin/coupons/:id', isAdmin, deleteCoupon);

    // Public event endpoint
    app.get('/api/events/:id', async (req, res) => {
      try {
        const eventId = req.params.id;
        
        // Special handling for preview mode
        if (eventId === 'preview') {
          // Return a sample event for preview mode
          const previewEvent = {
            id: 'preview',
            name: 'Preview Tournament',
            startDate: '2025-04-15',
            endDate: '2025-04-20',
            location: 'Demo Soccer Complex',
            description: 'This is a preview of the tournament registration process. No actual registrations or payments will be processed.',
            applicationDeadline: '2025-04-10',
            details: 'Preview mode tournament for testing the registration process.',
            agreement: 'This is a sample agreement text for preview mode. In an actual event, this would contain the terms and conditions.',
            refundPolicy: 'This is a sample refund policy for preview mode. In an actual event, this would contain the refund policy details.',
            ageGroups: [
              {
                id: 1001,
                eventId: 'preview',
                ageGroup: "U10",
                gender: "Boys",
                divisionCode: "B10",
                birthYear: 2015,
                fieldSize: "9v9",
                projectedTeams: 12,
                scoringRule: "Standard",
                amountDue: 15000,
                createdAt: new Date().toISOString()
              },
              {
                id: 1002,
                eventId: 'preview',
                ageGroup: "U12",
                gender: "Boys",
                divisionCode: "B12",
                birthYear: 2013,
                fieldSize: "11v11",
                projectedTeams: 10,
                scoringRule: "Standard",
                amountDue: 15000,
                createdAt: new Date().toISOString()
              },
              {
                id: 1003,
                eventId: 'preview',
                ageGroup: "U14",
                gender: "Boys", 
                divisionCode: "B14",
                birthYear: 2011,
                fieldSize: "11v11",
                projectedTeams: 8,
                scoringRule: "Standard",
                amountDue: 17500,
                createdAt: new Date().toISOString()
              },
              {
                id: 1004,
                eventId: 'preview',
                ageGroup: "U10",
                gender: "Girls",
                divisionCode: "G10",
                birthYear: 2015,
                fieldSize: "9v9",
                projectedTeams: 8,
                scoringRule: "Standard",
                amountDue: 15000,
                createdAt: new Date().toISOString()
              },
              {
                id: 1005,
                eventId: 'preview',
                ageGroup: "U12",
                gender: "Girls",
                divisionCode: "G12",
                birthYear: 2013,
                fieldSize: "11v11",
                projectedTeams: 6,
                scoringRule: "Standard",
                amountDue: 15000,
                createdAt: new Date().toISOString()
              }
            ]
          };
          
          console.log('Returning preview event data');
          return res.json(previewEvent);
        }
        
        // Normal processing for real events
        const parsedEventId = parseInt(eventId);
        const [event] = await db
          .select({
            id: events.id,
            name: events.name,
            startDate: events.startDate,
            endDate: events.endDate,
            applicationDeadline: events.applicationDeadline,
            details: events.details,
            agreement: events.agreement,
            refundPolicy: events.refundPolicy
          })
          .from(events)
          .where(eq(events.id, parsedEventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }
        
        // We'll get branding settings along with other settings below

        // Also get the age groups for this event
        const rawAgeGroups = await db
          .select()
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, String(parsedEventId)));
          
        // Deduplicate age groups based on division code
        // This prevents duplicate age groups from appearing in the registration dropdown
        const uniqueMap = new Map();
        const uniqueAgeGroups = [];
        
        for (const group of rawAgeGroups) {
          // Use division code or create one from gender and age group if not available
          const divisionCode = group.divisionCode || `${group.gender.charAt(0)}${group.ageGroup.replace(/\D/g, '')}`;
          const key = divisionCode;
          
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {...group});
            uniqueAgeGroups.push(group);
          }
        }
        
        console.log(`Deduplicated age groups: ${uniqueAgeGroups.length} unique groups from ${rawAgeGroups.length} total`);
          
        // Get event settings
        const settings = await db
          .select()
          .from(eventSettings)
          .where(eq(eventSettings.eventId, String(parsedEventId)));
          
        // Process branding settings if they exist
        const brandingSettings = settings.filter(setting => 
          setting.settingKey.startsWith('branding.'));
          
        let brandingData = {};
        
        if (brandingSettings.length > 0) {
          brandingSettings.forEach(setting => {
            const key = setting.settingKey.replace('branding.', '');
            brandingData[key] = setting.settingValue;
          });
        }

        // Send event details, age groups, and branding
        res.json({
          ...event,
          ageGroups: uniqueAgeGroups,
          branding: Object.keys(brandingData).length > 0 
            ? brandingData 
            : { logoUrl: null, primaryColor: null, secondaryColor: null }
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).send("Failed to fetch event details");
      }
    });
    
    // Get fees for a specific age group in an event
    app.get('/api/events/:eventId/fees', async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const ageGroupId = req.query.ageGroupId as string;
        
        // Special handling for preview mode
        if (eventId === 'preview') {
          // Return sample fees for preview mode
          const previewFees = [
            {
              id: 1001,
              name: "Registration Fee",
              amount: 15000,
              feeType: "registration",
              isRequired: true,
              beginDate: null,
              endDate: null
            },
            {
              id: 1002,
              name: "Uniform Fee",
              amount: 5000,
              feeType: "uniform",
              isRequired: false,
              beginDate: null,
              endDate: null
            },
            {
              id: 1003,
              name: "Early Bird Discount",
              amount: -2000,
              feeType: "discount",
              isRequired: false,
              beginDate: "2025-03-01",
              endDate: "2025-04-01"
            }
          ];
          
          return res.json({ 
            fees: previewFees,
            fee: previewFees[0] // For backward compatibility
          });
        }
        
        if (!ageGroupId) {
          return res.status(400).json({ error: 'Age group ID is required' });
        }
        
        // Import fee schemas
        const { eventFees, eventAgeGroupFees } = await import("@db/schema");
        
        try {
          console.log(`Fetching fees for age group ${ageGroupId} in event ${eventId}`);
          
          // Fetch all fees assigned to this age group
          const feeAssignments = await db
            .select({
              fee: {
                id: eventFees.id,
                name: eventFees.name,
                amount: eventFees.amount,
                beginDate: eventFees.beginDate,
                endDate: eventFees.endDate,
                feeType: eventFees.feeType,
                isRequired: eventFees.isRequired
              }
            })
            .from(eventAgeGroupFees)
            .innerJoin(eventFees, eq(eventAgeGroupFees.feeId, eventFees.id))
            .where(eq(eventAgeGroupFees.ageGroupId, parseInt(ageGroupId)));
          
          // Log what we found to help with debugging
          console.log(`Found ${feeAssignments.length} fee assignments for age group ${ageGroupId}`);
          
          // Map the fees directly from database results
          const feesWithTypes = feeAssignments.map(assignment => {
            // Add defensive check for null/undefined fee
            if (!assignment || !assignment.fee) {
              console.error('Null or undefined fee in assignment:', assignment);
              return null;
            }
            return assignment.fee;
          }).filter(Boolean); // Remove any null entries
          
          let allFees = feesWithTypes;
          
          if (allFees.length === 0) {
            console.log(`No specific fees found for age group ${ageGroupId}, checking for default fees`);
            
            // Check if there are default fees for this event (use applyToAll instead of isDefault)
            try {
              const defaultFees = await db
                .select({
                  id: eventFees.id,
                  name: eventFees.name,
                  amount: eventFees.amount,
                  beginDate: eventFees.beginDate,
                  endDate: eventFees.endDate,
                  feeType: eventFees.feeType,
                  isRequired: eventFees.isRequired
                })
                .from(eventFees)
                .where(
                  and(
                    eq(eventFees.eventId, eventId),
                    eq(eventFees.applyToAll, true)
                  )
                );
              
              console.log(`Found ${defaultFees.length} default fees for event ${eventId}`);
              
              // Make sure all fees have the required properties
              const defaultFeesWithTypes = defaultFees.map(fee => ({
                ...fee,
                feeType: fee.feeType || "registration",
                isRequired: typeof fee.isRequired === 'boolean' ? fee.isRequired : false
              }));
              
              if (defaultFeesWithTypes.length > 0) {
                allFees = defaultFeesWithTypes;
              }
            } catch (defaultFeeError) {
              console.error('Error fetching default fees:', defaultFeeError);
            }
          }
          
          if (!allFees || allFees.length === 0) {
            console.log('No fees found (either specific or default)');
            return res.json({ fees: [] });
          }
          
          // Check if allFees is undefined or not an array
          if (!allFees || !Array.isArray(allFees)) {
            console.error('Unexpected fees data format:', allFees);
            return res.json({ fees: [], fee: null });
          }
          
          // Ensure that each fee has a feeType property, defaulting to 'registration' if missing
          const feesWithDefaults = allFees.map(fee => {
            // Defensive coding to handle potentially undefined fee objects
            if (!fee) return { id: 0, name: 'Error', amount: 0, feeType: 'registration', isRequired: false };
            
            return {
              ...fee,
              feeType: fee.feeType || "registration",
              isRequired: typeof fee.isRequired === 'boolean' ? fee.isRequired : false
            };
          });
          
          // Separate registration fees from other fees (like uniform, equipment, etc.)
          const registrationFees = feesWithDefaults.filter(fee => fee.feeType === 'registration');
          const otherFees = feesWithDefaults.filter(fee => fee.feeType !== 'registration');
          
          // Check which registration fee should be active based on date ranges
          const now = new Date();
          const activeRegistrationFees = registrationFees.filter(fee => {
            // If no begin/end dates, fee is always active
            if (!fee.beginDate && !fee.endDate) return true;
            
            // Check if fee is active based on date range
            const isAfterBegin = !fee.beginDate || new Date(fee.beginDate) <= now;
            const isBeforeEnd = !fee.endDate || new Date(fee.endDate) >= now;
            
            return isAfterBegin && isBeforeEnd;
          });
          
          // Use active registration fees if available, otherwise use all registration fees
          const finalRegistrationFees = activeRegistrationFees.length > 0 ? activeRegistrationFees : registrationFees;
          
          // Combine registration fees with other fees (uniform, etc.)
          const finalFees = [...finalRegistrationFees, ...otherFees];
          
          res.json({ 
            fees: finalFees,
            // For backward compatibility
            fee: finalRegistrationFees.length > 0 ? finalRegistrationFees[0] : null
          });
        } catch (dbError) {
          console.error('Database error when fetching fees:', dbError);
          // Return an empty result instead of crashing
          res.json({ fees: [], fee: null });
        }
      } catch (error) {
        console.error('Error fetching fees:', error);
        res.status(500).json({ error: 'Failed to fetch fee information' });
      }
    });
    
    // Personal details endpoint for team registration flow
    app.post('/api/events/:eventId/personal-details', async (req: Request, res: Response) => {
      try {
        // This is a stub endpoint that simply stores personal details in the session
        // In a real implementation, this would store the data in the database
        const { firstName, lastName, email, phone, address, city, state, zipCode, country } = req.body;
        const { eventId } = req.params;
        
        // Special handling for preview mode
        if (eventId === 'preview') {
          console.log('Preview mode: simulating personal details storage without session modification');
          return res.status(200).json({ 
            success: true, 
            message: "Personal details saved successfully in preview mode",
            isPreview: true
          });
        }
        
        // Store the personal details in the session for later use
        if (req.session) {
          req.session.personalDetails = {
            firstName, 
            lastName, 
            email, 
            phone, 
            address, 
            city, 
            state, 
            zipCode, 
            country,
            timestamp: new Date().toISOString()
          };
        }
        
        res.status(200).json({ 
          success: true, 
          message: "Personal details saved successfully"
        });
      } catch (error) {
        console.error('Error saving personal details:', error);
        res.status(500).json({ error: 'Failed to save personal details' });
      }
    });

    // Team registration endpoint for participants
    app.post('/api/events/:eventId/register-team', async (req: Request, res: Response) => {
      // TEMPORARILY bypass authentication for testing
      // if (!req.user) {
      //   return res.status(401).json({ error: 'You must be logged in to register a team' });
      // }
      // For testing, we'll set a mock user
      if (!req.user) {
        req.user = { id: 1 } as Express.User;
      }
      
      try {
        const { eventId } = req.params;
        
        // Special handling for preview mode
        if (eventId === 'preview') {
          // For preview mode, return a mock success response without actually creating a team
          console.log('Preview mode: simulating team registration without database insertion');
          return res.status(200).json({
            success: true,
            message: "Team registered successfully in preview mode",
            teamId: "preview-" + Date.now(),
            isPreview: true
          });
        }
        
        const userId = req.user.id;
        const { 
          name, 
          ageGroupId, 
          headCoachName, 
          headCoachEmail, 
          headCoachPhone,
          assistantCoachName,
          managerName,
          managerEmail,
          managerPhone,
          players,
          // New fields for registration status and terms
          termsAcknowledged,
          termsAcknowledgedAt,
          // Fee-related fields
          registrationFee,
          selectedFeeIds,
          totalAmount,
          // Payment method ('card' or 'pay_later')
          paymentMethod
        } = req.body;
        
        // Validate required fields
        if (!name || !ageGroupId || !headCoachName || !headCoachEmail || !headCoachPhone || 
            !managerName || !managerEmail || !managerPhone) {
          return res.status(400).json({ 
            error: 'Missing required team information. Please fill out all required fields.' 
          });
        }
        
        if (!Array.isArray(players) || players.length === 0) {
          return res.status(400).json({ 
            error: 'At least one player is required to register a team.' 
          });
        }
        
        // Check if event exists and is open for registration
        const [event] = await db
          .select({
            id: events.id,
            applicationDeadline: events.applicationDeadline
          })
          .from(events)
          .where(eq(events.id, eventId));
          
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        // Check if registration deadline has passed
        const deadlineDate = new Date(event.applicationDeadline);
        const currentDate = new Date();
        
        if (deadlineDate < currentDate) {
          return res.status(400).json({ error: 'Registration deadline has passed' });
        }
        
        // Validate age group
        const [ageGroup] = await db
          .select()
          .from(eventAgeGroups)
          .where(and(
            eq(eventAgeGroups.id, ageGroupId),
            eq(eventAgeGroups.eventId, eventId)
          ));
          
        if (!ageGroup) {
          return res.status(404).json({ error: 'Selected age group not found for this event' });
        }
        
        // Create the team in a transaction to ensure all operations succeed or fail together
        const result = await db.transaction(async (tx) => {
          // Insert team with registration info - using proper property names that match the schema
          const insertedTeam = await tx
            .insert(teams)
            .values({
              name,
              eventId: eventId,  // Use camelCase as defined in the schema
              ageGroupId: ageGroupId,  // Use camelCase as defined in the schema
              // Combine coach data into a single JSON field to match the 'coach' column in DB
              coach: JSON.stringify({
                headCoachName,
                headCoachEmail,
                headCoachPhone,
                assistantCoachName
              }),
              managerName: managerName,
              managerEmail: managerEmail,
              managerPhone: managerPhone,
              // Track the submitter's information separately from the manager
              // If the user is logged in, use their information as the submitter
              // Otherwise, fall back to the manager information
              submitterEmail: req.user?.email || managerEmail,
              submitterName: req.user ? `${req.user.firstName} ${req.user.lastName}` : managerName,
              // Add new registration fields
              // Set team status based on payment method
              status: paymentMethod === "pay_later" ? "pending_payment" : "registered", // Possible values: 'registered', 'approved', 'rejected', 'pending_payment'
              registrationFee: registrationFee || null,  // Use camelCase as defined in the schema
              // Add the new multiple fee tracking fields
              selectedFeeIds: selectedFeeIds || null, // Store as comma-separated list
              totalAmount: totalAmount || null, // Total amount in cents including all fees
              termsAcknowledged: termsAcknowledged || false,  // Use camelCase as defined in the schema
              termsAcknowledgedAt: termsAcknowledgedAt ? new Date(termsAcknowledgedAt) : new Date(),  // Use camelCase as defined in the schema
              createdAt: new Date().toISOString() // Use camelCase as defined in the schema
            })
            .returning();
          
          // Get the first team from the returned array
          const team = insertedTeam[0];
            
          console.log('Team created with ID:', team?.id);
            
          // Track player count for the response
          let playerCount = 0;
          
          // Insert players using the schema's property names (camelCase)
          try {
            console.log('Number of players to insert:', players.length);
            // Don't try to stringify the players array or playersTable schema object as they may contain circular references
            
            for (const player of players) {
              console.log(`Processing player: ${player.firstName} ${player.lastName}`);
              
              // Safely convert date of birth to a Date object if it exists
              let dateOfBirthValue = null;
              if (player.dateOfBirth) {
                try {
                  // Create a Date object to ensure it's properly formatted
                  const dateObj = new Date(player.dateOfBirth);
                  if (!isNaN(dateObj.getTime())) {
                    dateOfBirthValue = dateObj.toISOString();
                  }
                } catch (err) {
                  console.error('Error converting player date of birth:', err);
                }
              }
              
              // Build player data
              const playerData = {
                teamId: team.id, 
                firstName: player.firstName,
                lastName: player.lastName,
                jerseyNumber: player.jerseyNumber ? parseInt(player.jerseyNumber) : null,
                dateOfBirth: dateOfBirthValue || player.dateOfBirth || new Date().toISOString(),
                position: player.position || null,
                medicalNotes: player.medicalNotes || null,
                parentGuardianName: player.parentGuardianName || null,
                parentGuardianEmail: player.parentGuardianEmail || null,
                parentGuardianPhone: player.parentGuardianPhone || null,
                emergencyContactName: player.emergencyContactName,
                emergencyContactPhone: player.emergencyContactPhone,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              console.log('Player data for insertion:', JSON.stringify(playerData, null, 2));
              
              // Use Drizzle ORM to insert the player
              try {
                const now = new Date().toISOString();
                const jerseyNumberInt = player.jerseyNumber ? parseInt(player.jerseyNumber) : null;
                
                // Debug team object - just log the id to avoid circular references
                console.log("Team ID for player insertion:", team?.id);
                
                if (!team || typeof team.id === 'undefined') {
                  console.error("Team ID is missing or undefined!");
                  throw new Error("Team ID is missing for player insertion");
                }
                
                // Create a new object with the exact schema properties
                const playerValues = {
                  teamId: team.id,
                  firstName: player.firstName,
                  lastName: player.lastName,
                  jerseyNumber: jerseyNumberInt,
                  dateOfBirth: dateOfBirthValue || player.dateOfBirth || now,
                  position: player.position || null,
                  medicalNotes: player.medicalNotes || null,
                  parentGuardianName: player.parentGuardianName || null,
                  parentGuardianEmail: player.parentGuardianEmail || null,
                  parentGuardianPhone: player.parentGuardianPhone || null,
                  emergencyContactName: player.emergencyContactName || '',
                  emergencyContactPhone: player.emergencyContactPhone || '',
                  isActive: true,
                  createdAt: now,
                  updatedAt: now
                };
                
                // Log the exact player values we're using
                console.log('Inserting player with values:', JSON.stringify(playerValues, null, 2));
                
                // Direct SQL approach without parameterized queries
                // Build query with explicit column names and values
                const columns = Object.keys(playerValues).map(key => {
                  // Convert camelCase to snake_case
                  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
                }).join(', ');
                
                // Format values directly in the SQL query with proper escaping
                const valuesList = Object.values(playerValues).map(value => {
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                  if (value instanceof Date) return `'${value.toISOString()}'`;
                  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                  return String(value);
                });
                
                const valuesString = valuesList.join(', ');
                
                console.log(`SQL Insert: columns=${columns}, values=${valuesString}`);
                
                // Build direct SQL query without parameters
                const directSqlQuery = `
                  INSERT INTO players (${columns})
                  VALUES (${valuesString})
                  RETURNING id
                `;
                
                console.log('Executing direct SQL query:', directSqlQuery);
                const insertResult = await tx.execute(directSqlQuery);
                
                console.log('Player inserted successfully:', insertResult);
                
                // Get the returned player ID
                const insertedPlayer = { id: insertResult.rows?.[0]?.id };
                
                console.log('Player inserted successfully with ID:', insertedPlayer?.id);
                console.log('Player inserted with ID:', insertedPlayer?.id || 'unknown');
                
                // Increment player count only after successful insertion
                playerCount++;
              } catch (playerInsertError) {
                console.error('Error inserting player:', playerInsertError);
                throw playerInsertError;
              }
            }
          } catch (error) {
            console.error('Error inserting players:', error);
            throw error; // Re-throw to handle in the outer catch block
          }
          
          return { team, playerCount };
        });
        
        // Extract only the necessary properties from the team to avoid circular references
        const simplifiedTeam = result.team ? {
          id: result.team.id,
          name: result.team.name,
          eventId: result.team.eventId,
          ageGroupId: result.team.ageGroupId,
          status: result.team.status,
          registrationFee: result.team.registrationFee,
          selectedFeeIds: result.team.selectedFeeIds,
          totalAmount: result.team.totalAmount
        } : null;
        
        res.status(201).json({
          message: 'Team registered successfully',
          team: simplifiedTeam,
          playerCount: result.playerCount
        });
        
      } catch (error) {
        console.error('Error registering team:', error);
        res.status(500).json({ error: 'Failed to register team. Please try again.' });
      }
    });

    // Payment processing endpoints
    app.get('/api/payments/config', getStripeConfig);
    app.post('/api/payments/create-intent', createStripePaymentIntent);
    app.get('/api/payments/intent/:id', getPaymentIntentStatus);
    app.post('/api/payments/webhook', handleStripeWebhook);
    
    // Terms acknowledgment endpoints
    app.post('/api/teams/:teamId/terms-acknowledgment/generate', isAdmin, generateTermsAcknowledgmentDocument);
    app.get('/api/teams/:teamId/terms-acknowledgment/download', downloadTermsAcknowledgmentDocument);
    app.get('/api/download/terms-acknowledgment/:filename', isAdmin, downloadTermsAcknowledgmentByFilename);
    
    // TinyMCE configuration endpoint
    app.get('/api/config/tinymce', getTinyMCEConfig);

    // Test endpoints for payment processing (only in development)
    if (process.env.NODE_ENV !== 'production') {
      import('./routes/test-payment.js').then(({ createTestPaymentIntent, simulatePaymentWebhook }) => {
        app.post('/api/test/payment/create-intent', createTestPaymentIntent);
        app.post('/api/test/payment/simulate-webhook', simulatePaymentWebhook);
        log('Test payment endpoints registered (development only)', 'express');
      }).catch(err => {
        log(`Error loading test payment routes: ${err}`, 'express');
      });
    }

    // Use events router for all admin event operations
    app.use('/api/admin/events', isAdmin, eventsRouter);

    // Endpoint to clone an event
    app.post('/api/admin/events/:id/clone', isAdmin, async (req, res) => {
      try {
        const sourceEventId = req.params.id;
        console.log(`Cloning event with ID: ${sourceEventId}`);
        
        // Get the original event data
        const [sourceEvent] = await db
          .select()
          .from(events)
          .where(eq(events.id, sourceEventId));
          
        if (!sourceEvent) {
          return res.status(404).json({ error: "Source event not found" });
        }
        
        // Generate a new event ID using the crypto utility
        // This ensures we use the same ID format as regular event creation
        const newEventId = crypto.generateEventId();
        console.log(`Creating cloned event with ID: ${newEventId}`);
        
        // Create a clone of the event with a random ID and adding "Copy of" to the name
        const [newEvent] = await db
          .insert(events)
          .values({
            id: newEventId, // Use the randomly generated ID
            name: `Copy of ${sourceEvent.name}`,
            startDate: sourceEvent.startDate,
            endDate: sourceEvent.endDate,
            timezone: sourceEvent.timezone,
            applicationDeadline: sourceEvent.applicationDeadline,
            details: sourceEvent.details,
            agreement: sourceEvent.agreement,
            refundPolicy: sourceEvent.refundPolicy,
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .returning();
        
        // Clone the age groups
        const sourceAgeGroups = await db
          .select()
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, sourceEventId));
        
        for (const ageGroup of sourceAgeGroups) {
          await db
            .insert(eventAgeGroups)
            .values({
              ...ageGroup,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        // Clone the scoring rules
        const sourceScoringRules = await db
          .select()
          .from(eventScoringRules)
          .where(eq(eventScoringRules.eventId, sourceEventId));
        
        for (const rule of sourceScoringRules) {
          await db
            .insert(eventScoringRules)
            .values({
              ...rule,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        // Clone the complexes
        const sourceComplexes = await db
          .select()
          .from(eventComplexes)
          .where(eq(eventComplexes.eventId, sourceEventId));
        
        for (const complex of sourceComplexes) {
          await db
            .insert(eventComplexes)
            .values({
              ...complex,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        // Clone the field sizes
        const sourceFieldSizes = await db
          .select()
          .from(eventFieldSizes)
          .where(eq(eventFieldSizes.eventId, sourceEventId));
        
        for (const fieldSize of sourceFieldSizes) {
          await db
            .insert(eventFieldSizes)
            .values({
              ...fieldSize,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        // Clone the settings
        const sourceSettings = await db
          .select()
          .from(eventSettings)
          .where(eq(eventSettings.eventId, sourceEventId));
        
        for (const setting of sourceSettings) {
          await db
            .insert(eventSettings)
            .values({
              ...setting,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        // Clone the event administrators
        const sourceAdmins = await db
          .select()
          .from(eventAdministrators)
          .where(eq(eventAdministrators.eventId, sourceEventId));
        
        for (const admin of sourceAdmins) {
          await db
            .insert(eventAdministrators)
            .values({
              ...admin,
              id: undefined, // Let the database generate a new ID
              eventId: String(newEvent.id), // Use the ID from the newly created event
              createdAt: new Date().toISOString()
            });
        }
        
        const responseData = { 
          message: "Event cloned successfully", 
          event: newEvent,
          id: newEvent.id // Use the ID from the newly created event
        };
        
        console.log("Clone response data:", JSON.stringify(responseData, null, 2));
        res.status(201).json(responseData);
        
      } catch (error) {
        console.error('Error cloning event:', error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to clone event",
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Add admin event deletion endpoint
    app.delete('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
          return res.status(400).json({ error: "Invalid event ID" });
        }
        console.log('Starting event deletion for ID:', eventId);

        // Delete everything in a transaction to ensure consistency
        await db.transaction(async (tx) => {
          // Delete form responses and fields first
          const templates = await tx
            .select()
            .from(eventFormTemplates)
            .where(eq(eventFormTemplates.eventId, String(eventId)));

          // Delete form-related data
          if (templates.length > 0) {
            const templateIds = templates.map(t => t.id);
            
            // Delete form responses first
            await tx
              .delete(formResponses)
              .where(inArray(formResponses.templateId, templateIds));
            console.log('Deleted form responses');

            // Get fields for deletion
            const fields = await tx
              .select()
              .from(formFields)
              .where(inArray(formFields.templateId, templateIds));

            if (fields.length > 0) {
              const fieldIds = fields.map(f => f.id);
              
              // Delete options first
              await tx
                .delete(formFieldOptions)
                .where(inArray(formFieldOptions.fieldId, fieldIds));
              console.log('Deleted form field options');

              // Then delete fields
              await tx
                .delete(formFields)
                .where(inArray(formFields.templateId, templateIds));
              console.log('Deleted form fields');
            }

            // Finally delete templates
            await tx
              .delete(eventFormTemplates)
              .where(eq(eventFormTemplates.eventId, String(eventId)));
            console.log('Deleted form templates');
          }

          // Delete event relationships in dependency order
          await tx
            .delete(games)
            .where(eq(games.eventId, String(eventId)));
          console.log('Deleted games');

          await tx
            .delete(gameTimeSlots)
            .where(eq(gameTimeSlots.eventId, String(eventId)));
          console.log('Deleted game time slots');

          await tx
            .delete(chatRooms)
            .where(eq(chatRooms.eventId, String(eventId)));
          console.log('Deleted chat rooms');

          await tx
            .delete(coupons)
            .where(eq(coupons.eventId, String(eventId)));
          console.log('Deleted coupons');

          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, String(eventId)));
          console.log('Deleted event field sizes');

          await tx
            .delete(eventScoringRules)
            .where(eq(eventScoringRules.eventId, String(eventId)));
          console.log('Deleted event scoring rules');

          await tx
            .delete(eventComplexes)
            .where(eq(eventComplexes.eventId, String(eventId)));
          console.log('Deleted event complexes');

          await tx
            .delete(tournamentGroups)
            .where(eq(tournamentGroups.eventId, String(eventId)));
          console.log('Deleted tournament groups');

          await tx
            .delete(teams)
            .where(eq(teams.eventId, String(eventId)));
          console.log('Deleted teams');

          await tx
            .delete(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, String(eventId)));
          console.log('Deleted event age groups');

          await tx
            .delete(eventSettings)
            .where(eq(eventSettings.eventId, String(eventId)));
          console.log('Deleted event settings');

          // Finally delete the event itself
          const [deletedEvent] = await tx
            .delete(events)
            .where(eq(events.id, eventId))
            .returning({
              id: events.id,
              name: events.name
            });

          if (!deletedEvent) {
            throw new Error("Event not found");
          }
        });

        console.log('Successfully deleted event:', eventId);
        res.json({ message: "Event deleted successfully" });

      } catch (error) {
        console.error('Error deleting event:', error);
        console.error("Error details:", error instanceof Error ? error.stack : String(error));

        res.status(500).json({ 
          error: "Failed to delete event",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Admin email check endpoint
    app.get('/api/admin/check-email', isAdmin, async (req, res) => {
      try {
        const email = req.query.email as string;

        if (!email) {
          return res.status(400).json({ exists: false, message: "Email is required" });
        }

        // Check if email exists in users table with isAdmin=true
        const [existingAdmin] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, email),
              eq(users.isAdmin, true)
            )
          )
          .limit(1);

        // Add a small delay to prevent brute force attempts
        await new Promise(resolve => setTimeout(resolve, 200));

        return res.json({
          exists: !!existingAdmin,
          message: existingAdmin ? "Email is already registered" : undefined
        });
      } catch (error) {
        console.error('Error checking admin email:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        return res.status(500).json({ exists: false, message: "Internal server error" });
      }
    });

    // Administrator creation endpoint
    app.post('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        const { email, firstName, lastName, password, roles: roleNames } = req.body;
        console.log('Creating admin with:', { email, firstName, lastName, roleNames });

        // Input validation
        if (!email || !firstName || !lastName || !password || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
          return res.status(400).json({
            error: "All fields are required and roles must be a non-empty array"
          });
        }

        // Check for existing user
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).json({
            error: "Email already registered"
          });
        }

        // Create new user
        const hashedPassword = await crypto.hash(password);
        const timestamp = new Date(); // Use Date object directly

        const [newUser] = await db
          .insert(users)
          .values({
            email,
            username: email,
            password: hashedPassword,
            firstName,
            lastName,
            isAdmin: true,
            isParent: false,
            createdAt: timestamp
          })
          .returning();

        console.log('Created user:', newUser.id);

        // Process roles one by one
        for (const roleName of roleNames) {
          // Get or create role
          let [existingRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, roleName))
            .limit(1);

          if (!existingRole) {
            [existingRole] = await db
              .insert(roles)
              .values({
                name: roleName,
                description: `${roleName} role`,
                createdAt: new Date() // Use Date object directly
              })
              .returning();
          }

          // Create role assignment
          await db
            .insert(adminRoles)
            .values({
              userId: newUser.id,
              roleId: existingRole.id,
              createdAt: new Date() // Use Date object directly
            });

          console.log(`Assigned role ${roleName} to user ${newUser.id}`);
        }

        // Return success response
        res.json({
          message: "Administrator created successfully",
          admin: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            roles: roleNames
          }
        });

      } catch (error) {
        console.error('Error creating administrator:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        res.status(500).json({
          error: "Failed to create administrator", 
          details: error.message || "An unexpected error occurred"
        });
      }
    });

    // Administrator update endpoint
    app.patch('/api/admin/administrators/:id', isAdmin, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);
        const { email, firstName, lastName, roles: roleNames } = req.body;
        
        console.log('Updating admin:', { adminId, email, firstName, lastName, roleNames });

        // Input validation
        if (!email || !firstName || !lastName || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
          return res.status(400).json({
            error: "All fields are required and roles must be a non-empty array"
          });
        }

        // Verify admin exists and get current roles
        const adminWithRoles = await db
          .select({
            admin: users,
            roles: sql<string[]>`COALESCE(array_agg(${roles.name}), ARRAY[]::text[])`
          })
          .from(users)
          .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
          .leftJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(eq(users.id, adminId))
          .groupBy(users.id)
          .then(rows => rows[0]);

        if (!adminWithRoles) {
          return res.status(404).json({
            error: "Administrator not found"
          });
        }

        console.log('Found existing admin:', adminWithRoles);

        // If email is being changed, check if new email is available
        if (email !== adminWithRoles.admin.email) {
          const emailExists = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .then(rows => rows.length > 0);

          if (emailExists) {
            return res.status(400).json({
              error: "Email already registered"
            });
          }
        }

        // If removing super_admin role, check if this is the last super admin
        const isSuperAdmin = adminWithRoles.roles.includes('super_admin');
        const willRemoveSuperAdmin = isSuperAdmin && !roleNames.includes('super_admin');

        if (willRemoveSuperAdmin) {
          const otherSuperAdmins = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .innerJoin(adminRoles, eq(users.id, adminRoles.userId))
            .innerJoin(roles, eq(adminRoles.roleId, roles.id))
            .where(
              and(
                eq(roles.name, 'super_admin'),
                sql`${users.id} != ${adminId}`
              )
            )
            .then(result => Number(result[0].count));

          if (otherSuperAdmins === 0) {
            return res.status(400).json({
              error: "Cannot remove super_admin role from the last super administrator"
            });
          }
        }

        try {
          // Update admin and roles in a transaction
          await db.transaction(async (tx) => {
            // Update user details
            await tx
              .update(users)
              .set({
                email,
                username: email,
                firstName,
                lastName
              })
              .where(eq(users.id, adminId));

            console.log('Updated user details');

            // Remove existing roles
            await tx
              .delete(adminRoles)
              .where(eq(adminRoles.userId, adminId));

            console.log('Removed existing roles');

            // Add new roles
            for (const roleName of roleNames) {
              // Get or create role
              let [existingRole] = await tx
                .select()
                .from(roles)
                .where(eq(roles.name, roleName))
                .limit(1);

              if (!existingRole) {
                [existingRole] = await tx
                  .insert(roles)
                  .values({
                    name: roleName,
                    description: `${roleName} role`
                  })
                  .returning();
              }

              // Create role assignment
              await tx
                .insert(adminRoles)
                .values({
                  userId: adminId,
                  roleId: existingRole.id
                });

              console.log(`Added role: ${roleName}`);
            }

            // Update isAdmin status based on roles
            await tx
              .update(users)
              .set({
                isAdmin: roleNames.length > 0
              })
              .where(eq(users.id, adminId));

            console.log('Updated isAdmin status');
          });

          console.log('Transaction completed successfully');

          // Send success response
          res.json({
            message: "Administrator updated successfully",
            admin: {
              id: adminId,
              email,
              firstName,
              lastName,
              roles: roleNames
            }
          });

        } catch (txError) {
          console.error('Transaction error:', txError);
          throw txError;
        }

      } catch (error) {
        console.error('Error updating administrator:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
          error: "Failed to update administrator",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add administrator deletion endpoint
    app.delete('/api/admin/administrators/:id', isAdmin, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);

        // Verify admin exists and is not the last super admin
        const [adminToDelete] = await db
          .select({
            admin: users,
            roles: sql<string[]>`array_agg(${roles.name})`,
          })
          .from(users)
          .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
          .leftJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(eq(users.id, adminId))
          .groupBy(users.id)
          .limit(1);

        if (!adminToDelete) {
          return res.status(404).send("Administrator not found");
        }

        // Check if this is a super admin
        const isSuperAdmin = adminToDelete.roles.includes('super_admin');
        if (isSuperAdmin) {
          // Count other super admins
          const [{ count }] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(users)
            .innerJoin(adminRoles, eq(users.id, adminRoles.userId))
            .innerJoin(roles, eq(adminRoles.roleId, roles.id))
            .where(
              and(
                eq(roles.name, 'super_admin'),
                sql`${users.id} != ${adminId}`
              )
            );

          if (count === 0) {
            return res.status(400).send("Cannot delete the last super administrator");
          }
        }

        // Start a transaction to delete admin roles and user
        await db.transaction(async (tx) => {
          // Delete admin roles
          await tx
            .delete(adminRoles)
            .where(eq(adminRoles.userId, adminId));

          // Delete user
          await tx
            .delete(users)
            .where(eq(users.id, adminId));
        });

        res.json({ message: "Administrator deleted successfully" });
      } catch (error) {
        console.error('Error deleting administrator:', error);
        console.error("Error details:", error);
        res.status(500).send(error instanceof Error ? error.message : "Failed to delete administrator");
      }
    });

    // API endpoint to update user account information
    app.put('/api/user/account', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!firstName || !lastName) {
          return res.status(400).send("First name and last name are required");
        }

        // Update user
        await db
          .update(users)
          .set({
            firstName,
            lastName,
            phone: phone || null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.id, userId));

        // Get updated user
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        res.json({
          message: "Account updated successfully",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            isAdmin: updatedUser.isAdmin,
            isParent: updatedUser.isParent,
            householdId: updatedUser.householdId
          }
        });
      } catch (error) {
        console.error('Error updating user account:', error);
        res.status(500).send("Failed to update account information");
      }
    });

    // API endpoint to update user password
    app.put('/api/user/password', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!currentPassword || !newPassword) {
          return res.status(400).send("Current password and new password are required");
        }

        // Validate password length
        if (newPassword.length < 8) {
          return res.status(400).send("Password must be at least 8 characters long");
        }

        // Get user with password
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        // Check current password
        const isCurrentPasswordValid = await crypto.verify(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).send("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await crypto.hash(newPassword);

        // Update password
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.id, userId));

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Error updating user password:', error);
        res.status(500).send("Failed to update password");
      }
    });

    // API endpoint to update household information
    app.put('/api/household', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { address, city, state, zipCode } = req.body;
        const householdId = req.user.householdId;

        if (!householdId) {
          return res.status(400).send("You must be part of a household to update it");
        }

        // Validate required fields
        if (!address || !city || !state || !zipCode) {
          return res.status(400).send("Address, city, state, and ZIP code are required");
        }

        // Update household
        await db
          .update(households)
          .set({
            address,
            city,
            state,
            zipCode
          })
          .where(eq(households.id, householdId));

        // Get updated household
        const [updatedHousehold] = await db
          .select()
          .from(households)
          .where(eq(households.id, householdId))
          .limit(1);

        res.json({
          message: "Household information updated successfully",
          household: updatedHousehold
        });
      } catch (error) {
        console.error('Error updating household:', error);
        res.status(500).send("Failed to update household information");
      }
    });

    // API endpoint to get household details
    app.get('/api/household/details', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        // Create or get household for the user
        let householdId = req.user.householdId;
        let household;
        
        if (!householdId) {
          // If user doesn't have a household, create one
          const [newHousehold] = await db
            .insert(households)
            .values({
              lastName: req.user.lastName,
              address: "", // Default empty values
              city: "",
              state: "",
              zipCode: "",
              primaryEmail: req.user.email,
              createdAt: new Date().toISOString(),
            })
            .returning();
            
          // Update user with new household ID
          await db
            .update(users)
            .set({ householdId: newHousehold.id })
            .where(eq(users.id, req.user.id));
            
          household = newHousehold;
          
          // Update the session user object
          if (req.user) {
            req.user.householdId = newHousehold.id;
          }
        } else {
          // Get existing household details
          [household] = await db
            .select()
            .from(households)
            .where(eq(households.id, householdId))
            .limit(1);

          if (!household) {
            return res.status(404).send("Household not found");
          }
        }

        res.json(household);
      } catch (error) {
        console.error('Error fetching household details:', error);
        res.status(500).send("Failed to fetch household details");
      }
    });
    
    // Endpoint to update household information
    app.put('/api/household', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      
      try {
        const householdId = req.user.householdId;
        
        if (!householdId) {
          return res.status(400).send("User does not have a household");
        }
        
        const { address, city, state, zipCode } = req.body;
        
        // Update household details
        const [updatedHousehold] = await db
          .update(households)
          .set({
            address,
            city,
            state,
            zipCode,
          })
          .where(eq(households.id, householdId))
          .returning();
        
        if (!updatedHousehold) {
          return res.status(404).send("Household not found");
        }
        
        res.json(updatedHousehold);
      } catch (error) {
        console.error('Error updating household:', error);
        res.status(500).send("Failed to update household information");
      }
    });

    // Email availability check endpoint
    app.get('/api/check-email', async (req, res) => {
      try {
        const email = req.query.email as string;

        if (!email) {
          return res.status(400).json({ available: false, message: "Email is required" });
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Add a small delay to prevent brute force attempts
        await new Promise(resolve => setTimeout(resolve, 200));

        return res.json({
          available: !existingUser,
          message: existingUser ? "Email is already in use" : undefined
        });
      } catch (error) {
        console.error('Error checking email availability:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        return res.status(500).json({ available: false, message: "Internal server error" });
      }
    });

    // Add household invitation endpoints
    app.post('/api/household/invite', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { email } = req.body;
        const userId = req.user.id;
        const householdId = req.user.householdId;

        if (!householdId) {
          return res.status(400).send("You must be part of a household to send invitations");
        }

        // Check if email exists in the system
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).send("This email is already registered in the system");
        }

        // Check for existing pending invitation
        const [existingInvitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.email, email),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (existingInvitation) {
          return res.status(400).send("An invitation is already pending for this email");
        }

        // Generate invitation token and set expiration
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

        // Create invitation
        const [invitation] = await db
          .insert(householdInvitations)
          .values({
            householdId: householdId,
            email: email,
            token: token,
            status: 'pending',
            expiresAt: expiresAt,
            createdBy: userId,
            createdAt: new Date(), // Use Date object directly
          } as typeof householdInvitations.$inferInsert)
          .returning();

        // TODO: Send email with invitation link

        res.json({ message: "Invitation sent successfully", invitation });
      } catch (error) {
        console.error('Error sending invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to send invitation");
      }
    });

    app.get('/api/household/invitations', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        // Check if user has a household
        let householdId = req.user.householdId;
        
        if (!householdId) {
          // Return empty array instead of error if user doesn't have a household yet
          return res.json([]);
        }

        const invitations = await db
          .select({
            invitation: householdInvitations,
            createdByUser: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            },
          })
          .from(householdInvitations)
          .leftJoin(users, eq(householdInvitations.createdBy, users.id))
          .where(eq(householdInvitations.householdId, householdId));

        res.json(invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch invitations");
      }
    });

    app.post('/api/household/invitations/:token/accept', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { token } = req.params;
        const userId = req.user.id;

        // Find and validate invitation
        const [invitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.token, token),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }

        if (new Date(invitation.expiresAt) < new Date()) {
          await db
            .update(householdInvitations)
            .set({ status: 'expired' })
            .where(eq(householdInvitations.id, invitation.id));

          return res.status(400).send("Invitation has expired");
        }

        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }

        // Update user's household
        await db
          .update(users)
          .set({ householdId: invitation.householdId })
          .where(eq(users.id, userId));

        // Mark invitation as accepted
        await db
          .update(householdInvitations)
          .set({ status: 'accepted' })
          .where(eq(householdInvitations.id, invitation.id));

        res.json({ message: "Invitation accepted successfully" });
      } catch (error) {
        console.error('Error accepting invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to accept invitation");
      }
    });

    app.post('/api/household/invitations/:token/decline', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { token } = req.params;

        // Find and validate invitation
        const [invitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.token, token),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }

        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }

        // Mark invitation as declined
        await db
          .update(householdInvitations)
          .set({ status: 'declined' })
          .where(eq(householdInvitations.id, invitation.id));

        res.json({ message: "Invitation declined successfully" });
      } catch (error) {
        console.error('Error declining invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to decline invitation");
      }
    });

    // Complex management routes
    app.get('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const complexesWithFields = await db
          .select({
            complex: {
              id: complexes.id,
              name: complexes.name,
              address: complexes.address,
              city: complexes.city,
              state: complexes.state,
              country: complexes.country,
              openTime: complexes.openTime,
              closeTime: complexes.closeTime,
              rules: complexes.rules,
              directions: complexes.directions,
              isOpen: complexes.isOpen,
              createdAt: complexes.createdAt,
              updatedAt: complexes.updatedAt,
            },
            fields: sql<any>`json_agg(
              CASE WHEN ${fields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${fields.id},
                  'name', ${fields.name},
                  'hasLights', ${fields.hasLights},
                  'hasParking', ${fields.hasParking},
                  'isOpen', ${fields.isOpen},
                  'specialInstructions', ${fields.specialInstructions}
                )
              ELSE NULL
              END
            )`.mapWith((f) => f === null ? [] : f.filter(Boolean)),
            openFields: sql<number>`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
            closedFields: sql<number>`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number),
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id)
          .orderBy(complexes.name);

        // Format the response
        const formattedComplexes = complexesWithFields.map(({ complex, fields, openFields, closedFields }) => ({
          ...complex,
          fields: fields || [],
          openFields,
          closedFields
        }));

        // Add debug logging
        console.log('Complexes retrieved:', formattedComplexes.length);

        res.json(formattedComplexes);
      } catch (error) {
        console.error('Error fetching complexes:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const [newComplex] = await db
          .insert(complexes)
          .values({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            latitude: req.body.latitude || null,
            longitude: req.body.longitude || null,
            openTime: req.body.openTime,
            closeTime: req.body.closeTime,
            rules: req.body.rules || null,
            directions: req.body.directions || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

        res.json(newComplex);
      } catch (error) {
        console.error('Error creating complex:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create complex");
      }
    });

    // Add complex update endpoint after the create endpoint

    // Add complex update endpoint after the create endpoint
    app.patch('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const [updatedComplex] = await db
          .update(complexes)
          .set({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            latitude: req.body.latitude || null,
            longitude: req.body.longitude || null,
            openTime: req.body.openTime,
            closeTime: req.body.closeTime,
            rules: req.body.rules || null,
            directions: req.body.directions || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(complexes.id, complexId))
          .returning();

        if (!updatedComplex) {
          return res.status(404).send("Complex not found");
        }

        res.json(updatedComplex);
      } catch (error) {
        console.error('Error updating complex:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update complex");
      }
    });

    // Add complex status update endpoint
    app.patch('/api/admin/complexes/:id/status', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const { isOpen } = req.body;

        // Start a transaction to update both complex and fields
        await db.transaction(async (tx) => {
          // Update complex status
          const [updatedComplex] = await tx
            .update(complexes)
            .set({
              isOpen,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(complexes.id, complexId))
            .returning();

          if (!updatedComplex) {
            return res.status(404).send("Complex not found");
          }

          // Update all fields based on complex status
          await tx
            .update(fields)
            .set({
              isOpen,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(fields.complexId, complexId));

          res.json(updatedComplex);
        });
      } catch (error) {
        console.error('Error updating complex status:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update complex status");
      }
    });

    // Add complex deletion endpoint
app.delete('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);

        // First delete all fields associated with this complex
        await db
          .delete(fields)
          .where(eq(fields.complexId, complexId));

        // Then delete the complex
        const [deletedComplex] = await db
          .delete(complexes)
          .where(eq(complexes.id, complexId))
          .returning();

        if (!deletedComplex) {
          return res.status(404).send("Complex not found");
        }

        res.json(deletedComplex);
      } catch (error) {
        console.error('Error deleting complex:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to delete complex");
      }
    });

    // Analytics endpoint for complexes
    app.get('/api/admin/complexes/analytics', isAdmin, async (req, res) => {
      try {
        // Get all complexes with their fields
        const complexesWithFields = await db
          .select({
            complex: complexes,
            fieldCount: sql<number>`count(${fields.id})`.mapWith(Number)
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id)
          .orderBy(complexes.name);

        if (complexesWithFields.length === 0) {
          return res.json({
            totalComplexes: 0,
            totalFields: 0,
            eventsToday: 0,
            averageUsage: 0,
            message: "Start by adding your first complex and scheduling events to see analytics!",
            mostActiveComplex: null
          });
        }

        // Calculate totals
        const totalComplexes = complexesWithFields.length;
        const totalFields = complexesWithFields.reduce((sum, complex) =>
          sum + Number(complex.fieldCount), 0);

        // Find the complex with most fields
        const mostActive = complexesWithFields.reduce((prev, current) =>
          Number(current.fieldCount) > Number(prev.fieldCount) ? current : prev
        );

        res.json({
          totalComplexes,
          totalFields,
          eventsToday: 0, // This will be implemented when events are added
          averageUsage: 0, // This will be implemented when usage tracking is added
          message: totalFields === 0 ?
            "Add fields to your complexes and start scheduling events to see usage analytics!" :
            undefined,
          mostActiveComplex: {
            name: mostActive.complex.name,
            address: mostActive.complex.address,
            fieldCount: Number(mostActive.fieldCount)
          }
        });
      } catch (error) {
        console.error('Error fetching complex analytics:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch analytics");
      }
    });


    // Organization settings endpoints
    app.get('/api/admin/organization-settings', isAdmin, async (req, res) => {
      try {
        const [settings] = await db
          .select({
            id: organizationSettings.id,
            name: organizationSettings.name,
            primaryColor: organizationSettings.primaryColor,
            secondaryColor: organizationSettings.secondaryColor,
            logoUrl: organizationSettings.logoUrl,
            createdAt: organizationSettings.createdAt,
            updatedAt: organizationSettings.updatedAt,
          })
          .from(organizationSettings)
          .limit(1);

        // Add caching to improve dashboard load times
        // Cache for 5 minutes, must revalidate if stale
        res.set('Cache-Control', 'private, max-age=300, must-revalidate');
        res.json(settings || {});
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/organization-settings', isAdmin, async (req, res) => {
      try {
        const [existingSettings] = await db
          .select()
          .from(organizationSettings)
          .limit(1);

        const updatedSettings = {
          ...req.body,
          updatedAt: new Date().toISOString(),
        };

        let settings;
        if (existingSettings) {
          [settings] = await db
            .update(organizationSettings)
            .set(updatedSettings)
            .where(eq(organizationSettings.id, existingSettings.id))
            .returning();
        } else {
          [settings] = await db
            .insert(organizationSettings)
            .values({
              ...req.body,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();
        }

        res.json(settings);
      } catch (error) {
        console.error('Error updating organization settings:', error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    
    // Add endpoints for organization domain management
    app.get('/api/admin/organizations', isAdmin, async (req, res) => {
      try {
        const organizations = await db
          .select()
          .from(organizationSettings)
          .orderBy(organizationSettings.name);
          
        res.json(organizations);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).send("Failed to fetch organizations");
      }
    });
    
    app.post('/api/admin/organizations', isAdmin, async (req, res) => {
      try {
        const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
        
        // Check if domain is already in use
        if (domain) {
          const [existingOrg] = await db
            .select()
            .from(organizationSettings)
            .where(eq(organizationSettings.domain, domain))
            .limit(1);
            
          if (existingOrg) {
            return res.status(400).json({ error: "Domain is already in use" });
          }
        }
        
        const [organization] = await db
          .insert(organizationSettings)
          .values({
            name,
            domain,
            primaryColor: primaryColor || '#000000',
            secondaryColor: secondaryColor || '#32CD32',
            logoUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();
          
        res.status(201).json(organization);
      } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).send("Failed to create organization");
      }
    });

    // Coupon management endpoints
    app.get('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
        const query = db.select().from(coupons);

        if (eventId) {
          query.where(eq(coupons.eventId, eventId));
        }

        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });

    app.post('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
        } = req.body;

        // Verify if coupon code already exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, code))
          .limit(1);

        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [newCoupon] = await db
          .insert(coupons)
          .values({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            usageCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        res.json(newCoupon);
      } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });

    app.patch('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;

        // Check if the coupon exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId))
          .limit(1);

        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        // Check if the new code already exists (if code is being changed)
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, code))
            .limit(1);

          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [updatedCoupon] = await db
          .update(coupons)
          .set({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive,
            updatedAt: new Date()
          })
          .where(eq(coupons.id, couponId))
          .returning();

        res.json(updatedCoupon);
      } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    }); 

    // Coupon management endpoints
    app.get('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
        const query = db.select().from(coupons);

        if (eventId) {
          query.where(eq(coupons.eventId, eventId));
        }

        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });

    app.post('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
        } = req.body;

        // Verify if coupon code already exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, code))
          .limit(1);

        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [newCoupon] = await db
          .insert(coupons)
          .values({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            usageCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        res.json(newCoupon);
      } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });

    app.patch('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;

        // Check if the coupon exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId))
          .limit(1);

        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        // Check if the new code already exists (if code is being changed)
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, code))
            .limit(1);

          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [updatedCoupon] = await db
          .update(coupons)
          .set({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive,
            updatedAt: new Date()
          })
          .where(eq(coupons.id, couponId))
          .returning();

        res.json(updatedCoupon);
      } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });

    app.delete('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);

        const [deletedCoupon] = await db
          .delete(coupons)
          .where(eq(coupons.id, couponId))
          .returning();

        if (!deletedCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        res.json({ message: "Coupon deleted successfully" });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: "Failed to delete coupon" });
      }
    });

    // Styling settings endpoints
    app.get('/api/admin/styling', isAdmin, async (req, res) => {
      try {
        const [settings] = await db
          .select({
            id: organizationSettings.id,
            name: organizationSettings.name,
            primaryColor: organizationSettings.primaryColor,
            secondaryColor: organizationSettings.secondaryColor,
            logoUrl: organizationSettings.logoUrl,
          })
          .from(organizationSettings)
          .limit(1);

        // Convert database values to style config format
        const styleConfig = {
          primary: settings?.primaryColor || '#000000',
          secondary: settings?.secondaryColor || '#32CD32',
          accent: '#FF8C00',
          background: settings?.backgroundColor || '#F5F5F6',
          foreground: '#000000',
          border: '#CCCCCCCC',
          muted: '#999999',
          hover: '#FF8C00',
          active: '#32CD32',
          success: '#32CD32',
          warning: '#FF8C00',
          destructive: '#E63946',
          // Admin dashboard specific colors
          adminNavBackground: settings?.adminNavBackground || '#FFFFFF',
          adminNavText: settings?.adminNavText || '#000000',
          adminNavActive: settings?.adminNavActive || settings?.primaryColor || '#000000',
          adminNavHover: settings?.adminNavHover || '#f3f4f6',
          // Admin role colors
          superAdmin: '#DB4D4D',
          tournamentAdmin: '#4CAF50',
          scoreAdmin: '#4169E1',
          financeAdmin: '#9C27B0',
          logoUrl: settings?.logoUrl || '/uploads/MatchProAI_Linear_Black.png',
          youtubeVideoId: '8DFc6wHHWPY'
        };

        res.json(styleConfig);
      } catch (error) {
        console.error('Error fetching styling settings:', error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/styling', isAdmin, async (req, res) => {
      try {
        const styleConfig = req.body;

        // Update organization settings with the new colors
        const [settings] = await db
          .select()
          .from(organizationSettings)
          .limit(1);

        if (settings) {
          await db
            .update(organizationSettings)
            .set({
              primaryColor: styleConfig.primary,
              secondaryColor: styleConfig.secondary,
              backgroundColor: styleConfig.background,
              logoUrl: styleConfig.logoUrl,
              adminNavBackground: styleConfig.adminNavBackground,
              adminNavText: styleConfig.adminNavText,
              adminNavActive: styleConfig.adminNavActive,
              adminNavHover: styleConfig.adminNavHover,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(organizationSettings.id, settings.id));
        } else {
          await db
            .insert(organizationSettings)
            .values({
              primaryColor: styleConfig.primary,
              secondaryColor: styleConfig.secondary,
              backgroundColor: styleConfig.background, 
              logoUrl: styleConfig.logoUrl,
              adminNavBackground: styleConfig.adminNavBackground,
              adminNavText: styleConfig.adminNavText,
              adminNavActive: styleConfig.adminNavActive,
              adminNavHover: styleConfig.adminNavHover,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
        }

        res.json({ message: "Styling settings updated successfully" });
      } catch (error) {
        console.error('Error updating styling settings:', error);
        res.status(500).send("Failed to update styling settings");
      }
    });

    // Admin routes
    app.get('/api/admin/users', isAdmin, async (req, res) => {
      try {
        const allUsers = await db
          .select()
          .from(users)
          .orderBy(users.createdAt);

        // Remove password field from response
        const sanitizedUsers = allUsers.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });

    // File management routes
    app.use('/api/admin/files', isAdmin, uploadRouter);
    app.use('/api/folders', foldersRouter);
    
    // CSV upload helper for team registrations
    app.use('/api/upload', csvUploadRouter);
    
    // User routes
    app.use('/api/user', userRouter);

    // Add bulk action endpoint after the upload router registration
    app.post('/api/files/bulk', isAdmin, async (req, res) => {
      try {
        const { action, fileIds, targetFolderId } = req.body;

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
          return res.status(400).json({ error: "No files selected" });
        }

        switch (action) {
          case 'delete':
            // Delete files from storage and database
            for (const fileId of fileIds) {
              try {
                // Get file info first
                const [file] = await db
                  .select()
                  .from(files)
                  .where(eq(files.id, fileId))
                  .limit(1);

                if (file) {
                  // Delete physical file
                  const filePath = path.join(process.cwd(), 'uploads', path.basename(file.url));
                  await fs.unlink(filePath).catch(() => {
                    // Ignore error if file doesn't exist
                    console.log(`Physical file not found: ${filePath}`);
                  });

                  // Delete from database
                  await db
                    .delete(files)
                    .where(eq(files.id, fileId));
                }
              } catch (error) {
                console.error(`Error deleting file ${fileId}:`, error);
              }
            }
            break;

          case 'move':
            if (!targetFolderId) {
              return res.status(400).json({ error: "Target folder not specified" });
            }

            // Update file records with new folder ID
            await db
              .update(files)
              .set({ 
                folderId: targetFolderId,
                updatedAt: new Date().toISOString()
              })
              .where(inArray(files.id, fileIds));
            break;

          default:
            return res.status(400).json({ error: "Invalid action" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Error performing bulk action:', error);
        res.status(500).json({ error: "Failed to perform bulk action" });
      }
    });

    // Theme update endpoint
    app.post('/api/theme', async (req, res) => {
      try {
        const themeData = req.body;
        const themePath = path.resolve(process.cwd(), 'theme.json');

        await fs.writeFile(themePath, JSON.stringify(themeData, null, 2));

        res.json({ message: 'Theme updated successfully' });
      } catch (error) {
        console.error('Error updating theme:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).json({ message: 'Failed to update theme' });
      }
    });

    // Add field creation endpoint
    app.post('/api/admin/fields', isAdmin, async (req, res) => {
      try {
        const [newField] = await db
          .insert(fields)
          .values({
            name: req.body.name,
            hasLights: req.body.hasLights,
            hasParking: req.body.hasParking,
            specialInstructions: req.body.specialInstructions || null,
            complexId: req.body.complexId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

        res.json(newField);
      } catch (error) {
        console.error('Error creating field:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create field");
      }
    });

    // Add field listing endpoint
    app.get('/api/admin/complexes/:id/fields', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const complexFields = await db
          .select()
          .from(fields)
          .where(eq(fields.complexId, complexId))
          .orderBy(fields.name);

        res.json(complexFields);
      } catch (error) {
        console.error('Error fetching fields:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch fields");
      }
    });

    // Delete field endpoint (fixed syntax error)
    app.delete('/api/admin/fields/:id', isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const [deletedField] = await db
          .delete(fields)
          .where(eq(fields.id, fieldId))
          .returning();

        if (!deletedField) {
          return res.status(404).send("Field not found");
        }

        res.json(deletedField);
      } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).send("Failed to delete field");
      }
    });

    // Update the field status endpoint to respect complex status
    app.patch('/api/admin/fields/:id/status', isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const { isOpen } = req.body;

        // First check if the complex is open
        const [field] = await db
          .select({
            field: fields,
            complexIsOpen: complexes.isOpen,
          })
          .from(fields)
          .innerJoin(complexes, eq(fields.complexId, complexes.id))
          .where(eq(fields.id, fieldId));

        if (!field) {
          return res.status(404).send("Field not found");
        }

        // If trying to open a field while complex is closed, return error
        if (isOpen && !field.complexIsOpen) {
          return res.status(400).send("Cannot open field when complex is closed");
        }

        const [updatedField] = await db
          .update(fields)
          .set({
            isOpen,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(fields.id, fieldId))
          .returning();

        res.json(updatedField);
      } catch (error) {
        console.error('Error updating field status:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update field status");
      }
    });

    // Add these new routes for profile management
    app.put('/api/user/profile', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

        // Check if email is already taken by another user
        if (email !== req.user.email) {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            return res.status(400).send("Email already in use");
          }
        }

        // Update user profile
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName,
            lastName,
            email,
            phone,
            // Store address fields as JSON in the metadata field if they exist
            ...(address || city || state || zipCode ? {
              metadata: JSON.stringify({
                address,
                city,
                state,
                zipCode
              })
            } : {}),
            updatedAt: new Date().toISOString(),
          } as typeof users.$inferInsert)
          .where(eq(users.id, req.user.id))
          .returning();

        // Update session
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).send("Failed to update session");
          }
          res.json(updatedUser);
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update profile");
      }
    });

    app.put('/api/user/password', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await crypto.compare(currentPassword, req.user.password);
        if (!isMatch) {
          return res.status(400).send("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await crypto.hash(newPassword);

        // Update password
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
          } as typeof users.$inferInsert)
          .where(eq(users.id, req.user.id));

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Error updating password:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update password");
      }
    });

    // User account management endpoints
    app.put('/api/user/account', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const userId = req.user.id;
        const { firstName, lastName, phone } = req.body;

        // Validate input
        if (!firstName || !lastName) {
          return res.status(400).send("First name and last name are required");
        }

        // Update user data
        await db
          .update(users)
          .set({
            firstName,
            lastName,
            phone: phone || null,
            // Explicitly cast to partial user to help TypeScript
          } as Partial<typeof users.$inferInsert>)
          .where(eq(users.id, userId));

        // Get updated user
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        // Remove sensitive data before returning
        const { password, ...userData } = updatedUser;
        
        res.json({
          message: "Account updated successfully",
          user: userData
        });
      } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).send("Failed to update account information");
      }
    });

    // Password update endpoint
    app.put('/api/user/password', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
          return res.status(400).send("Current password and new password are required");
        }

        // Get user with current password
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          return res.status(404).send("User not found");
        }

        // Verify current password
        const isMatch = await crypto.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).send("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await crypto.hash(newPassword);

        // Update password
        await db
          .update(users)
          .set({
            password: hashedPassword,
          } as Partial<typeof users.$inferInsert>)
          .where(eq(users.id, userId));

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send("Failed to update password");
      }
    });

    // Password reset request endpoint
    app.post('/api/auth/forgot-password', requestPasswordReset);

    // Verify password reset token
    app.post('/api/auth/verify-reset-token', verifyResetToken);

    // Complete password reset (set new password)
    app.post('/api/auth/reset-password', completePasswordReset);
    
    // Get current user's registrations
    app.get('/api/user/registrations', (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      next();
    }, getCurrentUserRegistrations);

    // Event creation endpoint
    app.post('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const formData = req.body;

        // Ensure we have valid data
        if (!formData || typeof formData !== 'object') {
          return res.status(400).json({ 
            error: "Invalid request body"
          });
        }

        const { name, startDate, endDate, timezone, applicationDeadline } = formData;

        if (!name || !startDate || !endDate || !applicationDeadline) {
          return res.status(400).json({ 
            error: "Name, start date, end date, and registration deadline are required" 
          });
        }

        // Create the event
        const eventId = crypto.generateEventId();
        const [newEvent] = await db.transaction(async (tx) => {
          // Create main event
          const [event] = await tx
            .insert(events)
            .values({
              id: eventId,
              name,
              startDate,
              endDate,
              timezone: timezone || 'America/New_York',
              applicationDeadline,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          // Handle age groups if provided
          if (formData.selectedScopeId && formData.selectedAgeGroupIds) {
            const selectedAgeGroups = await tx
              .select()
              .from(ageGroupSettings)
              .where(and(
                eq(ageGroupSettings.seasonalScopeId, formData.selectedScopeId),
                inArray(ageGroupSettings.id, formData.selectedAgeGroupIds)
              ));

            // Create event age groups
            for (const group of selectedAgeGroups) {
              await tx
                .insert(eventAgeGroups)
                .values({
                  eventId,
                  ageGroup: group.ageGroup,
                  birthYear: group.birthYear,
                  gender: group.gender,
                  fieldSize: "11v11", // Default value, can be updated later
                  projectedTeams: 8, // Default value, can be updated later
                  seasonalScopeId: group.seasonalScopeId,
                  createdAt: new Date().toISOString(),
                });
            }
          }

          return [event];
        });

        res.status(201).json({ message: "Event created successfully", event: newEvent });
      } catch (error) {
        console.error('Error creating event:', error);
        console.error("Error details:", error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to create event",
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Add this new update endpoint after the existing event creation endpoint
    app.patch('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        let eventData;

        if (req.headers['content-type']?.includes('multipart/form-data')) {
          eventData = JSON.parse(req.body.data);
        } else {
          eventData = req.body;
        }

        // Start a transaction to update event and related records
        await db.transaction(async (tx) => {
          console.log('Updating event with data:', JSON.stringify(eventData, null, 2));
          
          // Update the event
          const [updatedEvent] = await tx
            .update(events)
            .set({
              name: eventData.name,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              timezone: eventData.timezone,
              applicationDeadline: eventData.applicationDeadline,
              details: eventData.details || null,
              agreement: eventData.agreement || null,
              refundPolicy: eventData.refundPolicy || null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(events.id, eventId))
            .returning();
            
          // Handle branding settings
          if (eventData.branding) {
            // Process each branding property and save in event_settings
            const brandingProps = [
              { key: 'branding.logoUrl', value: eventData.branding.logoUrl },
              { key: 'branding.primaryColor', value: eventData.branding.primaryColor },
              { key: 'branding.secondaryColor', value: eventData.branding.secondaryColor }
            ];
            
            for (const { key, value } of brandingProps) {
              if (value !== undefined) {
                // Check if setting already exists
                const existingSetting = await tx
                  .select()
                  .from(eventSettings)
                  .where(and(
                    eq(eventSettings.eventId, eventId),
                    eq(eventSettings.settingKey, key)
                  ));
                
                if (existingSetting.length > 0) {
                  // Update existing setting
                  await tx
                    .update(eventSettings)
                    .set({
                      settingValue: value || '',
                      updatedAt: new Date().toISOString()
                    })
                    .where(eq(eventSettings.id, existingSetting[0].id));
                } else if (value) {
                  // Insert new setting (only if value exists)
                  await tx
                    .insert(eventSettings)
                    .values({
                      eventId,
                      settingKey: key,
                      settingValue: value,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                }
              }
            }
          }
          
          // Handle general event settings
          if (eventData.settings && Array.isArray(eventData.settings)) {
            console.log('Processing event settings:', eventData.settings);
            
            for (const setting of eventData.settings) {
              if (setting.key && setting.value !== undefined) {
                // Check if this setting already exists
                const existingSetting = await tx
                  .select()
                  .from(eventSettings)
                  .where(and(
                    eq(eventSettings.eventId, eventId),
                    eq(eventSettings.settingKey, setting.key)
                  ));
                
                if (existingSetting.length > 0) {
                  // Update existing setting
                  await tx
                    .update(eventSettings)
                    .set({
                      settingValue: setting.value,
                      updatedAt: new Date().toISOString()
                    })
                    .where(eq(eventSettings.id, existingSetting[0].id));
                } else {
                  // Insert new setting
                  await tx
                    .insert(eventSettings)
                    .values({
                      eventId,
                      settingKey: setting.key,
                      settingValue: setting.value,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                }
              }
            }
          }

          if (!updatedEvent) {
            throw new Error("Event not found");
          }

          // Update complex assignments
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ${eventId}`);

          if (eventData.selectedComplexIds && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${new Date().toISOString()})`
              );
            }
          }

          // Update field size assignments
          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, eventId));

          if (eventData.complexFieldSizes) {
            for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
              await tx
                .insert(eventFieldSizes)
                .values({
                  eventId,
                  fieldId: parseInt(fieldId),
                  fieldSize: fieldSize as string,
                  createdAt: new Date().toISOString(),
                });
            }
          }

          if (!updatedEvent) {
            throw new Error("Event not found");
          }

          // Get existing agegroups
          const existingAgeGroups = await tx
            .select()
            .from(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, eventId));

          // Get age groups that have teams
          const ageGroupsWithTeams = await tx
            .select({
              ageGroupId: teams.ageGroupId,
              teamCount: sql<number>`count(*)`.mapWith(Number)
            })
            .from(teams)
            .where(eq(teams.eventId, eventId))
            .groupBy(teams.ageGroupId);

          const ageGroupsWithTeamsMap = new Map(
            ageGroupsWithTeams.map(({ ageGroupId, teamCount }) => [ageGroupId, teamCount])
          );

          // Map of existing age groups by their properties for comparison
          const existingAgeGroupsMap = new Map(
            existingAgeGroups.map(group => [
              `${group.gender}-${group.ageGroup}-${group.fieldSize}`,
              group
            ])
          );

          // Define standard age groups directly rather than importing from client
          const PREDEFINED_AGE_GROUPS = [
            { ageGroup: 'U8', gender: 'Boys', birthYear: 2017, divisionCode: 'B2017' },
            { ageGroup: 'U8', gender: 'Girls', birthYear: 2017, divisionCode: 'G2017' },
            { ageGroup: 'U9', gender: 'Boys', birthYear: 2016, divisionCode: 'B2016' },
            { ageGroup: 'U9', gender: 'Girls', birthYear: 2016, divisionCode: 'G2016' },
            { ageGroup: 'U10', gender: 'Boys', birthYear: 2015, divisionCode: 'B2015' },
            { ageGroup: 'U10', gender: 'Girls', birthYear: 2015, divisionCode: 'G2015' },
            { ageGroup: 'U11', gender: 'Boys', birthYear: 2014, divisionCode: 'B2014' },
            { ageGroup: 'U11', gender: 'Girls', birthYear: 2014, divisionCode: 'G2014' },
            { ageGroup: 'U12', gender: 'Boys', birthYear: 2013, divisionCode: 'B2013' },
            { ageGroup: 'U12', gender: 'Girls', birthYear: 2013, divisionCode: 'G2013' },
            { ageGroup: 'U13', gender: 'Boys', birthYear: 2012, divisionCode: 'B2012' },
            { ageGroup: 'U13', gender: 'Girls', birthYear: 2012, divisionCode: 'G2012' },
            { ageGroup: 'U14', gender: 'Boys', birthYear: 2011, divisionCode: 'B2011' },
            { ageGroup: 'U14', gender: 'Girls', birthYear: 2011, divisionCode: 'G2011' },
            { ageGroup: 'U15', gender: 'Boys', birthYear: 2010, divisionCode: 'B2010' },
            { ageGroup: 'U15', gender: 'Girls', birthYear: 2010, divisionCode: 'G2010' },
            { ageGroup: 'U16', gender: 'Boys', birthYear: 2009, divisionCode: 'B2009' },
            { ageGroup: 'U16', gender: 'Girls', birthYear: 2009, divisionCode: 'G2009' },
            { ageGroup: 'U17', gender: 'Boys', birthYear: 2008, divisionCode: 'B2008' },
            { ageGroup: 'U17', gender: 'Girls', birthYear: 2008, divisionCode: 'G2008' },
            { ageGroup: 'U18', gender: 'Boys', birthYear: 2007, divisionCode: 'B2007' },
            { ageGroup: 'U18', gender: 'Girls', birthYear: 2007, divisionCode: 'G2007' },
            { ageGroup: 'U19', gender: 'Boys', birthYear: 2006, divisionCode: 'B2006' },
            { ageGroup: 'U19', gender: 'Girls', birthYear: 2006, divisionCode: 'G2006' }
          ];

          // Always ensure all standard age groups exist for every event
          for (const group of PREDEFINED_AGE_GROUPS) {
            const groupKey = group.divisionCode;
            const existingGroup = existingAgeGroupsMap.get(groupKey);

            // Calculate appropriate field size based on age group
            const ageNum = group.ageGroup.startsWith('U') ? 
              parseInt(group.ageGroup.substring(1)) : 18;

            const fieldSize = ageNum <= 7 ? '4v4' : 
                              ageNum <= 10 ? '7v7' : 
                              ageNum <= 12 ? '9v9' : '11v11';

            if (existingGroup) {
              // Update existing group - just maintain the basic info
              await tx
                .update(eventAgeGroups)
                .set({
                  ageGroup: group.ageGroup,
                  gender: group.gender,
                  divisionCode: group.divisionCode,
                  birthDateStart: existingGroup.birthDateStart,
                  birthDateEnd: existingGroup.birthDateEnd,
                  fieldSize: fieldSize,
                  // Keep existing values for these fields
                  projectedTeams: existingGroup.projectedTeams,
                  amountDue: existingGroup.amountDue,
                  scoringRule: existingGroup.scoringRule,
                })
                .where(eq(eventAgeGroups.id, existingGroup.id));

              // Remove from map since we've processed it
              existingAgeGroupsMap.delete(groupKey);
            } else {
              // Create new standard group
              await tx
                .insert(eventAgeGroups)
                .values({
                  eventId,
                  gender: group.gender,
                  ageGroup: group.ageGroup,
                  divisionCode: group.divisionCode,
                  projectedTeams: 0,
                  birthDateStart: null,
                  birthDateEnd: null,
                  scoringRule: null,
                  fieldSize: fieldSize,
                  amountDue: null,
                  createdAt: new Date().toISOString(),
                });
            }
          }

          // Handle age groups from seasonal scope if it was changed
          if (eventData.seasonalScopeId) {
            const seasonalScopeId = parseInt(eventData.seasonalScopeId.toString());
            console.log(`Event update is using seasonal scope: ${seasonalScopeId}`);
            
            // Get age groups from the seasonal scope
            const scopeAgeGroups = await tx
              .select()
              .from(ageGroupSettings)
              .where(eq(ageGroupSettings.seasonalScopeId, seasonalScopeId));
            
            console.log(`Found ${scopeAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);
            
            if (scopeAgeGroups.length > 0) {
              // Find any existing age groups from this event that have teams to preserve
              const ageGroupsToPreserve = new Map();
              for (const group of existingAgeGroups) {
                if (ageGroupsWithTeamsMap.has(group.id)) {
                  // Keep age groups that have teams
                  ageGroupsToPreserve.set(group.id, group);
                }
              }
              
              // Delete all existing age groups that don't have teams
              const idsToKeep = Array.from(ageGroupsToPreserve.keys());
              if (idsToKeep.length > 0) {
                console.log(`Preserving ${idsToKeep.length} age groups that have teams`);
                await tx
                  .delete(eventAgeGroups)
                  .where(and(
                    eq(eventAgeGroups.eventId, eventId), 
                    notInArray(eventAgeGroups.id, idsToKeep)
                  ));
              } else {
                // Delete all existing age groups if none have teams
                console.log('Removing all existing age groups and replacing with scope age groups');
                await tx
                  .delete(eventAgeGroups)
                  .where(eq(eventAgeGroups.eventId, eventId));
              }
              
              // Create a map of existing age groups after deletion (only ones with teams)
              const existingAgeGroupMap = new Map();
              for (const group of Array.from(ageGroupsToPreserve.values())) {
                const key = `${group.gender}-${group.ageGroup}`;
                existingAgeGroupMap.set(key, group);
              }
              
              // Add all age groups from the seasonal scope
              for (const scopeGroup of scopeAgeGroups) {
                const key = `${scopeGroup.gender}-${scopeGroup.ageGroup}`;
                const existingGroup = existingAgeGroupMap.get(key);
                
                if (!existingGroup) {
                  // Calculate field size based on age group
                  const ageNum = scopeGroup.ageGroup.startsWith('U') ? 
                    parseInt(scopeGroup.ageGroup.substring(1)) : 18;
                  
                  const fieldSize = ageNum <= 7 ? '4v4' : 
                                    ageNum <= 10 ? '7v7' : 
                                    ageNum <= 12 ? '9v9' : '11v11';
                                    
                  await tx
                    .insert(eventAgeGroups)
                    .values({
                      eventId,
                      ageGroup: scopeGroup.ageGroup,
                      birthYear: scopeGroup.birthYear,
                      gender: scopeGroup.gender,
                      divisionCode: scopeGroup.divisionCode,
                      fieldSize: fieldSize,
                      projectedTeams: 8,
                      createdAt: new Date().toISOString(),
                      birthDateStart: new Date(scopeGroup.birthYear, 0, 1).toISOString().split('T')[0],
                      birthDateEnd: new Date(scopeGroup.birthYear, 11, 31).toISOString().split('T')[0],
                      seasonalScopeId: seasonalScopeId,
                      scoringRule: null,
                      amountDue: null,
                    });
                }
              }
              
              // Save the seasonal scope ID in event settings
              const existingSetting = await tx
                .select()
                .from(eventSettings)
                .where(and(
                  eq(eventSettings.eventId, eventId),
                  eq(eventSettings.settingKey, 'seasonalScopeId')
                ))
                .limit(1);
                
              if (existingSetting.length > 0) {
                await tx
                  .update(eventSettings)
                  .set({
                    settingValue: seasonalScopeId.toString(),
                    updatedAt: new Date().toISOString()
                  })
                  .where(eq(eventSettings.id, existingSetting[0].id));
              } else {
                await tx
                  .insert(eventSettings)
                  .values({
                    eventId,
                    settingKey: 'seasonalScopeId',
                    settingValue: seasonalScopeId.toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
              }
            }
          }
          
          // Handle age groups that were removed
          const remainingGroups = Array.from(existingAgeGroupsMap.entries());
          for (const [, group] of remainingGroups) {
            // Check if the age group has teams
            if (!ageGroupsWithTeamsMap.has(group.id)) {
              // Only delete if no teams are associated
              await tx
                .delete(eventAgeGroups)
                .where(eq(eventAgeGroups.id, group.id));
            }
          }

          // Update complex assignments
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ${eventId}`);

          // Only process selectedComplexIds if it's an array
          if (Array.isArray(eventData.selectedComplexIds) && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${new Date().toISOString()})`
              );
            }
          }

          // Update field size assignments
          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, eventId));

          // Only process complexFieldSizes if it's an object with entries
          if (eventData.complexFieldSizes && typeof eventData.complexFieldSizes === 'object') {
            for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
              await tx
                .insert(eventFieldSizes)
                .values({
                  eventId,
                  fieldId: parseInt(fieldId),
                  fieldSize,
                  createdAt: new Date().toISOString(),
                });
            }
          }
        });

        res.json({ message: "Event updated successfully" });
      } catch (error) {
        console.error('Error updating event:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        let errorMessage = "Failed to update event";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });

    // Add this new endpoint after the existing event creation endpoint
    app.get('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const eventsList = await db
          .select({
            event: events,
            applicationCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number),
          })
          .from(events)
          .leftJoin(teams, eq(events.id, teams.eventId))
          .groupBy(events.id)
          .orderBy(events.startDate);

        // Format the response
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));

        res.json(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch events");
      }
    });

    // Add this new endpoint to get event details for editing
    app.get('/api/admin/events/:id/edit', isAdmin, hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;

        // Handle preview event special case
        if (eventId === 'preview') {
          console.log('Returning mock preview event for editing');
          
          const previewEvent = {
            id: 'preview',
            name: 'Preview Event',
            description: 'This is a preview event for testing the registration flow',
            startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
            endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], // 10 days from now
            registrationOpenDate: new Date().toISOString().split('T')[0],
            registrationCloseDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
            location: 'Preview Location',
            logoUrl: null,
            bannerUrl: null,
            primaryColor: '#3498db',
            secondaryColor: '#2ecc71',
            termsAndConditions: 'Preview terms and conditions',
            isPublished: true,
            maxTeamsPerGroup: 10,
            website: 'https://example.com',
            requireCoachCertification: false,
            showBrackets: true,
            showTeamList: true,
            createdAt: new Date().toISOString(),
            status: 'active',
            contactEmail: 'preview@example.com',
            contactPhone: '123-456-7890',
            hostingOrganization: 'Preview Organization',
            registrationType: 'open',
            seasonId: null
          };
          
          // Get the preview age groups
          const ageGroups = [
            {
              ageGroup: {
                id: 1001,
                eventId: 'preview',
                ageGroup: 'U10 Boys',
                gender: 'Boys',
                birthYear: 2014,
                projectedTeams: 8,
                scoringRule: 'default',
                fieldSize: '7v7',
                amountDue: 250,
                createdAt: new Date().toISOString(),
                divisionCode: 'U10B'
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1002,
                eventId: 'preview',
                ageGroup: 'U12 Girls',
                gender: 'Girls',
                birthYear: 2012,
                projectedTeams: 8,
                scoringRule: 'default',
                fieldSize: '9v9',
                amountDue: 250,
                createdAt: new Date().toISOString(),
                divisionCode: 'U12G'
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1003,
                eventId: 'preview',
                ageGroup: 'U14 Boys',
                gender: 'Boys',
                birthYear: 2010,
                projectedTeams: 8,
                scoringRule: 'default',
                fieldSize: '11v11',
                amountDue: 300,
                createdAt: new Date().toISOString(),
                divisionCode: 'U14B'
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1004,
                eventId: 'preview',
                ageGroup: 'U16 Girls',
                gender: 'Girls',
                birthYear: 2008,
                projectedTeams: 8,
                scoringRule: 'default',
                fieldSize: '11v11',
                amountDue: 300,
                createdAt: new Date().toISOString(),
                divisionCode: 'U16G'
              },
              teamCount: 0
            }
          ];
          
          return res.json({
            event: previewEvent,
            ageGroups: ageGroups,
            complexes: [],
            administrators: []
          });
        }

        // Normal event processing
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }

        // Get age groups with their teams count
        const ageGroups = await db
          .select({
            ageGroup: eventAgeGroups,
            teamCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
          })
          .from(eventAgeGroups)
          .leftJoin(teams, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(eventAgeGroups.eventId, eventId))
          .groupBy(eventAgeGroups.id);

        // Get all complexes with their fields and full metadata
        // Create a safer query that selects specific columns instead of the whole complexes table
        let complexData = [];
        try {
          console.log("Fetching complex data with safe query");
          // Only select the specific columns we need from complexes to avoid missing column errors
          complexData = await db
            .select({
              complex: {
                id: complexes.id,
                name: complexes.name,
                address: complexes.address,
                city: complexes.city,
                state: complexes.state,
                country: complexes.country,
                openTime: complexes.openTime,
                closeTime: complexes.closeTime,
                rules: complexes.rules,
                directions: complexes.directions,
                isOpen: complexes.isOpen,
                createdAt: complexes.createdAt,
                updatedAt: complexes.updatedAt,
                // Add default values for potentially missing columns
                latitude: sql`NULL::text`,
                longitude: sql`NULL::text`
              },
              fields: sql<any>`json_agg(
                CASE WHEN ${fields.id} IS NOT NULL THEN
                  json_build_object(
                    'id', ${fields.id},
                    'name', ${fields.name},
                    'hasLights', ${fields.hasLights},
                    'hasParking', ${fields.hasParking},
                    'isOpen', ${fields.isOpen},
                    'specialInstructions', ${fields.specialInstructions}
                  )
                ELSE NULL
                END
              ) FILTER (WHERE ${fields.id} IS NOT NULL)`.mapWith((f) => f || []),
              openFields: sql<number>`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
              closedFields: sql<number>`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number),
            })
            .from(complexes)
            .leftJoin(fields, eq(complexes.id, fields.complexId))
            .groupBy(complexes.id)
            .orderBy(complexes.name);
        } catch (error) {
          console.error("Error fetching complexes with safe query:", error);
          
          try {
            // Alternative approach with even safer SQL
            console.log("Trying alternative approach with explicit SQL query");
            
            // Get complexes with a raw SQL query that doesn't reference latitude/longitude columns
            const basicComplexes = await db.execute(`
              SELECT 
                id, name, address, city, state, country, 
                open_time, close_time, rules, directions, is_open, 
                created_at, updated_at
              FROM complexes
            `);
            
            // Process each complex to add its fields
            complexData = await Promise.all(basicComplexes.map(async (complex) => {
              // Get fields for this complex
              const fieldsList = await db
                .select()
                .from(fields)
                .where(eq(fields.complexId, complex.id));
                
              return {
                complex: { 
                  ...complex,
                  // Add default values for latitude/longitude
                  latitude: null,
                  longitude: null,
                  // Fix property names to match camelCase used elsewhere
                  openTime: complex.open_time,
                  closeTime: complex.close_time,
                  isOpen: complex.is_open,
                  createdAt: complex.created_at,
                  updatedAt: complex.updated_at
                },
                fields: fieldsList.map(field => ({
                  id: field.id,
                  name: field.name,
                  hasLights: field.hasLights,
                  hasParking: field.hasParking,
                  isOpen: field.isOpen,
                  specialInstructions: field.specialInstructions
                })),
                openFields: fieldsList.filter(f => f.isOpen).length,
                closedFields: fieldsList.filter(f => !f.isOpen).length
              };
            }));
          } catch (secondError) {
            console.error("Still failed with alternative approach:", secondError);
            
            // As a last resort, return an empty array
            console.log("Using empty complexData as fallback");
            complexData = [];
          }
        }

        // Get scoring rules
        const scoringRules = await db
          .select()
          .from(eventScoringRules)
          .where(eq(eventScoringRules.eventId, eventId));

        // Get complex assignments
        const complexAssignments = await db
          .select()
          .from(eventComplexes)
          .where(eq(eventComplexes.eventId, eventId));

        // Get field size assignments
        const fieldSizes = await db
          .select()
          .from(eventFieldSizes)
          .where(eq(eventFieldSizes.eventId, eventId));

        // Get all administrators
        const administrators = await db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          })
          .from(users)
          .where(eq(users.isAdmin, true));

        // Get the seasonal scope ID and age group IDs from the event
        const seasonalScope = await db
          .select()
          .from(seasonalScopes)
          .where(eq(seasonalScopes.id, eventAgeGroups[0]?.seasonalScopeId ?? 0))
          .limit(1)
          .then(rows => rows[0]);

        // Get event settings
        const settingsData = await db
          .select()
          .from(eventSettings)
          .where(eq(eventSettings.eventId, eventId));
        
        // Map the settings to the format expected by the client
        const settings = settingsData.map(setting => ({
          id: setting.id,
          key: setting.settingKey,
          value: setting.settingValue
        }));
        
        console.log('Found event settings for event:', eventId, settings);

        // Process branding settings for the event
        const brandingSettings = settingsData.filter(setting => 
          setting.settingKey.startsWith('branding.'));
          
        let brandingData = {};
        
        if (brandingSettings.length > 0) {
          brandingSettings.forEach(setting => {
            const key = setting.settingKey.replace('branding.', '');
            brandingData[key] = setting.settingValue;
          });
        }
        
        console.log('Processed branding data:', brandingData);

        // Format response to match create event view structure exactly
        const response = {
          ...event,
          ageGroups: ageGroups.map(({ ageGroup, teamCount }) => ({
            ...ageGroup,
            teamCount,
            assignedFields: [], // Will be populated by frontend
            assignedTeams: []   // Will be populated by frontend
          })),
          complexes: complexData.map(({ complex, fields, openFields, closedFields }) => ({
            ...complex,
            fields: fields || [],
            openFields: openFields || 0,
            closedFields: closedFields || 0
          })),
          selectedComplexIds: complexAssignments.map(a => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map(f => [f.fieldId, f.fieldSize])
          ),
          scoringRules,
          administrators,
          // Add selected scope and age group IDs
          selectedScopeId: seasonalScope?.id || null,
          selectedAgeGroupIds: ageGroups.map(({ ageGroup }) => ageGroup.id),
          // Include event settings
          settings: settings || [],
          // Include branding data
          branding: Object.keys(brandingData).length > 0 
            ? brandingData 
            : { logoUrl: null, primaryColor: null, secondaryColor: null },
          // Additional metadata needed by create view
          availableAgeGroups: ageGroups.map(({ ageGroup }) => ageGroup.ageGroup),
          availableFieldSizes: [...new Set(fieldSizes.map(f => f.fieldSize))].filter(Boolean),
          timeZones: event.timezone ? [event.timezone] : [], // Include current timezone
          validationErrors: {} // Empty object for frontend validation
        };

        res.json(response);
      } catch (error) {
        console.error('Error fetching event details:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });

    // Add this new endpoint after the existing event endpoints
    app.get('/api/admin/events/:id', hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;

        // Get event details
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }

        // Get age groups
        const ageGroups = await db
          .select()
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, eventId));

        // Get scoring rules
        const scoringRules = await db
          .select()
          .from(eventScoringRules)
          .where(eq(eventScoringRules.eventId, eventId));

        // Get complex assignments
        const complexAssignments = await db
          .select()
          .from(eventComplexes)
          .where(eq(eventComplexes.eventId, eventId));

        // Get field size assignments
        const fieldSizes = await db
          .select()
          .from(eventFieldSizes)
          .where(eq(eventFieldSizes.eventId, eventId));

        // Format response
        const response = {
          ...event,
          ageGroups,
          scoringRules,
          selectedComplexIds: complexAssignments.map(a => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map(f => [f.fieldId, f.fieldSize])
          )
        };

        res.json(response);
      } catch (error) {
        console.error('Error fetching event details:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });

    // Add these new endpoints for scheduling functionality
    app.get('/api/admin/events/:id/schedule', hasEventAccess, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        // Fetch all games for this event with related data
        const schedule = await db
          .select({
            game: games,
            homeTeam: teams,
            awayTeam: sql<{ id: number; name: string }>`json_build_object('id', ${sql.raw('away_teams')}.id, 'name', ${sql.raw('away_teams')}.name)`,
            field: fields,
            timeSlot: gameTimeSlots,
            ageGroup: eventAgeGroups,
          })
          .from(games)
          .leftJoin(teams, eq(games.homeTeamId, teams.id))
          .leftJoin(sql.raw('teams as away_teams'), eq(games.awayTeamId, sql.raw('away_teams.id')))
          .leftJoin(fields, eq(games.fieldId, fields.id))
          .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
          .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
          .where(eq(games.eventId, eventId))
          .orderBy(gameTimeSlots.startTime);

        // Format the schedule for frontend display with null checks
        const formattedSchedule = schedule
          .filter(item => item.timeSlot && item.field && item.homeTeam && item.ageGroup)
          .map(item => ({
            id: item.game.id,
            startTime: item.timeSlot!.startTime,
            endTime: item.timeSlot!.endTime,
            fieldName: item.field!.name,
            ageGroup: item.ageGroup!.ageGroup,
            homeTeam: item.homeTeam!.name,
            awayTeam: (item.awayTeam as { name: string }).name,
            status: item.game.status,
          }));

        res.json({ games: formattedSchedule });
      } catch (error) {
        console.error('Error fetching schedule:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch schedule");
      }
    });

    app.post('/api/admin/events/:id/generate-schedule', hasEventAccess, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const { gamesPerDay, minutesPerGame, breakBetweenGames } = req.body;

        // Start a transaction for the entire schedule generation process
        await db.transaction(async (tx) => {
          // 1. Fetch event details
          const [event] = await tx
            .select()
            .from(events)
            .where(eq(events.id, eventId));

          if (!event) {
            throw new Error("Event not found");
          }

          // 2. Fetch all age groups for this event
          const ageGroups = await tx
            .select()
            .from(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, eventId));

          // 3. Fetch all available fields
          const eventFields = await tx
            .select({
              field: fields,
              complex: complexes,
            })
            .from(eventComplexes)
            .innerJoin(fields, eq(eventComplexes.complexId, fields.complexId))
            .innerJoin(complexes, eq(eventComplexes.complexId, complexes.id))
            .where(eq(eventComplexes.eventId, eventId));

          // 4. Generate time slots for each day
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayIndex);

            for (const { field, complex } of eventFields) {
              const complexOpenTime = new Date(`${currentDate.toISOString().split('T')[0]}T${complex.openTime}`);
              const complexCloseTime = new Date(`${currentDate.toISOString().split('T')[0]}T${complex.closeTime}`);

              let currentTime = complexOpenTime;
              while (currentTime.getTime() + (minutesPerGame * 60 * 1000) <= complexCloseTime.getTime()) {
                const endTime = new Date(currentTime.getTime() + (minutesPerGame * 60 * 1000));

                await tx.insert(gameTimeSlots).values({
                  eventId,
                  fieldId: field.id,
                  startTime: currentTime.toISOString(),
                  endTime: endTime.toISOString(),
                  dayIndex,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),                });

                // Add break time before next game
                currentTime = new Date(endTime.getTime() + (breakBetweenGames * 60 * 1000));
              }
            }
          }

          // 5. Create tournament groups for each age group
          for (const ageGroup of ageGroups) {
            await tx.insert(tournamentGroups).values({
              eventId,
              ageGroupId: ageGroup.id,
              name: `Group A - ${ageGroup.ageGroup}`,
              type: 'round_robin',
              stage: 'group',
              createdAt: new Date().toISOString(),
            });
          }

          //          // 6. Schedule will be generated based on registered teams          // This will be implemented in a separate endpoint once teams are registered
        });

        res.json({ message: "Schedule framework generated successfully" });
      } catch (error) {
        console.error('Error generating schedule:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to generate schedule");
      }
    });

    // Teams management endpoints
    app.get('/api/admin/events/:eventId/age-groups', hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        
        // Special handling for preview mode
        if (eventId === 'preview') {
          // Return sample age groups for preview
          const previewAgeGroups = [
            {
              id: 1001,
              eventId: 'preview',
              ageGroup: "U10",
              gender: "Boys",
              divisionCode: "B10",
              birthYear: 2015,
              fieldSize: "9v9",
              projectedTeams: 12,
              scoringRule: "Standard",
              amountDue: 15000,
              createdAt: new Date().toISOString()
            },
            {
              id: 1002,
              eventId: 'preview',
              ageGroup: "U12",
              gender: "Boys",
              divisionCode: "B12",
              birthYear: 2013,
              fieldSize: "11v11",
              projectedTeams: 10,
              scoringRule: "Standard",
              amountDue: 15000,
              createdAt: new Date().toISOString()
            },
            {
              id: 1003,
              eventId: 'preview',
              ageGroup: "U14",
              gender: "Boys", 
              divisionCode: "B14",
              birthYear: 2011,
              fieldSize: "11v11",
              projectedTeams: 8,
              scoringRule: "Standard",
              amountDue: 17500,
              createdAt: new Date().toISOString()
            },
            {
              id: 1004,
              eventId: 'preview',
              ageGroup: "U10",
              gender: "Girls",
              divisionCode: "G10",
              birthYear: 2015,
              fieldSize: "9v9",
              projectedTeams: 8,
              scoringRule: "Standard",
              amountDue: 15000,
              createdAt: new Date().toISOString()
            },
            {
              id: 1005,
              eventId: 'preview',
              ageGroup: "U12",
              gender: "Girls",
              divisionCode: "G12",
              birthYear: 2013,
              fieldSize: "11v11",
              projectedTeams: 6,
              scoringRule: "Standard",
              amountDue: 15000,
              createdAt: new Date().toISOString()
            }
          ];
          
          console.log('Returning preview age groups');
          return res.json(previewAgeGroups);
        }

        // First, check if we have existing age groups for this event
        let ageGroups = await db.query.eventAgeGroups.findMany({
          where: eq(eventAgeGroups.eventId, eventId),
        });

        // Log the count for debugging
        console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);

        // If we don't have enough age groups (less than 30) and we can find the seasonal scope ID,
        // try to load the full set from the seasonal scope
        if (ageGroups.length < 30) {
          // Try to find the seasonal scope ID from event settings
          const eventSettingsRecords = await db.query.eventSettings.findMany({
            where: and(
              eq(eventSettings.eventId, eventId),
              eq(eventSettings.settingKey, 'seasonalScopeId')
            )
          });

          // If we found a seasonal scope ID setting, use it to get all age groups
          if (eventSettingsRecords.length > 0) {
            const seasonalScopeId = parseInt(eventSettingsRecords[0].settingValue);
            console.log(`Found seasonal scope ID ${seasonalScopeId} for event ${eventId}, fetching all age groups`);
            
            // Get the complete set of age groups from the seasonal scope
            const seasonalAgeGroups = await db.query.ageGroupSettings.findMany({
              where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
            });
            
            console.log(`Found ${seasonalAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);
            
            // Map the seasonal scope age groups to event age groups format
            // but only for ones that don't already exist in the event
            const existingIds = new Set(ageGroups.map(ag => `${ag.ageGroup}-${ag.gender}`));
            
            for (const scopeAgeGroup of seasonalAgeGroups) {
              const ageGroupKey = `${scopeAgeGroup.ageGroup}-${scopeAgeGroup.gender}`;
              
              // Only add age groups that don't already exist
              if (!existingIds.has(ageGroupKey)) {
                // Insert the missing age group
                const [newAgeGroup] = await db.insert(eventAgeGroups)
                  .values({
                    eventId,
                    ageGroup: scopeAgeGroup.ageGroup,
                    gender: scopeAgeGroup.gender,
                    birthYear: scopeAgeGroup.birthYear,
                    divisionCode: scopeAgeGroup.divisionCode || `${scopeAgeGroup.gender[0]}${scopeAgeGroup.ageGroup.substring(1)}`,
                    fieldSize: "11v11", // Default
                    projectedTeams: 8, // Default
                    scoringRule: "Standard", // Default
                    seasonalScopeId: seasonalScopeId,
                    createdAt: new Date().toISOString(),
                    isEligible: true // Default to eligible
                  })
                  .returning();
                  
                // Add to our existing results
                ageGroups.push(newAgeGroup);
              }
            }
            
            console.log(`Added missing age groups, now have ${ageGroups.length} total age groups`);
          }
        }

        // More targeted deduplication that preserves all relevant groups
        // Only deduplicate exact duplicates with the same ID
        const uniqueGroups = [];
        const seenIds = new Set();

        for (const group of ageGroups) {
          if (!seenIds.has(group.id)) {
            seenIds.add(group.id);
            uniqueGroups.push(group);
          }
        }

        console.log(`Returning ${uniqueGroups.length} unique age groups after deduplication`);
        res.json(uniqueGroups);
      } catch (error) {
        console.error('Error fetching age groups:', error);
        res.status(500).json({ error: 'Failed to fetch age groups' });
      }
    });

    app.get('/api/admin/teams', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.query.eventId as string);
        const ageGroupId = req.query.ageGroupId ? parseInt(req.query.ageGroupId as string) : null;

        let query = db
          .select({
            team: teams,
            ageGroup: eventAgeGroups,
          })
          .from(teams)
          .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(teams.eventId, eventId));

        // Add age group filter if specified
        if (ageGroupId) {
          query = query.where(eq(teams.ageGroupId, ageGroupId));
        }

        const results = await query.orderBy(teams.name);

        // Format the response
        const formattedTeams = results.map(({ team, ageGroup }) => ({
          ...team,
          ageGroup: ageGroup?.ageGroup || 'Unknown',
        }));

        res.json(formattedTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch teams");
      }
    });

    app.post('/api/admin/teams', isAdmin, async (req, res) => {
      try {
        const { name, eventId, ageGroup } = req.body;

        if (!name || !eventId || !ageGroup) {
          return res.status(400).send("Name, event ID, and age group are required");
        }

        // Get the age group ID first
        const [ageGroupRecord] = await db
          .select()
          .from(eventAgeGroups)
          .where(and(
            eq(eventAgeGroups.eventId, eventId),
            eq(eventAgeGroups.ageGroup, ageGroup)          ));

        if (!ageGroupRecord) {
          return res.status(404).send("Age group not found");
        }

        //        // Create the team
        const [newTeam] = await db
          .insert(teams)
          .values({
            name,
            eventId,
            ageGroupId: ageGroupRecord.id,
            createdAt: new Date().toISOString(),
          })
          .returning();

        res.json(newTeam);
      } catch (error) {
        console.error('Error creating team:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create team");
      }
    });

    // Add endpoint to get age groups for an event
    app.get('/api/admin/events/:id/age-groups', hasEventAccess, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        const ageGroups = await db
          .select({
            ageGroup: eventAgeGroups.ageGroup,
            gender: eventAgeGroups.gender,
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number)
          })
          .from(eventAgeGroups)
          .leftJoin(teams, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(eventAgeGroups.eventId, eventId))
          .groupBy(eventAgeGroups.id, eventAgeGroups.ageGroup, eventAgeGroups.gender)
          .orderBy(eventAgeGroups.ageGroup);

        res.json(ageGroups);
      } catch (error) {
        console.error('Error fetching age groups:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch age groups");
      }
    });

    // Add administrators endpoint
    app.post('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        const { firstName, lastName, email, password, roles } = req.body;

        if (!firstName || !lastName || !email || !password || !roles || !Array.isArray(roles)) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).json({ 
            error: "Email already registered",
            code: "EMAIL_EXISTS"
          });
        }

        // Hash the password
        const hashedPassword = await crypto.hash(password);

        // Start a transaction
        await db.transaction(async (tx) => {
          // Create the administrator
          const [newAdmin] = await tx
            .insert(users)
            .values({
              email,
              username: email,
              password: hashedPassword,
              firstName,
              lastName,
              isAdmin: true,
              isParent: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .returning();

          // Process each role
          for (const roleName of roles) {
            // Get or create the role
            const existingRole = await tx
              .select()
              .from(roles)
              .where(eq(roles.name, roleName))
              .limit(1);

            let roleId;
            if (existingRole.length === 0) {
              const [newRole] = await tx
                .insert(roles)
                .values({
                  name: roleName,
                  description: `${roleName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} role`
                })
                .returning();
              roleId = newRole.id;
            } else {
              roleId = existingRole[0].id;
            }

            // Assign role to admin
            await tx
              .insert(adminRoles)
              .values({
                userId: newAdmin.id,
                roleId: roleId,
                createdAt: new Date()
              });
          }

          // Return the created admin with roles
          res.status(201).json({
            id: newAdmin.id,
            email: newAdmin.email,
            firstName: newAdmin.firstName,
            lastName: newAdmin.lastName,
            roles
          });
        });
      } catch (error) {
        console.error('Error creating administrator:', error);
        res.status(500).json({ 
          error: "Failed to create administrator",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.get('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        // Get all admin users first
        const administrators = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            createdAt: users.createdAt,
            isAdmin: users.isAdmin,
          })
          .from(users)
          .where(eq(users.isAdmin, true))
          .orderBy(users.createdAt);

        // Now fetch all admin roles in a single query
        const userRoles = await db
          .select({
            userId: adminRoles.userId,
            roleId: adminRoles.roleId,
            roleName: roles.name,
          })
          .from(adminRoles)
          .innerJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(inArray(adminRoles.userId, administrators.map(admin => admin.id)));

        // Map roles to each admin
        const adminsWithRoles = administrators.map(admin => {
          const adminRoles = userRoles
            .filter(role => role.userId === admin.id)
            .map(role => role.roleName);
          
          return {
            ...admin,
            roles: adminRoles.length > 0 ? adminRoles : []
          };
        });

        res.json(adminsWithRoles);
      } catch (error) {
        console.error('Error fetching administrators:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch administrators");
      }
    });

    // Teams management endpoints
    
    // Get a single team by ID with its players
    app.get('/api/admin/teams/:id', async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        
        // First, get the team to find its eventId
        const [teamData] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId));
          
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = teamData.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          // Fetch team with its age group and event
          const [team] = await db
            .select({
              team: teams,
              ageGroup: eventAgeGroups,
              event: events
            })
            .from(teams)
            .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
            .leftJoin(events, eq(teams.eventId, events.id))
            .where(eq(teams.id, teamId));
            
          if (!team) {
            return res.status(404).json({ error: "Team not found" });
          }
          
          // Fetch players for this team
          const playersList = await db
            .select()
            .from(players)
            .where(eq(players.teamId, teamId));
            
          // Parse coach JSON if it exists
          let coachData = {};
          if (team.team.coach) {
            try {
              coachData = JSON.parse(team.team.coach);
            } catch (error) {
              console.error('Error parsing coach JSON:', error);
            }
          }
          
          // Format response
          const response = {
            ...team.team,
            ageGroup: team.ageGroup?.ageGroup || 'Unknown',
            eventName: team.event?.name || 'Unknown Event',
            players: playersList,
            coachData
          };
          
          res.json(response);
        });
      } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: "Failed to fetch team details" });
      }
    });
    
    // Player management endpoints
    
    // Add a player to a team
    app.post('/api/admin/teams/:id/players', async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        
        // First, get the team to find its eventId
        const [teamData] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId));
          
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = teamData.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          // Access is granted, proceed with player creation
          // Validate the player data using a simple validation
          // Since insertPlayerSchema might not be defined, let's use a basic validation approach
          const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
          const missingFields = requiredFields.filter(field => !req.body[field]);
          
          if (missingFields.length > 0) {
            return res.status(400).json({ 
              error: "Invalid player data", 
              details: `Missing required fields: ${missingFields.join(', ')}` 
            });
          }
          
          // Insert the new player
          const newPlayer = await db.insert(players).values({
            teamId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dateOfBirth: req.body.dateOfBirth,
            jerseyNumber: req.body.jerseyNumber,
            position: req.body.position,
            medicalNotes: req.body.medicalNotes,
            parentGuardianName: req.body.parentGuardianName,
            parentGuardianEmail: req.body.parentGuardianEmail,
            parentGuardianPhone: req.body.parentGuardianPhone,
            emergencyContactName: req.body.emergencyContactName,
            emergencyContactPhone: req.body.emergencyContactPhone,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }).returning();
          
          res.status(201).json(newPlayer[0]);
        });
      } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ error: "Failed to add player" });
      }
    });
    
    // Update a player
    app.patch('/api/admin/players/:id', async (req, res) => {
      try {
        const playerId = parseInt(req.params.id);
        
        if (isNaN(playerId)) {
          return res.status(400).json({ error: "Invalid player ID" });
        }
        
        // Check if player exists and get its team to determine the event
        const playerData = await db
          .select({
            player: players,
            team: teams
          })
          .from(players)
          .innerJoin(teams, eq(players.teamId, teams.id))
          .where(eq(players.id, playerId))
          .limit(1);
        
        if (!playerData || playerData.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = playerData[0].team.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          // Fields that can be updated
          const updateFields = [
            'firstName', 'lastName', 'dateOfBirth', 'jerseyNumber', 
            'position', 'medicalNotes', 'parentGuardianName', 
            'parentGuardianEmail', 'parentGuardianPhone', 
            'emergencyContactName', 'emergencyContactPhone', 'isActive'
          ];
          
          // Build update object with only supplied fields
          const updateData: Record<string, any> = {};
          
          for (const field of updateFields) {
            if (req.body[field] !== undefined) {
              updateData[field] = req.body[field];
            }
          }
          
          // Add updatedAt timestamp
          updateData.updatedAt = new Date().toISOString();
          
          // Update the player
          const [updatedPlayer] = await db.update(players)
            .set(updateData)
            .where(eq(players.id, playerId))
            .returning();
          
          res.json(updatedPlayer);
        });
      } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: "Failed to update player" });
      }
    });
    
    // Delete a player
    app.delete('/api/admin/players/:id', async (req, res) => {
      try {
        const playerId = parseInt(req.params.id);
        
        if (isNaN(playerId)) {
          return res.status(400).json({ error: "Invalid player ID" });
        }
        
        // Check if player exists and get its team to determine the event
        const playerData = await db
          .select({
            player: players,
            team: teams
          })
          .from(players)
          .innerJoin(teams, eq(players.teamId, teams.id))
          .where(eq(players.id, playerId))
          .limit(1);
        
        if (!playerData || playerData.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = playerData[0].team.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          // Delete the player
          await db.delete(players).where(eq(players.id, playerId));
          
          res.json({ success: true, message: "Player deleted successfully" });
        });
      } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: "Failed to delete player" });
      }
    });
    
    app.patch('/api/admin/teams/:id', async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        
        // First, get the team to find its eventId
        const [teamData] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId));
          
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = teamData.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          const { name, coach, managerName, managerPhone, managerEmail, clubName, ageGroupId } = req.body;

          // Log the received data for debugging
          console.log('Updating team with data:', { 
            id: teamId, 
            name, 
            coachData: typeof coach === 'string' ? 'JSON string' : coach,
            managerName, 
            managerPhone, 
            managerEmail,
            clubName,
            ageGroupId
          });

          // Create an update object with only defined fields
          const updateObject: any = {};
          
          if (name !== undefined) updateObject.name = name;
          if (coach !== undefined) updateObject.coach = coach;
          if (managerName !== undefined) updateObject.manager_name = managerName;
          if (managerPhone !== undefined) updateObject.manager_phone = managerPhone;
          if (managerEmail !== undefined) updateObject.manager_email = managerEmail;
          if (clubName !== undefined) updateObject.club_name = clubName;
          if (ageGroupId !== undefined) updateObject.age_group_id = parseInt(ageGroupId);
          
          console.log('Final SQL update object:', updateObject);
          
          const [updatedTeam] = await db
            .update(teams)
            .set(updateObject)
            .where(eq(teams.id, teamId))
            .returning();

          if (!updatedTeam) {
            return res.status(404).send("Team not found");
          }

          // Process the coach data for the response
          let coachData = {};
          if (updatedTeam.coach) {
            try {
              coachData = JSON.parse(updatedTeam.coach);
            } catch (error) {
              console.error('Error parsing coach JSON in response:', error);
            }
          }

          // Return the updated team with parsed coach data
          res.json({
            ...updatedTeam,
            coachData
          });
        });
      } catch (error) {
        console.error('Error updating team:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update team");
      }
    });

    // Form Template endpoints
    app.get('/api/admin/events/:id/registration-form', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [template] = await db
          .select({
            template: eventFormTemplates,
            fields: sql<any[]>`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type},
                  'required', ${formFields.required},
                  'order', ${formFields.order},
                  'placeholder', ${formFields.placeholder},
                  'helpText', ${formFields.helpText},
                  'validation', ${formFields.validation},
                  'options', (
                    SELECT json_agg(
                      json_build_object(
                        'id', ${formFieldOptions.id},
                        'label', ${formFieldOptions.label},
                        'value', ${formFieldOptions.value},
                        'order', ${formFieldOptions.order}
                      ) ORDER BY ${formFieldOptions.order}
                    )
                    FROM ${formFieldOptions}
                    WHERE ${formFieldOptions.fieldId} = ${formFields.id}
                  )
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith(f => f || [])
          })
          .from(eventFormTemplates)
          .leftJoin(formFields, eq(formFields.templateId, eventFormTemplates.id))
          .where(eq(eventFormTemplates.eventId, eventId))
          .groupBy(eventFormTemplates.id);

        if (!template) {
          return res.json({
            id: null,
            eventId,
            name: '',
            description: '',
            isPublished: false,
            fields: []
          });
        }

        res.json({
          ...template.template,
          fields: template.fields
        });
      } catch (error) {
        console.error('Error fetching form template:', error);
        res.status(500).json({ error: "Failed to fetch form template" });
      }
    });

    app.get('/api/admin/form-templates', isAdmin, async (req, res) => {
      try {
        const templates = await db
          .select({
            id: eventFormTemplates.id,
            name: eventFormTemplates.name,
            description: eventFormTemplates.description,
            isPublished: eventFormTemplates.isPublished,
            createdAt: eventFormTemplates.createdAt,
            updatedAt: eventFormTemplates.updatedAt,
            fields: sql<any[]>`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type}
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith(f => f || [])
          })
          .from(eventFormTemplates)
          .leftJoin(formFields, eq(formFields.templateId, eventFormTemplates.id))
          .groupBy(eventFormTemplates.id);

        res.json(templates);
      } catch (error) {
        console.error('Error fetching form templates:', error);
        res.status(500).json({ error: "Failed to fetch form templates" });
      }
    });

    // Get a specific form template
    app.get('/api/admin/form-templates/:id', isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        console.log(`Fetching form template with ID: ${templateId}`);

        // First, check if the template exists
        const templateExists = await db
          .select({ 
            id: eventFormTemplates.id,
            name: eventFormTemplates.name,
            eventId: eventFormTemplates.eventId
          })
          .from(eventFormTemplates)
          .where(eq(eventFormTemplates.id, templateId))
          .limit(1);

        if (templateExists.length === 0) {
          console.log(`Template with ID ${templateId} not found`);
          return res.status(404).json({ error: "Template not found" });
        }
        
        console.log(`Found template: ${JSON.stringify(templateExists[0])}`);

        // Then check if there are any fields for this template
        const fieldCount = await db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(formFields)
          .where(eq(formFields.templateId, templateId));
        
        console.log(`Found ${fieldCount[0].count} fields for template ${templateId}`);
        
        // Log raw field data for debugging
        if (fieldCount[0].count > 0) {
          const rawFields = await db
            .select()
            .from(formFields)
            .where(eq(formFields.templateId, templateId));
          console.log(`Raw fields: ${JSON.stringify(rawFields)}`);
        }

        const [template] = await db
          .select({
            template: eventFormTemplates,
            fields: sql<any[]>`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type},
                  'required', ${formFields.required},
                  'order', ${formFields.order},
                  'placeholder', ${formFields.placeholder},
                  'helpText', ${formFields.helpText},
                  'validation', ${formFields.validation},
                  'options', (
                    SELECT json_agg(
                      json_build_object(
                        'id', ${formFieldOptions.id},
                        'label', ${formFieldOptions.label},
                        'value', ${formFieldOptions.value},
                        'order', ${formFieldOptions.order}
                      ) ORDER BY ${formFieldOptions.order}
                    )
                    FROM ${formFieldOptions}
                    WHERE ${formFieldOptions.fieldId} = ${formFields.id}
                  )
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith(f => f || [])
          })
          .from(eventFormTemplates)
          .leftJoin(formFields, eq(formFields.templateId, eventFormTemplates.id))
          .where(eq(eventFormTemplates.id, templateId))
          .groupBy(eventFormTemplates.id);

        if (!template) {
          console.log(`Template result was null for ID ${templateId}`);
          return res.status(404).json({ error: "Template not found" });
        }

        console.log(`Returning template with ID ${templateId} and ${template.fields.length} fields`);
        
        res.json({
          ...template.template,
          fields: template.fields
        });
      } catch (error) {
        console.error('Error fetching form template:', error);
        res.status(500).json({ error: "Failed to fetch form template" });
      }
    });

    app.put('/api/admin/form-templates/:id', isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const { name, description, isPublished, fields } = req.body;
        
        await db.transaction(async (tx) => {
          // Update template
          await tx
            .update(eventFormTemplates)
            .set({
              name,
              description,
              isPublished,
              updatedAt: new Date()
            })
            .where(eq(eventFormTemplates.id, templateId));
            
          // Delete existing fields and options
          const existingFields = await tx
            .select()
            .from(formFields)
            .where(eq(formFields.templateId, templateId));

          for (const field of existingFields) {
            await tx
              .delete(formFieldOptions)
              .where(eq(formFieldOptions.fieldId, field.id));
          }

          await tx
            .delete(formFields)
            .where(eq(formFields.templateId, templateId));
            
          // Create new fields
          for (const [index, field] of fields.entries()) {
            const [newField] = await tx
              .insert(formFields)
              .values({
                templateId: templateId,
                label: field.label,
                type: field.type,
                required: field.required || false,
                order: index,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();
              
            // Create options for dropdown fields
            if (field.type === 'dropdown' && field.options?.length > 0) {
              await tx
                .insert(formFieldOptions)
                .values(
                  field.options.map((option, optionIndex) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: optionIndex,
                    createdAt: new Date()
                  }))
                );
            }
          }
        });
        
        res.json({ message: "Form template updated successfully" });
      } catch (error) {
        console.error('Error updating form template:', error);
        res.status(500).json({ error: "Failed to update form template" });
      }
    });
    
    app.post('/api/admin/form-templates', isAdmin, async (req, res) => {
      try {
        const { name, description, isPublished, fields, eventId } = req.body;

        await db.transaction(async (tx) => {
          // Create form template
          const [template] = await tx
            .insert(eventFormTemplates)
            .values({
              eventId: eventId || null, // Make eventId optional
              name,
              description,
              isPublished: isPublished || false,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // Create fields
          if (fields?.length) {
            for (const field of fields) {
              const [newField] = await tx
                .insert(formFields)
                .values({
                  templateId: template.id,
                  label: field.label,
                  type: field.type,
                  required: field.required,
                  order: field.order,
                  placeholder: field.placeholder,
                  helpText: field.helpText,
                  validation: field.validation
                })
                .returning();

              // Create options for dropdown fields
              if (field.type === 'dropdown' && field.options?.length) {
                await tx
                  .insert(formFieldOptions)
                  .values(
                    field.options.map((option: any, index: number) => ({
                      fieldId: newField.id,
                      label: option.label,
                      value: option.value,
                      order: option.order || index
                    }))
                  );
              }
            }
          }
        });

        res.json({ message: "Form template created successfully" });
      } catch (error) {
        console.error('Error creating form template:', error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });

    app.post('/api/admin/events/:id/form-template', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { name, description, isPublished, fields } = req.body;

        // Start a transaction
        await db.transaction(async (tx) => {
          // Create form template
          const [template] = await tx
            .insert(eventFormTemplates)
            .values({
              eventId,
              name,
              description,
              isPublished: isPublished || false,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // Create fields
          for (const [index, field] of fields.entries()) {
            const [newField] = await tx
              .insert(formFields)
              .values({
                templateId: template.id,
                label: field.label,
                type: field.type,
                required: field.required || false,
                order: index,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            // Create options for dropdown fields
            if (field.type === 'dropdown' && field.options?.length > 0) {
              await tx
                .insert(formFieldOptions)
                .values(
                  field.options.map((option: any, optionIndex: number) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: optionIndex,
                    createdAt: new Date()
                  }))
                );
            }
          }
        });

        res.status(201).json({ message: "Form template created successfully" });
      } catch (error) {
        console.error('Error creating form template:', error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });

    app.put('/api/admin/events/:eventId/form-template', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const { id, name, description, isPublished, fields } = req.body;

        await db.transaction(async (tx) => {
          // Update template
          await tx
            .update(eventFormTemplates)
            .set({
              name,
              description,
              isPublished,
              updatedAt: new Date()
            })
            .where(eq(eventFormTemplates.id, id));

          // Delete existing fields and options
          const existingFields = await tx
            .select()
            .from(formFields)
            .where(eq(formFields.templateId, id));

          for (const field of existingFields) {
            await tx
              .delete(formFieldOptions)
              .where(eq(formFieldOptions.fieldId, field.id));
          }

          await tx
            .delete(formFields)
            .where(eq(formFields.templateId, id));

          // Create new fields
          for (const [index, field] of fields.entries()) {
            const [newField] = await tx
              .insert(formFields)
              .values({
                templateId: id,
                label: field.label,
                type: field.type,
                required: field.required || false,
                order: index,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            // Create options for dropdown fields
            if (field.type === 'dropdown' && field.options?.length > 0) {
              await tx
                .insert(formFieldOptions)
                .values(
                  field.options.map((option: any, optionIndex: number) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: optionIndex,
                    createdAt: new Date()
                  }))
                );
            }
          }
        });

        res.json({ message: "Form template updated successfully" });
      } catch (error) {
        console.error('Error updating form template:', error);
        res.status(500).json({ error: "Failed to update form template" });
      }
    });

    app.delete('/api/admin/events/:eventId/form-template/:id', isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);

        await db.transaction(async (tx) => {
          // Delete all field options
          await tx
            .delete(formFieldOptions)
            .where(
              inArray(
                formFieldOptions.fieldId,
                db.select({ id: formFields.id })
                  .from(formFields)
                  .where(eq(formFields.templateId, templateId))
              )
            );

          // Delete all fields
          await tx
            .delete(formFields)
            .where(eq(formFields.templateId, templateId));

          // Delete template
          const [deletedTemplate] = await tx
            .delete(eventFormTemplates)
            .where(eq(eventFormTemplates.id, templateId))
            .returning();

          if (!deletedTemplate) {
            return res.status(404).json({ error: "Template not found" });
          }
        });

        res.json({ message: "Form template deleted successfully" });
      } catch (error) {
        console.error('Error deleting form template:', error);
        res.status(500).json({ error: "Failed to delete form template" });
      }
    });

    app.delete('/api/admin/teams/:id', async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        
        // First, get the team to find its eventId
        const [teamData] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId));
          
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        
        // Set the eventId in request params for the hasEventAccess middleware
        req.params.eventId = teamData.eventId;
        
        // Now check event access using the middleware
        await hasEventAccess(req, res, async () => {
          // Check if team has any associated games
          const [gameCount] = await db
            .select({
              count: sql<number>`count(*)`.mapWith(Number)
            })
            .from(games)
            .where(
              or(
                eq(games.homeTeamId, teamId),
                eq(games.awayTeamId, teamId)
              )
            );

          if (gameCount.count > 0) {
            return res.status(400).send("Cannot delete team with associated games");
          }

          const [deletedTeam] = await db
            .delete(teams)
            .where(eq(teams.id, teamId))
            .returning();

          if (!deletedTeam) {
            return res.status(404).send("Team not found");
          }
          
          // Also delete any players associated with this team
          await db
            .delete(players)
            .where(eq(players.teamId, teamId));

          res.json({ 
            success: true, 
            message: "Team deleted successfully", 
            team: deletedTeam 
          });
        });
      } catch (error) {
        console.error('Error deleting team:', error);
        console.error("Error details:", error);
        res.status(500).send("Failed to delete team");
      }
    });

    // Add these new endpoints for event management
    app.get('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const eventsList = await db
          .select({
            event: events,
            applicationCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number),
          })
          .from(events)
          .leftJoin(teams, eq(events.id, teams.eventId))
          .groupBy(events.id)
          .orderBy(events.startDate);

        // Format the response
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));

        res.json(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch events");
      }
    });

    // Bulk delete events endpoint
    app.delete('/api/admin/events/bulk', isAdmin, async (req, res) => {
      try {
        const { eventIds } = req.body;

        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          return res.status(400).json({ message: "No events selected" });
        }

        // Start a transaction to handle cascade deletion
        await db.transaction(async (tx) => {
          // Delete related records first in order of dependencies
          await tx.delete(formResponses).where(inArray(formResponses.eventId, eventIds));
          await tx.delete(chatRooms).where(inArray(chatRooms.eventId, eventIds));
          await tx.delete(eventFieldSizes).where(inArray(eventFieldSizes.eventId, eventIds));
          await tx.delete(eventScoringRules).where(inArray(eventScoringRules.eventId, eventIds));
          await tx.delete(eventComplexes).where(inArray(eventComplexes.eventId, eventIds));
          await tx.delete(teams).where(inArray(teams.eventId, eventIds));
          await tx.delete(tournamentGroups).where(inArray(tournamentGroups.eventId, eventIds));
          await tx.delete(eventAgeGroups).where(inArray(eventAgeGroups.eventId, eventIds));
          await tx.delete(eventFormTemplates).where(inArray(eventFormTemplates.eventId, eventIds));

          // Finally delete the events
          await tx.delete(events).where(inArray(events.id, eventIds));
        });

        res.json({ message: "Events deleted successfully" });
      } catch (error) {
        console.error('Error deleting events:', error);
        let errorMessage = "Failed to delete events";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });

    app.delete('/api/admin/events/:id', async (req, res) => {
      try {
        const eventId = req.params.id;
        console.log('Starting event deletion for ID:', eventId);
        
        // Check event access using the middleware
        await hasEventAccess(req, res, async () => {

        // Validate event ID
        if (!eventId) {
          return res.status(400).json({ error: "Event ID is required" });
        }

        // Check if event exists before attempting deletion
        const [eventExists] = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!eventExists) {
          return res.status(404).json({ error: "Event not found" });
        }

        // Try in sequence instead of in a single transaction to handle errors better
        try {
          // Delete games first (they reference time slots and teams)
          try {
            await db
              .delete(games)
              .where(eq(games.eventId, eventId));
            console.log('Deleted games');
          } catch (e) {
            console.error('Error deleting games:', e);
          }

          // Delete game time slots
          try {
            await db
              .delete(gameTimeSlots)
              .where(eq(gameTimeSlots.eventId, eventId));
            console.log('Deleted game time slots');
          } catch (e) {
            console.error('Error deleting game time slots:', e);
          }

          // Delete form responses  
          try {
            await db
              .delete(formResponses)
              .where(eq(formResponses.eventId, eventId));
            console.log('Deleted form responses');
          } catch (e) {
            console.error('Error deleting form responses:', e);
          }

          // Delete chat rooms
          try {
            // First check if the table exists
            await db.execute(sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms'`);
            await db
              .delete(chatRooms)
              .where(eq(chatRooms.eventId, eventId));
            console.log('Deleted chat rooms');
          } catch (e) {
            console.error('Error deleting chat rooms:', e);
          }

          // Delete coupons
          try {
            await db
              .delete(coupons)
              .where(eq(coupons.eventId, eventId));
            console.log('Deleted coupons');
          } catch (e) {
            console.error('Error deleting coupons:', e);
          }

          // Delete field sizes
          try {
            await db
              .delete(eventFieldSizes)
              .where(eq(eventFieldSizes.eventId, eventId));
            console.log('Deleted event field sizes');
          } catch (e) {
            console.error('Error deleting field sizes:', e);
          }

          // Delete scoring rules
          try {
            await db
              .delete(eventScoringRules)
              .where(eq(eventScoringRules.eventId, eventId));
            console.log('Deleted event scoring rules');
          } catch (e) {
            console.error('Error deleting scoring rules:', e);
          }

          // Delete complex assignments
          try {
            await db
              .delete(eventComplexes)
              .where(eq(eventComplexes.eventId, eventId));
            console.log('Deleted event complexes');
          } catch (e) {
            console.error('Error deleting complex assignments:', e);
          }

          // Delete tournament groups first (they reference age groups)
          try {
            await db
              .delete(tournamentGroups)
              .where(eq(tournamentGroups.eventId, eventId));
            console.log('Deleted tournament groups');
          } catch (e) {
            console.error('Error deleting tournament groups:', e);
          }

          // Delete teams (they reference age groups)
          try {
            await db
              .delete(teams)
              .where(eq(teams.eventId, eventId));
            console.log('Deleted teams');
          } catch (e) {
            console.error('Error deleting teams:', e);
          }

          // Delete form field options and fields
          try {
            const templateIds = await db
              .select({ id: eventFormTemplates.id })
              .from(eventFormTemplates)
              .where(eq(eventFormTemplates.eventId, eventId))
              .then(results => results.map(r => r.id));

            if (templateIds.length > 0) {
              const fieldIds = await db
                .select({ id: formFields.id })
                .from(formFields)
                .where(inArray(formFields.templateId, templateIds))
                .then(results => results.map(r => r.id));

              if (fieldIds.length > 0) {
                await db
                  .delete(formFieldOptions)
                  .where(inArray(formFieldOptions.fieldId, fieldIds));
                console.log('Deleted form field options');
              }

              await db
                .delete(formFields)
                .where(inArray(formFields.templateId, templateIds));
              console.log('Deleted form fields');
            }
          } catch (e) {
            console.error('Error deleting form fields:', e);
          }

          // Delete event form templates
          try {
            await db
              .delete(eventFormTemplates)
              .where(eq(eventFormTemplates.eventId, eventId));
            console.log('Deleted event form templates');
          } catch (e) {
            console.error('Error deleting form templates:', e);
          }

          // Delete event age groups
          try {
            await db
              .delete(eventAgeGroups)
              .where(eq(eventAgeGroups.eventId, eventId));
            console.log('Deleted event age groups');
          } catch (e) {
            console.error('Error deleting age groups:', e);
          }

          // Finally delete the event itself
          try {
            const [deletedEvent] = await db
              .delete(events)
              .where(eq(events.id, eventId))
              .returning();

            if (!deletedEvent) {
              return res.status(404).json({ error: "Event not found after deleting dependencies" });
            }

            console.log('Successfully deleted event:', eventId);
          } catch (e) {
            console.error('Error deleting event entity:', e);
            return res.status(500).json({ 
              error: e instanceof Error ? e.message : "Failed to delete event entity",
              details: e instanceof Error ? e.stack : undefined
            });
          }

        } catch (innerError) {
          console.error('Error in deletion sequence:', innerError);
          return res.status(500).json({ 
            error: innerError instanceof Error ? innerError.message : "Failed in deletion sequence",
            details: innerError instanceof Error ? innerError.stack : undefined
          });
        }

        res.json({ message: "Event deleted successfully" });
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        console.error("Error details:", error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to delete event",
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Chat-related routes
    app.post('/api/chat/rooms', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { name, type, eventId, teamId } = req.body;

        // Create chat room
        const [chatRoom] = await db.transaction(async (tx) => {
          const [room] = await tx
            .insert(chatRooms)
            .values({
              name,
              type,
              eventId: eventId || null,
              teamId: teamId || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          // Add creator as admin participant
          await tx
            .insert(chatParticipants)
            .values({
              chatRoomId: room.id,
              userId: req.user.id,
              isAdmin: true,
              lastReadAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

          return [room];
        });

        res.json(chatRoom);
      } catch (error) {
        console.error('Error creating chat room:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create chat room");
      }
    });

    app.get('/api/chat/rooms', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const userRooms = await db
          .select({
            room: chatRooms,
            unreadCount: sql<number>`
              count(case when ${messages.createdAt} > ${chatParticipants.lastReadAt} then 1 end)
            `.mapWith(Number),
          })
          .from(chatParticipants)
          .innerJoin(chatRooms, eq(chatParticipants.chatRoomId, chatRooms.id))
          .leftJoin(messages, eq(messages.chatRoomId, chatRooms.id))
          .where(eq(chatParticipants.userId, req.user.id))
          .groupBy(chatRooms.id)
          .orderBy(chatRooms.updatedAt);

        res.json(userRooms);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch chat rooms");
      }
    });

    app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const roomId = parseInt(req.params.roomId);

        // Verify user is a participant
        const [participant] = await db
          .select()
          .from(chatParticipants)
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id)
          ));

        if (!participant) {
          return res.status(403).send("Not a participant of this chat room");
        }

        const roomMessages = await db
          .select({
            message: messages,
            user: {
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(messages)
          .innerJoin(users, eq(messages.userId, users.id))
          .where(eq(messages.chatRoomId, roomId))
          .orderBy(messages.createdAt);

        // Update last read timestamp
        await db
          .update(chatParticipants)
          .set({
            lastReadAt: new Date().toISOString(),
          })
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id)
          ));

        res.json(roomMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch messages");
      }
    });

    app.post('/api/chat/rooms/:roomId/participants', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const roomId = parseInt(req.params.roomId);
        const { userIds } = req.body;

        // Verify requester is an admin of the room
        const [requesterParticipant] = await db
          .select()
          .from(chatParticipants)
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id),
            eq(chatParticipants.isAdmin, true)
          ));

        if (!requesterParticipant) {
          return res.status(403).send("Not authorized to add participants");
        }

        // Add new participants
        const newParticipants = await db
          .insert(chatParticipants)
          .values(
            userIds.map((userId: number) => ({
              chatRoomId: roomId,
              userId,
              isAdmin: false,
              lastReadAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }))
          )
          .returning();

        res.json(newParticipants);
      } catch (error) {
        console.error('Error adding participants:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to add participants");
      }
    });

    // Register email template routes
    app.get('/api/admin/email-templates', isAdmin, async (req, res) => {
      try {
        const { getEmailTemplates } = await import('./routes/email-templates');
        await getEmailTemplates(req, res);
      } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).send("Failed to fetch email templates");
      }
    });
    
    // Preview email template - must come before /:id route to avoid conflicts
    app.get('/api/admin/email-templates/preview', isAdmin, async (req, res) => {
      try {
        const { previewEmailTemplate } = await import('./routes/email-templates');
        await previewEmailTemplate(req, res);
      } catch (error) {
        console.error('Error previewing email template:', error);
        res.status(500).send("Failed to preview email template");
      }
    });
    
    // Get single email template by ID
    app.get('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
      try {
        const { getEmailTemplate } = await import('./routes/email-templates');
        await getEmailTemplate(req, res);
      } catch (error) {
        console.error(`Error fetching email template ${req.params.id}:`, error);
        res.status(500).send("Failed to fetch email template");
      }
    });

    app.post('/api/admin/email-templates', isAdmin, async (req, res) => {
      try {
        const { createEmailTemplate } = await import('./routes/email-templates');
        await createEmailTemplate(req, res);
      } catch (error) {
        console.error('Error creating email template:', error);
        res.status(500).send("Failed to create email template");
      }
    });

    app.put('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
      try {
        const { updateEmailTemplate } = await import('./routes/email-templates');
        await updateEmailTemplate(req, res);
      } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).send("Failed to update email template");
      }
    });

    app.delete('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
      try {
        const { deleteEmailTemplate } = await import('./routes/email-templates');
        await deleteEmailTemplate(req, res);
      } catch (error) {
        console.error('Error deleting email template:', error);
        res.status(500).send("Failed to delete email template");
      }
    });

    // Preview route moved above to prevent route conflicts

    return httpServer;
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}