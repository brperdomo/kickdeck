
import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { z } from "zod";
import { comparePassword, hashPassword } from "../../auth";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();

// Login schema
const loginSchema = z.object({
  email: z.string().email().or(z.string()),
  password: z.string(),
});

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  isParent: z.boolean().default(false),
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Check if user exists by email or username
    const user = await db.query.users.findFirst({
      where: (users, { or, eq }) => 
        or(eq(users.email, email), eq(users.username, email))
    });

    if (!user) {
      return res.status(401).json({ 
        ok: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        ok: false,
        message: "Invalid credentials" 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "default_secret_change_me",
      { expiresIn: "7d" }
    );

    // Return user data and token
    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        isParent: user.isParent,
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if email or username already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { or, eq }) => 
        or(eq(users.email, userData.email), eq(users.username, userData.username))
    });

    if (existingUser) {
      return res.status(409).json({ 
        ok: false,
        message: "Email or username already exists" 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const [newUser] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET || "default_secret_change_me",
      { expiresIn: "7d" }
    );

    // Return user data and token
    res.status(201).json({
      ok: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isAdmin: newUser.isAdmin,
        isParent: newUser.isParent,
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Password reset routes
import passwordResetRouter from "./password-reset";
router.use("/password-reset", passwordResetRouter);

export default router;
