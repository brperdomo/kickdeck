
import { Router } from "express";
import { db } from "@db";

const router = Router();

// Simple health check endpoint
router.get("/", async (req, res) => {
  try {
    // Check database connection
    await db.execute("SELECT 1");
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Server is up and running"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Database connection failed" 
    });
  }
});

export default router;
