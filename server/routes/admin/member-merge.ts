/**
 * Member Merge Management Routes
 * 
 * Handles duplicate member detection, merge preview, and execution
 */

import { Router } from 'express';
import { MemberMergeService } from '../../services/member-merge-service';

const router = Router();

// Find duplicate members
router.get('/duplicates', async (req, res) => {
  try {
    const duplicates = await MemberMergeService.findDuplicates();
    
    res.json({
      duplicates,
      summary: {
        totalCandidates: duplicates.length,
        highConfidence: duplicates.filter(d => d.confidence >= 90).length,
        mediumConfidence: duplicates.filter(d => d.confidence >= 70 && d.confidence < 90).length,
        lowConfidence: duplicates.filter(d => d.confidence < 70).length,
        byMatchReason: {
          email: duplicates.filter(d => d.matchReason === 'email').length,
          namePhone: duplicates.filter(d => d.matchReason === 'name_phone').length,
          similarName: duplicates.filter(d => d.matchReason === 'similar_name').length,
          sameHousehold: duplicates.filter(d => d.matchReason === 'same_household').length
        }
      }
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    res.status(500).json({ error: 'Failed to find duplicate members' });
  }
});

// Get merge preview for specific users
router.post('/preview', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 user IDs required' });
    }

    const preview = await MemberMergeService.getMergePreview(userIds);
    
    res.json({
      preview,
      warnings: [
        preview.conflicts.length > 0 ? `${preview.conflicts.length} field conflicts require resolution` : null,
        preview.relatedData.teams > 0 ? `${preview.relatedData.teams} team registrations will be affected` : null,
        preview.relatedData.eventAdministrations > 0 ? `${preview.relatedData.eventAdministrations} admin roles will be consolidated` : null,
        preview.primaryUser.isAdmin ? 'Primary account has admin privileges' : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Error generating merge preview:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate merge preview' });
  }
});

// Execute member merge
router.post('/execute', async (req, res) => {
  try {
    const mergeRequest = req.body;
    
    // Validate required fields
    if (!mergeRequest.primaryUserId || !Array.isArray(mergeRequest.secondaryUserIds)) {
      return res.status(400).json({ error: 'Invalid merge request format' });
    }

    if (mergeRequest.secondaryUserIds.length === 0) {
      return res.status(400).json({ error: 'No secondary users specified for merge' });
    }

    // Execute the merge
    const result = await MemberMergeService.executeMerge(mergeRequest);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Member merge completed successfully',
        result: {
          mergedUserId: result.mergedUserId,
          transferredRecords: result.transferredRecords,
          preservedData: result.preservedData
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Merge failed'
      });
    }
  } catch (error) {
    console.error('Error executing merge:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute member merge' 
    });
  }
});

// Get member merge statistics
router.get('/stats', async (req, res) => {
  try {
    const duplicates = await MemberMergeService.findDuplicates();
    
    // Calculate risk metrics
    const highRiskDuplicates = duplicates.filter(d => 
      d.confidence >= 90 && 
      (d.matchReason === 'email' || d.matchReason === 'name_phone')
    );
    
    const mediumRiskDuplicates = duplicates.filter(d => 
      d.confidence >= 70 && d.confidence < 90
    );

    res.json({
      dataIntegrity: {
        totalMembers: 0, // Would need to count from users table
        duplicateCandidates: duplicates.length,
        highRiskDuplicates: highRiskDuplicates.length,
        mediumRiskDuplicates: mediumRiskDuplicates.length,
        lowRiskDuplicates: duplicates.filter(d => d.confidence < 70).length
      },
      recommendations: [
        highRiskDuplicates.length > 0 ? `${highRiskDuplicates.length} high-confidence duplicates should be reviewed immediately` : null,
        mediumRiskDuplicates.length > 5 ? 'Multiple medium-confidence duplicates suggest data entry inconsistencies' : null,
        duplicates.filter(d => d.matchReason === 'email').length > 0 ? 'Email duplicates indicate database constraint violations' : null
      ].filter(Boolean),
      priorityActions: [
        { action: 'Review email duplicates', count: duplicates.filter(d => d.matchReason === 'email').length, priority: 'critical' },
        { action: 'Merge name+phone matches', count: duplicates.filter(d => d.matchReason === 'name_phone').length, priority: 'high' },
        { action: 'Review household duplicates', count: duplicates.filter(d => d.matchReason === 'same_household').length, priority: 'medium' }
      ].filter(item => item.count > 0)
    });
  } catch (error) {
    console.error('Error getting merge stats:', error);
    res.status(500).json({ error: 'Failed to get member merge statistics' });
  }
});

export default router;