import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, Request } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, insertUserSchema, households, insertHouseholdSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";
import { crypto } from "./crypto";
import { emulationMiddleware, getEmulatedUserId } from "./services/emulationService";
import { sendTemplatedEmail } from './services/emailService';

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      actualUserId?: number;
      emulatedUserId?: number;
    }
  }
}

// Simple in-memory cache for user authentication
interface UserCache {
  [userId: number]: {
    user: SelectUser;
    timestamp: number;
  };
}

// Cache user data for 5 minutes (300000 ms)
const USER_CACHE_TTL = 300000;
const userCache: UserCache = {};

// Function to get user from cache or database
async function getUserById(id: number): Promise<SelectUser | null> {
  const now = Date.now();
  const cachedData = userCache[id];
  
  // Return from cache if available and not expired
  if (cachedData && (now - cachedData.timestamp < USER_CACHE_TTL)) {
    return cachedData.user;
  }
  
  // Get from database if not in cache or expired
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
    
  if (user) {
    // Update cache with fresh data
    userCache[id] = { 
      user, 
      timestamp: now 
    };
  }
  
  return user || null;
}

// Function to invalidate a user's cache entry
function invalidateUserCache(id: number): void {
  delete userCache[id];
}

/**
 * Create a new coach or team manager account
 * This function is used when registering a team with a coach/manager that doesn't exist in the system
 * 
 * @param firstName - First name of the coach/manager
 * @param lastName - Last name of the coach/manager
 * @param email - Email address of the coach/manager
 * @param phone - Phone number of the coach/manager (optional)
 * @returns The newly created user or existing user if found
 */
