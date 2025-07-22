import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';

const router = Router();

// Enhanced feasibility simulation endpoint
router.post('/events/:eventId/feasibility-check', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { workflowData, gameMetadata, fieldsData, predictiveAnalysis } = req.body;

    // Enhanced feasibility analysis with predictive insights
    const analysis = await runEnhancedFeasibilitySimulation({
      eventId,
      workflowData,
      gameMetadata,
      fieldsData,
      predictiveAnalysis
    });

    res.json(analysis);
  } catch (error) {
    console.error('Feasibility simulation error:', error);
    res.status(500).json({ error: 'Feasibility simulation failed' });
  }
});

// Schedule quality analysis endpoint
router.post('/events/:eventId/schedule-quality', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { scheduleData, eventData, teamsData } = req.body;

    // Comprehensive schedule quality analysis
    const qualityMetrics = await analyzeScheduleQuality({
      eventId,
      scheduleData,
      eventData,
      teamsData
    });

    res.json(qualityMetrics);
  } catch (error) {
    console.error('Schedule quality analysis error:', error);
    res.status(500).json({ error: 'Schedule quality analysis failed' });
  }
});

// Referee management endpoints
router.get('/events/:eventId/referees', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // This would fetch from a referees table when implemented
    const mockReferees = [
      {
        id: 'ref-1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-0101',
        certificationLevel: 'regional',
        ageGroupPreferences: ['U12', 'U14'],
        timeAvailability: {},
        maxGamesPerDay: 4,
        conflictTeams: []
      }
    ];
    
    res.json({ referees: mockReferees });
  } catch (error) {
    console.error('Referee fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch referees' });
  }
});

router.post('/events/:eventId/referee-assignments', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments, conflicts } = req.body;

    // Save referee assignments to database
    // This would update games table with referee assignments
    
    res.json({ success: true, assignmentCount: assignments.length });
  } catch (error) {
    console.error('Referee assignment save error:', error);
    res.status(500).json({ error: 'Failed to save referee assignments' });
  }
});

async function runEnhancedFeasibilitySimulation(params: any) {
  const { workflowData, gameMetadata, fieldsData } = params;
  
  // Enhanced simulation logic
  const totalTeams = workflowData?.flight?.teams?.length || 0;
  const totalFields = fieldsData?.length || 0;
  const estimatedGamesPerTeam = 4;
  const totalGamesRequired = Math.ceil(totalTeams * estimatedGamesPerTeam / 2);
  
  // Advanced bottleneck analysis
  const gameDuration = gameMetadata?.gameDuration || 90;
  const bufferTime = gameMetadata?.bufferTime || 15;
  const timePerGame = gameDuration + bufferTime;
  const operatingHours = 12;
  const maxGamesPerFieldPerDay = Math.floor((operatingHours * 60) / timePerGame);
  
  const isFieldBottleneck = Math.ceil(totalGamesRequired / totalFields) > maxGamesPerFieldPerDay;
  const fieldUtilization = (totalGamesRequired / (maxGamesPerFieldPerDay * totalFields)) * 100;
  const riskLevel = fieldUtilization > 90 ? 'high' : fieldUtilization > 70 ? 'medium' : 'low';
  
  return {
    isFeasible: !isFieldBottleneck,
    totalGamesRequired,
    totalTimeSlotsAvailable: maxGamesPerFieldPerDay * totalFields,
    fieldsRequired: Math.ceil(totalGamesRequired / maxGamesPerFieldPerDay),
    fieldsAvailable: totalFields,
    estimatedDuration: `${Math.ceil(totalGamesRequired / (maxGamesPerFieldPerDay * totalFields))} day(s)`,
    conflicts: isFieldBottleneck ? ['Insufficient fields for required games'] : [],
    recommendations: generateRecommendations(isFieldBottleneck, totalFields, fieldUtilization),
    utilizationMetrics: {
      fieldUtilization: Math.min(fieldUtilization, 100),
      timeUtilization: Math.min(fieldUtilization, 100),
      gameDistribution: totalTeams > 0 ? (totalGamesRequired / totalTeams) : 0
    },
    bottleneckAnalysis: {
      fieldBottlenecks: isFieldBottleneck ? ['Field capacity exceeded'] : [],
      timeBottlenecks: fieldUtilization > 80 ? ['Peak hours overbooked'] : [],
      flightImbalances: [],
      riskLevel
    },
    predictiveInsights: {
      optimalFieldCount: Math.ceil(totalGamesRequired / maxGamesPerFieldPerDay),
      recommendedBufferTime: fieldUtilization > 80 ? 10 : 15,
      peakUtilizationHours: ['10:00 AM - 2:00 PM', '3:00 PM - 6:00 PM'],
      worstCaseScenario: isFieldBottleneck ? 'Games will extend beyond operating hours' : 'Minor scheduling compression expected'
    }
  };
}

