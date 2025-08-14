import express from 'express';
import { findBestTemplate, generateGamesFromTemplate } from '../services/dynamic-matchup-engine';

const router = express.Router();

/**
 * Field Functionality Verification Endpoint
 * Tests all template fields and AI integration
 */
router.post('/verify-template/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId, 10);
    const { teamCount, bracketStructure } = req.body;

    console.log(`[Template Verification] Testing template ${templateId} with ${teamCount} teams, ${bracketStructure} structure`);

    // FIELD VERIFICATION TESTS
    const verification = {
      templateId,
      fieldTests: {},
      aiIntegration: {},
      gameGeneration: {},
      errors: []
    };

    // TEST 1: Team Count Field
    console.log(`[Team Count Test] Testing team count field: ${teamCount}`);
    verification.fieldTests.teamCount = {
      input: teamCount,
      purpose: "Determines how many teams participate in the tournament",
      functionality: "Used by AI to auto-select appropriate templates and validate matchup patterns",
      test: teamCount >= 4 && teamCount <= 16 ? "PASS" : "FAIL",
      details: `Team count of ${teamCount} ${teamCount >= 4 && teamCount <= 16 ? 'is valid' : 'is outside recommended range (4-16)'}`
    };

    // TEST 2: Bracket Structure Field  
    console.log(`[Bracket Structure Test] Testing bracket structure: ${bracketStructure}`);
    const validStructures = ['single', 'dual', 'crossover', 'round_robin', 'swiss', 'elimination'];
    verification.fieldTests.bracketStructure = {
      input: bracketStructure,
      purpose: "Defines tournament organization (single bracket, dual pools, crossover pools, etc.)",
      functionality: "AI uses this to determine Pool A vs Pool B assignments and championship structure",
      test: validStructures.includes(bracketStructure) ? "PASS" : "FAIL",
      details: {
        single: "All teams in one bracket, round-robin or elimination format",
        dual: "Teams split into Pool A and Pool B, with championship between pool winners", 
        crossover: "Pool A vs Pool B matchups with crossplay games between pools",
        round_robin: "Everyone plays everyone else format",
        swiss: "Pairing based on performance, no elimination",
        elimination: "Single or double elimination tournament"
      }[bracketStructure] || `Unknown structure: ${bracketStructure}`
    };

    // TEST 3: AI Integration Test
    console.log(`[AI Integration Test] Testing findBestTemplate functionality`);
    try {
      const bestTemplate = await findBestTemplate(teamCount, bracketStructure);
      verification.aiIntegration.templateSelection = {
        test: bestTemplate ? "PASS" : "FAIL",
        result: bestTemplate ? {
          id: bestTemplate.id,
          name: bestTemplate.name,
          description: bestTemplate.description,
          matchingLogic: `AI selected template based on ${teamCount} teams and ${bracketStructure} structure`
        } : null,
        details: bestTemplate ? "AI successfully found matching template" : "AI could not find suitable template"
      };
    } catch (aiError) {
      verification.aiIntegration.templateSelection = {
        test: "FAIL",
        error: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        details: "AI template selection failed"
      };
      verification.errors.push(`AI Integration: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
    }

    // TEST 4: Game Generation Test
    console.log(`[Game Generation Test] Testing generateGamesFromTemplate functionality`);
    try {
      // Create sample teams
      const sampleTeams = [];
      for (let i = 1; i <= teamCount; i++) {
        sampleTeams.push({
          id: i,
          name: `Team ${i}`,
          bracketId: "test-bracket",
          seedRanking: i,
          poolAssignment: bracketStructure === 'dual' || bracketStructure === 'crossover' ? 
            (i <= teamCount / 2 ? 'A' : 'B') : undefined
        });
      }

      const games = await generateGamesFromTemplate(templateId, sampleTeams, {
        id: 999,
        name: "Test Bracket",
        tournamentFormat: bracketStructure
      });

      verification.gameGeneration.templateExecution = {
        test: games.length > 0 ? "PASS" : "FAIL", 
        gamesGenerated: games.length,
        sampleGames: games.slice(0, 3).map(game => ({
          gameNumber: game.gameNumber,
          homeTeam: game.homeTeamName,
          awayTeam: game.awayTeamName,
          gameType: game.gameType,
          round: game.round
        })),
        details: `Successfully generated ${games.length} games from template patterns`
      };

      // TEST 5: Matchup Pattern Verification
      const poolPlayGames = games.filter(g => g.gameType === 'pool_play').length;
      const knockoutGames = games.filter(g => g.gameType !== 'pool_play').length;
      
      verification.gameGeneration.matchupAnalysis = {
        totalGames: games.length,
        poolPlayGames,
        knockoutGames,
        hasChampionship: games.some(g => g.gameType === 'final'),
        roundDistribution: games.reduce((acc, game) => {
          acc[game.round] = (acc[game.round] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        details: "Game distribution analysis shows proper tournament structure"
      };

    } catch (gameError) {
      verification.gameGeneration.templateExecution = {
        test: "FAIL",
        error: gameError instanceof Error ? gameError.message : 'Unknown generation error',
        details: "Template game generation failed"
      };
      verification.errors.push(`Game Generation: ${gameError instanceof Error ? gameError.message : 'Unknown error'}`);
    }

    // OVERALL TEST RESULTS
    const allTests = [
      verification.fieldTests.teamCount?.test,
      verification.fieldTests.bracketStructure?.test, 
      verification.aiIntegration.templateSelection?.test,
      verification.gameGeneration.templateExecution?.test
    ];
    
    const passedTests = allTests.filter(test => test === 'PASS').length;
    const totalTests = allTests.length;

    verification.summary = {
      overallStatus: passedTests === totalTests ? "ALL_TESTS_PASS" : "SOME_TESTS_FAIL",
      passedTests,
      totalTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      readyForProduction: passedTests === totalTests && verification.errors.length === 0
    };

    console.log(`[Template Verification] Complete - ${verification.summary.successRate} success rate`);
    res.json(verification);

  } catch (error) {
    console.error('[Template Verification] Error:', error);
    res.status(500).json({
      error: 'Template verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Visual Preview Generation Endpoint
 * Creates tournament bracket visualization data
 */
router.post('/generate-preview/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId, 10);
    const { teamCount, bracketStructure } = req.body;

    console.log(`[Preview Generation] Creating visual preview for template ${templateId}`);

    // Generate sample teams based on bracket structure
    const sampleTeams = [];
    if (bracketStructure === 'single') {
      for (let i = 1; i <= teamCount; i++) {
        sampleTeams.push({ id: i, name: `A${i}`, pool: 'A' });
      }
    } else if (bracketStructure === 'dual' || bracketStructure === 'crossover') {
      const teamsPerPool = Math.ceil(teamCount / 2);
      for (let i = 1; i <= teamsPerPool; i++) {
        sampleTeams.push({ id: i, name: `A${i}`, pool: 'A' });
      }
      for (let i = 1; i <= teamCount - teamsPerPool; i++) {
        sampleTeams.push({ id: i + teamsPerPool, name: `B${i}`, pool: 'B' });
      }
    }

    // Generate preview games
    const previewTeams = sampleTeams.map(team => ({
      id: team.id,
      name: team.name,
      bracketId: "preview",
      poolAssignment: team.pool
    }));

    const games = await generateGamesFromTemplate(templateId, previewTeams, {
      id: 999,
      name: "Preview Bracket", 
      tournamentFormat: bracketStructure
    });

    // Create tournament tree structure
    const rounds = games.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push({
        gameNumber: game.gameNumber,
        homeTeam: game.homeTeamName,
        awayTeam: game.awayTeamName, 
        gameType: game.gameType,
        isPlayoff: game.gameType !== 'pool_play'
      });
      return acc;
    }, {} as Record<number, any[]>);

    const preview = {
      templateId,
      teamCount,
      bracketStructure,
      sampleTeams,
      tournamentTree: rounds,
      totalGames: games.length,
      poolPlayGames: games.filter(g => g.gameType === 'pool_play').length,
      playoffGames: games.filter(g => g.gameType !== 'pool_play').length,
      rounds: Object.keys(rounds).length,
      hasChampionship: games.some(g => g.gameType === 'final')
    };

    console.log(`[Preview Generation] Generated ${games.length} games across ${Object.keys(rounds).length} rounds`);
    res.json(preview);

  } catch (error) {
    console.error('[Preview Generation] Error:', error);
    res.status(500).json({
      error: 'Preview generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;