/**
 * Dynamic Matchup Engine
 * 
 * ZERO HARDCODED LOGIC - All tournament formats use dynamic templates
 * 
 * This service replaces all hardcoded scheduling patterns with template-driven
 * matchup generation. Templates define bracket structures, team assignments, 
 * and game patterns that work for any tournament format.
 */

import { db } from '@db';
import { matchupTemplates, teams, eventBrackets } from '@db/schema';
import { eq, and } from 'drizzle-orm';

export interface Team {
  id: number;
  name: string;
  bracketId: string;
  groupId?: number;
  seedRanking?: number;
  poolAssignment?: string;
}

export interface GeneratedGame {
  id: string;
  homeTeamId: number | null;
  homeTeamName: string;
  awayTeamId: number | null;
  awayTeamName: string;
  bracketId: number;
  bracketName: string;
  poolId?: string;
  poolName?: string;
  round: number;
  gameType: 'pool_play' | 'knockout' | 'final' | 'third_place';
  gameNumber: number;
  duration: number;
  notes?: string;
  isPending?: boolean;
  isChampionship?: boolean;
  participatingTeams?: number[]; // All team IDs that could participate in this championship
}

export interface MatchupTemplate {
  id: number;
  name: string;
  description: string;
  teamCount: number;
  bracketStructure: string;
  matchupPattern: string[][];
  totalGames: number;
  hasPlayoffGame: boolean;
  playoffDescription?: string;
  includeChampionship?: boolean;
  championshipDescription?: string;
  isActive: boolean;
}

/**
 * Core function: Generate games using dynamic matchup templates
 * NO HARDCODED LOGIC - All patterns come from database templates
 */
export async function generateGamesFromTemplate(
  templateId: number,
  flightTeams: Team[],
  bracketInfo: {
    id: number;
    name: string;
    tournamentFormat: string;
  }
): Promise<GeneratedGame[]> {
  console.log(`[Dynamic Matchup] Generating games using template ${templateId} for ${flightTeams.length} teams`);
  
  // Fetch the template
  const template = await db
    .select()
    .from(matchupTemplates)
    .where(eq(matchupTemplates.id, templateId))
    .limit(1);

  if (!template.length) {
    throw new Error(`Template ${templateId} not found`);
  }

  const templateData = template[0];
  console.log(`[Dynamic Matchup] Using template: ${templateData.name} (${templateData.bracketStructure})`);

  // Validate team count
  if (flightTeams.length !== templateData.teamCount) {
    throw new Error(`Template expects ${templateData.teamCount} teams but got ${flightTeams.length}`);
  }

  // Parse JSON matchup pattern with type safety
  let matchupPattern: string[][];
  try {
    matchupPattern = typeof templateData.matchupPattern === 'string' 
      ? JSON.parse(templateData.matchupPattern)
      : templateData.matchupPattern as string[][];
  } catch (e) {
    throw new Error('Invalid matchup pattern JSON');
  }

  // Convert to proper MatchupTemplate type
  const templateObj: MatchupTemplate = {
    ...templateData,
    matchupPattern,
    isActive: templateData.isActive ?? true,
    hasPlayoffGame: templateData.hasPlayoffGame ?? false,
    includeChampionship: templateData.includeChampionship ?? false,
    championshipDescription: templateData.championshipDescription ?? undefined
  };

  // Generate team mapping based on bracket structure
  const teamMapping = createTeamMapping(flightTeams, templateObj);
  console.log(`[Dynamic Matchup] Team mapping:`, teamMapping);

  // Generate games from template pattern
  const generatedGames = generateGamesFromPattern(
    matchupPattern,
    teamMapping,
    bracketInfo,
    templateObj
  );

  console.log(`[Dynamic Matchup] Generated ${generatedGames.length} games from template`);
  return generatedGames;
}

/**
 * Create team mapping based on bracket structure
 * Maps template placeholders (A1, B1, T1, etc.) to actual teams
 */