export async function createCoachAccount(
  firstName: string,
  lastName: string,
  email: string,
  phone?: string
): Promise<SelectUser> {
  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  // Generate a random password (coach will need to reset this)
  const tempPassword = crypto.generateRandomPassword(16);
  const hashedPassword = await crypto.hash(tempPassword);

  // Create a new household for the coach
  const [household] = await db
    .insert(households)
    .values({
      lastName,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      primaryEmail: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    })
    .returning();

  // Create the user account
  const [newUser] = await db
    .insert(users)
    .values({
      username: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      isParent: false,
      isAdmin: false,
      householdId: household.id,
      createdAt: new Date().toISOString(),
    })
    .returning();

  // Send welcome email
  try {
    await sendTemplatedEmail({
      to: email,
      templateType: 'welcome_email',
      data: {
        firstName,
        lastName,
        email,
        username: email,
        password: tempPassword // Include the generated password (only sent via email)
      }
    });
    console.log(`Welcome email sent to new coach/manager account: ${email}`);
  } catch (emailError) {
    console.error('Failed to send welcome email to new coach/manager:', emailError);
    // Continue even if email fails - account is still created
  }

  return newUser;
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  // Enhanced session secret for production security
  const sessionSecret = process.env.SESSION_SECRET || process.env.REPL_ID || "soccer-registration-secret-key-enhanced";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (shorter for better security)
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false // Always false for Replit environments
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 hours cleanup interval
      stale: false
    }),
    rolling: true, // Reset expiration countdown on every response
    unset: 'destroy',
    name: 'matchpro.session' // Custom session name
  };

  // Production-specific optimizations
  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    
    // Enhanced production session settings
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: false, // Never use secure on Replit
      sameSite: 'lax',
      domain: undefined // Let browser determine domain
    };
    
    console.log('[Auth Setup] Production session configured with enhanced security');
  } else {
    // Development environment settings  
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: false,
      sameSite: 'lax',
    };
    
    console.log('[Auth Setup] Development session configured');
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add emulation middleware after the passport middleware
  app.use(emulationMiddleware);

  passport.use(
    new LocalStrategy({ 
      usernameField: 'email',
      passwordField: 'password' 
    }, async (email, password, done) => {
      try {
        console.log('Login attempt for:', email);
        
        // Check for user by email or username
        const [user] = await db
          .select()
          .from(users)
          .where(or(eq(users.email, email), eq(users.username, email)))
          .limit(1);

        if (!user) {
          console.log('User not found:', email);
          return done(null, false, { message: "Incorrect email or username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          console.log('Password mismatch for user:', email);
          return done(null, false, { message: "Incorrect password." });
        }

        console.log('Login successful for user:', email);
        
        // Update user cache on successful login
        userCache[user.id] = {
          user,
          timestamp: Date.now()
        };

        return done(null, user);
      } catch (err) {
        console.error('Login error:', err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Use cached user data if available, otherwise fetch from database
      const user = await getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration request received:', req.body.email);
      console.log('Full registration data:', JSON.stringify(req.body, null, 2));
      
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.error('Validation failed. Full error details:', JSON.stringify(result.error, null, 2));
        const errorMsg = "Invalid input: " + result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(", ");
        console.error('Registration validation error:', errorMsg);
        return res
          .status(400)
          .send(errorMsg);
      }

      const { username, password, firstName, lastName, email, phone, isParent } = result.data;
      console.log('Processing registration for:', email);

      // Check if user exists by email or username
      const [existingUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)))
        .limit(1);

      if (existingUser) {
        console.log('Registration failed - user exists:', email);
        return res.status(400).send("User with this email or username already exists");
      }

      const hashedPassword = await crypto.hash(password);
      console.log('Creating user account for:', email);

      // First, create the household
      const [household] = await db
        .insert(households)
        .values({
          lastName,
          address: "", // These will be updated in the user profile
          city: "",
          state: "",
          zipCode: "",
          primaryEmail: email,
          createdAt: new Date().toISOString(),
        })
        .returning();
      
      console.log('Created household for new user:', household.id);

      // Then create the user with the household reference
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          firstName,
          lastName,
          email,
          phone,
          isParent,
          householdId: household.id,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        })
        .returning();
      
      console.log('Created new user account:', newUser.id);

      // Cache the newly registered user
      userCache[newUser.id] = {
        user: newUser,
        timestamp: Date.now()
      };

      // Try to send welcome email
      try {
        console.log(`📧 TRIGGERING welcome email for new account: ${email}`);
        // Send welcome email asynchronously (don't await to avoid delaying registration)
        sendTemplatedEmail(
          email,
          'welcome',
          {
            firstName,
            lastName,
            email,
            username
          }
        ).then(() => {
          console.log(`✅ Welcome email sent to ${email}`);
        }).catch((err: Error) => {
          console.error('❌ ERROR sending welcome email:', err);
          console.error('   User:', `${firstName} ${lastName}`);
          console.error('   Email:', email);
        });
      } catch (emailError) {
        console.error('❌ ERROR preparing welcome email:', emailError);
        console.error('   User:', `${firstName} ${lastName}`);
        console.error('   Email:', email);
        // Non-blocking - continue registration process even if email fails
      }

      // Log the user in directly - critical for session creation
      console.log('Starting user login process after registration');
      try {
        // More robust approach with explicit Promise
        await new Promise<void>((resolve, reject) => {
          req.login(newUser, (err) => {
            if (err) {
              console.error('Login error after registration:', err);
              reject(err);
              return;
            }
            console.log('Login successful after registration');
            resolve();
          });
        });
        
        // Log the session to help with debugging
        console.log('User logged in, session created:', req.isAuthenticated(), 'Session ID:', req.sessionID);
        
        // Apply strict no-cache headers to prevent browser caching
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        // Add an additional header to ensure the browser makes a fresh request next time
        res.set('X-Registration-Timestamp', Date.now().toString());
        
        // Return the newly created user data
        return res.status(200).json({
          message: "Registration successful",
          user: newUser,
          timestamp: Date.now(), // Add timestamp to prevent caching
          authenticated: req.isAuthenticated()
        });
      } catch (loginError) {
        console.error('Failed to log in user after registration:', loginError);
        
        // Even if auto-login fails, we'll still return a 200 since the account was created
        return res.status(200).json({
          message: "Registration successful, but automatic login failed. Please log in manually.",
          registrationSuccess: true,
          loginSuccess: false,
          user: newUser, // Still return the user data
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', req.body.email);
    
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed - invalid credentials:', info?.message);
        return res.status(400).send(info?.message ?? "Login failed - invalid credentials");
      }

      console.log('Authentication successful for user:', user.email);
      
      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login session creation error:', err);
          return next(err);
        }

        try {
          // Update the user's last login time in the database
          await db
            .update(users)
            .set({
              lastLogin: new Date()
            })
            .where(eq(users.id, user.id));
            
          // Also update the cached user
          if (userCache[user.id]) {
            userCache[user.id].user = {
              ...userCache[user.id].user,
              lastLogin: new Date()
            };
          }
          
          console.log(`Updated last_login for user ${user.id}`);
        } catch (updateError) {
          // Non-blocking - log error but continue login process
          console.error('Failed to update last_login:', updateError);
        }

        // Log the session information for debugging
        console.log('User logged in, session created:', 
          'Authenticated:', req.isAuthenticated(), 
          'Session ID:', req.sessionID);

        // Add stricter caching headers to ensure freshness
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('X-Login-Timestamp', Date.now().toString());
        
        // Return enhanced response with authentication status for debugging
        return res.json({
          message: "Login successful",
          user,
          timestamp: Date.now(),
          authenticated: req.isAuthenticated(),
          sessionId: req.sessionID
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    // Simple, synchronous logout handler
    try {
      // Clear user from cache if authenticated
      if (req.isAuthenticated() && req.user && req.user.id) {
        invalidateUserCache(req.user.id);
        console.log(`Invalidated cache for user ID: ${req.user.id}`);
      }
      
      // Add cache control headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Clear the session cookie first
      res.clearCookie('connect.sid', { 
        path: '/',
        httpOnly: true,
        secure: app.get("env") === 'production',
        sameSite: 'lax'
      });
      
      // Synchronously return success right away
      // This ensures the response is sent even if session destruction has issues
      res.json({ 
        message: "Logout successful",
        success: true,
        timestamp: Date.now()
      });
      
      // Then try to destroy the session (after response is sent)
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.log("Non-critical: Session destruction error:", err);
          }
        });
      }
    } catch (e) {
      console.error("Logout error, but returning success anyway:", e);
      res.status(200).json({
        message: "Logout handled",
        success: true,
        timestamp: Date.now()
      });
    }
  });

  app.get("/api/user", async (req: Request, res) => {
    const debugInfo = {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      timestamp: new Date().toISOString()
    };
    
    console.log(`[API User] ${req.method} ${req.path} - Debug:`, debugInfo);
    
    if (!req.isAuthenticated()) {
      console.log(`[API User] FAILED - User not authenticated`);
      return res.status(401).json({ 
        error: "Authentication required. Please log in.",
        debug: debugInfo,
        action: "redirect_to_login"
      });
    }
    
    if (!req.user) {
      console.log(`[API User] FAILED - User object missing despite authentication`);
      return res.status(401).json({ 
        error: "Session invalid. Please log in again.",
        debug: debugInfo,
        action: "redirect_to_login"
      });
    }

    try {
      // Access the emulatedUserId that we attached in the middleware
      const emulatedUserId = (req as any).emulatedUserId;
      const actualUserId = (req as any).actualUserId;
      
      // Add ETag support for more efficient caching
      // Include updatedAt and profile fields in ETag to ensure fresh data after profile updates
      const lastLogin = req.user?.lastLogin?.getTime() || Date.now();
      const profileHash = `${req.user?.firstName}-${req.user?.lastName}-${req.user?.phone}`;
      const etag = `"user-${req.user?.id}-${lastLogin}-${profileHash}"`;
      
      // Check if client already has this version (If-None-Match header)
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      // Set appropriate cache-control based on environment
      // Add longer cache time in production, but allow revalidation
      const isProduction = app.get("env") === "production";
      
      // Disable caching during emulation to ensure latest data
      if (emulatedUserId) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (isProduction) {
        // In production, improve performance with longer cache but allow revalidation
        res.set('Cache-Control', 'private, max-age=3600, must-revalidate');
      } else {
        // In development, shorter cache time
        res.set('Cache-Control', 'private, max-age=60, must-revalidate');
      }
      
      // Set ETag for efficient caching
      res.set('ETag', etag);
      
      // Check if this is an emulated session
      if (emulatedUserId) {
        // Get the emulated user from the database or cache
        const emulatedUser = await getUserById(emulatedUserId);
        if (emulatedUser) {
          return res.json({
            ...emulatedUser,
            _emulated: true,
            _actualUserId: actualUserId
          });
        }
      }
      
      // Return the actual user
      console.log(`[API User] SUCCESS - Returning user data for ${req.user.email}`);
      return res.json(req.user);
    } catch (error) {
      console.error(`[API User] ERROR - Exception in user endpoint:`, error);
      return res.status(500).json({ 
        error: "Internal server error",
        debug: debugInfo,
        message: "Failed to retrieve user data"
      });
    }
  });

  // Email availability check is handled in routes.ts
  // to avoid duplicate route registration
}