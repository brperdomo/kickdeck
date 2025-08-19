/**
 * RETROACTIVE METADATA API ROUTES
 * 
 * Admin endpoints for updating existing Stripe payments with comprehensive metadata
 * Solves payment identification crisis for legacy transactions
 */

import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import {
  updateTeamPaymentMetadata,
  updateEventPaymentMetadata,
  updateAllPaymentMetadata,
  checkTeamMetadataStatus,
  type RetroactiveUpdateResult,
} from "../services/retroactiveMetadataService.js";

const router = Router();

/**
 * Check if a team needs metadata updates
 * GET /api/admin/metadata/check-team/:teamId
 */
router.get("/check-team/:teamId", isAdmin, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    const status = await checkTeamMetadataStatus(teamId);
    
    res.json({
      success: true,
      teamId,
      ...status,
    });
  } catch (error: any) {
    console.error("Error checking team metadata status:", error);
    res.status(500).json({
      error: "Failed to check team metadata status",
      details: error.message,
    });
  }
});

/**
 * Update metadata for a specific team
 * POST /api/admin/metadata/update-team/:teamId
 */
router.post("/update-team/:teamId", isAdmin, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    console.log(`🔄 Admin ${req.user?.email} triggered metadata update for Team ${teamId}`);
    
    const result = await updateTeamPaymentMetadata(teamId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully updated metadata for Team ${teamId}`,
        result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Metadata update failed for Team ${teamId}`,
        result,
      });
    }
  } catch (error: any) {
    console.error("Error updating team metadata:", error);
    res.status(500).json({
      error: "Failed to update team metadata",
      details: error.message,
    });
  }
});

/**
 * Update metadata for all teams in an event
 * POST /api/admin/metadata/update-event/:eventId
 */
router.post("/update-event/:eventId", isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!eventId) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    console.log(`🔄 Admin ${req.user?.email} triggered metadata update for Event ${eventId}`);
    
    const results = await updateEventPaymentMetadata(eventId);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Updated metadata for Event ${eventId}: ${successful} successful, ${failed} failed`,
      summary: {
        totalTeams: results.length,
        successful,
        failed,
      },
      results,
    });
  } catch (error: any) {
    console.error("Error updating event metadata:", error);
    res.status(500).json({
      error: "Failed to update event metadata",
      details: error.message,
    });
  }
});

/**
 * Update metadata for ALL teams with payment data
 * POST /api/admin/metadata/update-all
 */
router.post("/update-all", isAdmin, async (req, res) => {
  try {
    console.log(`🚀 Super Admin ${req.user?.email} triggered GLOBAL metadata update`);
    
    const result = await updateAllPaymentMetadata();
    
    res.json({
      success: true,
      message: `Global metadata update complete: ${result.successful}/${result.totalTeams} teams successful`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error updating all metadata:", error);
    res.status(500).json({
      error: "Failed to update all metadata",
      details: error.message,
    });
  }
});

/**
 * Get summary of teams needing metadata updates
 * GET /api/admin/metadata/summary
 */
router.get("/summary", isAdmin, async (req, res) => {
  try {
    // This would require additional database queries to count teams needing updates
    // For now, return a placeholder
    res.json({
      success: true,
      message: "Use individual check endpoints or update-all for comprehensive analysis",
      endpoints: {
        checkTeam: "/api/admin/metadata/check-team/:teamId",
        updateTeam: "/api/admin/metadata/update-team/:teamId",
        updateEvent: "/api/admin/metadata/update-event/:eventId",
        updateAll: "/api/admin/metadata/update-all",
      },
    });
  } catch (error: any) {
    console.error("Error getting metadata summary:", error);
    res.status(500).json({
      error: "Failed to get metadata summary",
      details: error.message,
    });
  }
});

export default router;