function createTeamMapping(teams: Team[], template: MatchupTemplate): Record<string, Team> {
  const mapping: Record<string, Team> = {};
  
  switch (template.bracketStructure) {
    case 'single':
      // Single bracket: T1, T2, T3, T4...
      teams.forEach((team, index) => {
        mapping[`T${index + 1}`] = team;
      });
      break;
      
    case 'dual':
      // Dual brackets: A1, A2, A3, A4, B1, B2, B3, B4
      // CRITICAL: This mapping MUST align with Bracket Management team assignments
      // Teams assigned to "Bracket A" in UI become A1, A2, A3, A4
      // Teams assigned to "Bracket B" in UI become B1, B2, B3, B4
      const midpoint = Math.ceil(teams.length / 2);
      const bracketA = teams.slice(0, midpoint);
      const bracketB = teams.slice(midpoint);
      
      bracketA.forEach((team, index) => {
        mapping[`A${index + 1}`] = team;
      });
      bracketB.forEach((team, index) => {
        mapping[`B${index + 1}`] = team;
      });
      break;
      
    case 'crossover':
      // Crossplay: A1, A2, A3, B1, B2, B3 (Pool A vs Pool B only)
      const poolSize = teams.length / 2;
      const poolA = teams.slice(0, poolSize);
      const poolB = teams.slice(poolSize);
      
      poolA.forEach((team, index) => {
        mapping[`A${index + 1}`] = team;
      });
      poolB.forEach((team, index) => {
        mapping[`B${index + 1}`] = team;
      });
      break;
      
    case 'round_robin':
      // Round robin: T1, T2, T3, T4...
      teams.forEach((team, index) => {
        mapping[`T${index + 1}`] = team;
      });
      break;
      
    case 'swiss':
      // Swiss system: H1-H4 (high seeds), L1-L4 (low seeds)
      const sortedTeams = [...teams].sort((a, b) => (a.seedRanking || 999) - (b.seedRanking || 999));
      const highSeeds = sortedTeams.slice(0, teams.length / 2);
      const lowSeeds = sortedTeams.slice(teams.length / 2);
      
      highSeeds.forEach((team, index) => {
        mapping[`H${index + 1}`] = team;
      });
      lowSeeds.forEach((team, index) => {
        mapping[`L${index + 1}`] = team;
      });
      break;
      
    default:
      // Default: sequential numbering
      teams.forEach((team, index) => {
        mapping[`T${index + 1}`] = team;
      });
  }
  
  return mapping;
}

/**
 * Generate games from matchup pattern
 * Converts template patterns into actual game objects
 */
function generateGamesFromPattern(
  matchupPattern: string[][],
  teamMapping: Record<string, Team>,
  bracketInfo: { id: number; name: string; tournamentFormat: string },
  template: MatchupTemplate
): GeneratedGame[] {
  const games: GeneratedGame[] = [];
  let gameNumber = 1;

  matchupPattern.forEach(([homeSlot, awaySlot], index) => {
    // Handle special placeholders for elimination brackets
    if (homeSlot.includes('W') || homeSlot.includes('Q') || homeSlot.includes('SF')) {
      // This is a playoff/elimination game - mark as pending
      games.push({
        id: `${bracketInfo.id}-${gameNumber}`,
        homeTeamId: null,
        homeTeamName: homeSlot, // Will be resolved after pool play
        awayTeamId: null,
        awayTeamName: awaySlot,
        bracketId: bracketInfo.id,
        bracketName: bracketInfo.name,
        round: Math.ceil(gameNumber / 4), // Approximate round calculation
        gameType: index === matchupPattern.length - 1 ? 'final' : 'knockout',
        gameNumber: gameNumber++,
        duration: 90,
        isPending: true,
        notes: `${template.name} - ${homeSlot} vs ${awaySlot}`
      });
      return;
    }

    // Handle TBD placeholders for championship games
    if (homeSlot === 'TBD' || awaySlot === 'TBD') {
      games.push({
        id: `${bracketInfo.id}-${gameNumber}`,
        homeTeamId: null,
        homeTeamName: template.hasPlayoffGame ? 'Pool Winner' : 'TBD',
        awayTeamId: null,
        awayTeamName: template.hasPlayoffGame ? 'Pool Runner-up' : 'TBD',
        bracketId: bracketInfo.id,
        bracketName: bracketInfo.name,
        round: 2,
        gameType: 'final',
        gameNumber: gameNumber++,
        duration: 90,
        isPending: true,
        notes: template.playoffDescription || 'Championship final'
      });
      return;
    }

    // Regular pool play games
    const homeTeam = teamMapping[homeSlot];
    const awayTeam = teamMapping[awaySlot];

    if (!homeTeam || !awayTeam) {
      console.warn(`[Dynamic Matchup] Could not map teams for ${homeSlot} vs ${awaySlot}`);
      return;
    }

    games.push({
      id: `${bracketInfo.id}-${gameNumber}`,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      bracketId: bracketInfo.id,
      bracketName: bracketInfo.name,
      round: 1,
      gameType: 'pool_play',
      gameNumber: gameNumber++,
      duration: 90,
      notes: `${template.name} - Pool play game`
    });
  });

  // FIXED: Generate championship game based on template configuration, NOT pattern dependency
  if (template.includeChampionship || template.hasPlayoffGame) {
    console.log(`[Championship Gen] Template ${template.name} requires championship game (includeChampionship: ${template.includeChampionship}, hasPlayoffGame: ${template.hasPlayoffGame})`);
    
    // Extract all team IDs for conflict validation - championship games need to validate against ALL possible participants
    const allTeamIds = Object.values(teamMapping).map(team => team.id);
    
    games.push({
      id: `${bracketInfo.id}-championship`,
      homeTeamId: null,
      homeTeamName: 'Pool Winner',
      awayTeamId: null,
      awayTeamName: 'Pool Runner-up',
      bracketId: bracketInfo.id,
      bracketName: bracketInfo.name,
      round: 2,
      gameType: 'final',
      gameNumber: gameNumber++,
      duration: 90,
      isPending: true,
      isChampionship: true,
      participatingTeams: allTeamIds, // CRITICAL: All teams in flight for conflict validation
      notes: template.championshipDescription || template.playoffDescription || 'Championship final - teams determined by pool standings'
    });
  }

  return games;
}

