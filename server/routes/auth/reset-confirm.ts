
import { db } from "../../../db/index";
import { users } from "../../../db/schema";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../crypto";
import { passwordResetTokens } from "./password-reset";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    // Find the user with the reset token
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token));

    if (foundUsers.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = foundUsers[0];

    // Check if token is expired
    const now = new Date();
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < now) {
      return res.status(400).json({ error: "Token has expired" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user with new password and remove token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, user.id));

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