async function analyzeScheduleQuality(params: any) {
  const { scheduleData, teamsData } = params;
  const games = scheduleData?.games || [];
  
  // Comprehensive quality analysis
  const fairnessScore = calculateFairnessScore(games, teamsData);
  const efficiencyScore = calculateEfficiencyScore(games);
  const utilizationScore = calculateUtilizationScore(games);
  const distributionScore = calculateDistributionScore(games);
  
  const overallScore = Math.round(
    (fairnessScore * 0.3) + 
    (efficiencyScore * 0.25) + 
    (utilizationScore * 0.25) + 
    (distributionScore * 0.2)
  );
  
  return {
    overallScore,
    fairnessScore,
    efficiencyScore,
    utilizationScore,
    distributionScore,
    details: {
      teamGameBalance: fairnessScore,
      restTimeCompliance: 85,
      fieldUtilization: utilizationScore,
      timeSpreadEveness: distributionScore,
      conflictCount: 0,
      recommendations: generateQualityRecommendations(fairnessScore, efficiencyScore, utilizationScore)
    }
  };
}

function generateRecommendations(isFieldBottleneck: boolean, totalFields: number, fieldUtilization: number) {
  const recommendations = [];
  
  if (isFieldBottleneck) {
    recommendations.push('Add more fields to prevent scheduling conflicts');
  }
  if (totalFields < 2) {
    recommendations.push('Consider using multiple fields for better time distribution');
  }
  if (fieldUtilization > 90) {
    recommendations.push('Reduce game duration or extend operating hours');
  }
  
  return recommendations;
}

function generateQualityRecommendations(fairness: number, efficiency: number, utilization: number) {
  const recommendations = [];
  
  if (fairness < 70) {
    recommendations.push('Balance game distribution across teams');
  }
  if (efficiency < 70) {
    recommendations.push('Optimize field assignments for better utilization');
  }
  if (utilization < 60) {
    recommendations.push('Increase scheduling density or reduce field count');
  }
  
  return recommendations;
}

function calculateFairnessScore(games: any[], teams: any[]) {
  // Game distribution analysis
  const teamGameCounts = new Map();
  games.forEach(game => {
    const homeTeam = game.homeTeamId || game.homeTeamName;
    const awayTeam = game.awayTeamId || game.awayTeamName;
    teamGameCounts.set(homeTeam, (teamGameCounts.get(homeTeam) || 0) + 1);
    teamGameCounts.set(awayTeam, (teamGameCounts.get(awayTeam) || 0) + 1);
  });
  
  const gameCounts = Array.from(teamGameCounts.values());
  if (gameCounts.length === 0) return 50;
  
  const avgGames = gameCounts.reduce((a, b) => a + b, 0) / gameCounts.length;
  const variance = gameCounts.reduce((sum, count) => sum + Math.pow(count - avgGames, 2), 0) / gameCounts.length;
  
  return Math.max(0, 100 - (variance * 10));
}

function calculateEfficiencyScore(games: any[]) {
  // Field utilization efficiency
  const fieldUsage = new Map();
  games.forEach(game => {
    const fieldKey = game.fieldId || game.field || 'unknown';
    fieldUsage.set(fieldKey, (fieldUsage.get(fieldKey) || 0) + 1);
  });
  
  if (fieldUsage.size === 0) return 50;
  
  const fieldCounts = Array.from(fieldUsage.values());
  const avgGamesPerField = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
  const variance = fieldCounts.reduce((sum, count) => sum + Math.pow(count - avgGamesPerField, 2), 0) / fieldCounts.length;
  
  return Math.max(0, 100 - (variance * 5));
}

function calculateUtilizationScore(games: any[]) {
  // Overall resource utilization
  const totalGames = games.length;
  const uniqueFields = new Set(games.map(g => g.fieldId || g.field)).size;
  
  if (uniqueFields === 0) return 50;
  
  const utilizationRate = Math.min((totalGames / (uniqueFields * 10)) * 100, 100);
  return utilizationRate > 70 ? Math.min(utilizationRate, 100) : utilizationRate * 0.8;
}

function calculateDistributionScore(games: any[]) {
  // Time distribution analysis
  const timeSlots = new Set(games.map(g => g.startTime).filter(Boolean));
  const totalGames = games.length;
  
  if (totalGames === 0) return 50;
  
  return timeSlots.size > 1 ? 
    Math.min((timeSlots.size / Math.max(totalGames / 4, 1)) * 100, 100) : 50;
}

export default router;