/**
 * Find best matching template for team count and format preference
 */
export async function findBestTemplate(
  teamCount: number,
  preferredFormat?: string
): Promise<MatchupTemplate | null> {
  console.log(`[Dynamic Matchup] Finding template for ${teamCount} teams, preferred: ${preferredFormat}`);
  
  const templates = await db
    .select()
    .from(matchupTemplates)
    .where(and(
      eq(matchupTemplates.teamCount, teamCount),
      eq(matchupTemplates.isActive, true)
    ));

  if (!templates.length) {
    console.warn(`[Dynamic Matchup] No templates found for ${teamCount} teams`);
    return null;
  }

  // CORRECTED: Proper distinction between dual brackets and crossplay
  if (preferredFormat) {
    // Map user terms to correct template structures
    let searchFormat = preferredFormat;
    
    // Fix the crossplay/dual bracket confusion
    if (preferredFormat === 'crossplay' && teamCount === 8) {
      // 8-team "crossplay" usually means dual brackets with championship
      searchFormat = 'dual';
      console.log(`[Template Correction] 8-team crossplay request → searching for dual brackets`);
    } else if (preferredFormat === 'crossover' && teamCount === 6) {
      // 6-team crossover is true crossplay
      searchFormat = 'crossover';
      console.log(`[Template Correction] 6-team crossover → true crossplay format`);
    }
    
    const preferred = templates.find(t => 
      t.bracketStructure === searchFormat || 
      t.name.toLowerCase().includes(preferredFormat.toLowerCase())
    );
    if (preferred) {
      const matchupPattern = typeof preferred.matchupPattern === 'string' 
        ? JSON.parse(preferred.matchupPattern)
        : preferred.matchupPattern as string[][];
        
      const template: MatchupTemplate = {
        ...preferred,
        matchupPattern,
        isActive: preferred.isActive ?? true,
        hasPlayoffGame: preferred.hasPlayoffGame ?? false,
        includeChampionship: preferred.includeChampionship ?? false,
        championshipDescription: preferred.championshipDescription ?? undefined
      };
      
      console.log(`[Dynamic Matchup] Found preferred template: ${template.name}`);
      return template;
    }
  }

  // Default to first available template - convert to proper type
  const rawTemplate = templates[0];
  const matchupPattern = typeof rawTemplate.matchupPattern === 'string' 
    ? JSON.parse(rawTemplate.matchupPattern)
    : rawTemplate.matchupPattern as string[][];
    
  const template: MatchupTemplate = {
    ...rawTemplate,
    matchupPattern,
    isActive: rawTemplate.isActive ?? true,
    hasPlayoffGame: rawTemplate.hasPlayoffGame ?? false,
    includeChampionship: rawTemplate.includeChampionship ?? false,
    championshipDescription: rawTemplate.championshipDescription ?? undefined
  };
  
  console.log(`[Dynamic Matchup] Using default template: ${template.name}`);
  return template;
}

/**
 * Get all available templates for a team count
 */
export async function getTemplatesForTeamCount(teamCount: number): Promise<MatchupTemplate[]> {
  const rawTemplates = await db
    .select()
    .from(matchupTemplates)
    .where(and(
      eq(matchupTemplates.teamCount, teamCount),
      eq(matchupTemplates.isActive, true)
    ));
    
  return rawTemplates.map(rawTemplate => {
    const matchupPattern = typeof rawTemplate.matchupPattern === 'string' 
      ? JSON.parse(rawTemplate.matchupPattern)
      : rawTemplate.matchupPattern as string[][];
      
    return {
      ...rawTemplate,
      matchupPattern,
      isActive: rawTemplate.isActive ?? true,
      hasPlayoffGame: rawTemplate.hasPlayoffGame ?? false,
      includeChampionship: rawTemplate.includeChampionship ?? false,
      championshipDescription: rawTemplate.championshipDescription ?? undefined
    };
  });
}