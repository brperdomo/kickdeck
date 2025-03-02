
import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Log the token for debugging
    console.log("\n=============== VERIFYING TOKEN ===============");
    console.log(`Token being verified: ${token}`);
    console.log("================================================\n");

    // Find the user with the reset token
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token));

    if (foundUsers.length === 0) {
      console.log(`Token verification failed: No user found with token ${token}`);
      return res.status(400).json({ valid: false, error: "Invalid token" });
    }

    const user = foundUsers[0];

    // Check if token is expired
    const now = new Date();
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < now) {
      console.log(`Token expired at ${user.resetPasswordExpires}`);
      return res.status(400).json({ valid: false, error: "Token has expired" });
    }

    console.log(`Token valid for user: ${user.email}`);
    res.json({ valid: true });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ valid: false, error: "Failed to verify token" });
  }
});

export default router;
