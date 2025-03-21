import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, insertUserSchema, households, insertHouseholdSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";
import { crypto } from "./crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
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
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    }),
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

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        
        // Add caching headers
        res.set('Cache-Control', 'private, max-age=300, must-revalidate');
        return res.json({
          message: "Registration successful",
          user: newUser,
        });
      });
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

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Add caching headers
        res.set('Cache-Control', 'private, max-age=300, must-revalidate');
        return res.json({
          message: "Login successful",
          user,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    // If user is authenticated, invalidate their cache entry
    if (req.isAuthenticated() && req.user && req.user.id) {
      invalidateUserCache(req.user.id);
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      // Add caching headers to improve performance for repeated user info requests
      // Cache for 5 minutes, must revalidate if stale
      res.set('Cache-Control', 'private, max-age=300, must-revalidate');
      return res.json(req.user);
    }

    res.status(401).send("Not logged in");
  });

  // Add email availability check endpoint
  app.get("/api/check-email", async (req, res) => {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).send("Email is required");
    }

    try {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking email availability:", error);
      return res.status(500).send("Error checking email availability");
    }
  });
}