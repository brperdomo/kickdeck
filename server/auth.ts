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

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "soccer-registration-secret",
    resave: true, // Changed to true to ensure session is saved on every request
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 hours cleanup interval
      // Don't refresh/ping inactive sessions in the background
      stale: false
    }),
    rolling: true, // Reset expiration countdown on every response
    unset: 'destroy' // Immediately destroy when unset
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add emulation middleware after the passport middleware
  app.use(emulationMiddleware);

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Check for user by email or username
        const [user] = await db
          .select()
          .from(users)
          .where(or(eq(users.email, email), eq(users.username, email)))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect email or username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        // Update user cache on successful login
        userCache[user.id] = {
          user,
          timestamp: Date.now()
        };

        return done(null, user);
      } catch (err) {
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
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map((i) => i.message).join(", "));
      }

      const { username, password, firstName, lastName, email, phone, isParent } = result.data;

      // Check if user exists by email or username
      const [existingUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("User with this email or username already exists");
      }

      const hashedPassword = await crypto.hash(password);

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

      // Cache the newly registered user
      userCache[newUser.id] = {
        user: newUser,
        timestamp: Date.now()
      };

      // Try to send welcome email
      try {
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
          console.log(`Welcome email sent to ${email}`);
        }).catch((err: Error) => {
          console.error('Welcome email error:', err);
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Non-blocking - continue registration process even if email fails
      }

      // Use a Promise to ensure proper session handling
      const loginPromise = new Promise<void>((resolve, reject) => {
        req.login(newUser, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      try {
        // Wait for login to complete
        await loginPromise;
        
        // Add caching headers to ensure the response is fresh
        res.set('Cache-Control', 'private, max-age=0, must-revalidate');
        res.set('Pragma', 'no-cache');
        
        // Return success with the user data
        return res.status(200).json({
          message: "Registration successful",
          user: newUser,
          timestamp: Date.now() // Add timestamp to prevent caching
        });
      } catch (loginError) {
        console.error('Login error after registration:', loginError);
        // Even though login failed, return success since registration worked
        res.status(200).json({
          message: "Registration successful, but auto-login failed. Please log in.",
          registrationSuccess: true,
          loginSuccess: false
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, async (err) => {
        if (err) {
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

        // Add stricter caching headers to ensure freshness
        res.set('Cache-Control', 'private, max-age=0, must-revalidate');
        res.set('Pragma', 'no-cache');
        
        return res.json({
          message: "Login successful",
          user,
          timestamp: Date.now() // Add timestamp to prevent caching
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
    if (req.isAuthenticated()) {
      // Access the emulatedUserId that we attached in the middleware
      const emulatedUserId = (req as any).emulatedUserId;
      const actualUserId = (req as any).actualUserId;
      
      // Add ETag support for more efficient caching
      const timestamp = req.user?.lastLogin?.getTime() || Date.now();
      const etag = `"user-${req.user?.id}-${timestamp}"`;
      
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
      return res.json(req.user);
    }

    // For unauthenticated requests, add cache headers to prevent frequent refreshes
    // This is key to solving the login page refresh issue
    res.set('Cache-Control', 'private, max-age=3600');
    res.set('Expires', new Date(Date.now() + 3600000).toUTCString());
    res.status(401).send("Not logged in");
  });

  // Email availability check is handled in routes.ts
  // to avoid duplicate route registration
}