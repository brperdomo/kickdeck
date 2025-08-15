// Advanced team name matching utilities for CSV import
// Handles common variations, abbreviations, and fuzzy matching

interface Team {
  id: number;
  name: string;
}

interface MatchResult {
  team: Team;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'partial' | 'abbreviation';
  suggestion: string;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Normalize team name for comparison (remove common words, standardize format)
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|sc|united|soccer|club|team|academy|youth)\b/g, '') // Remove common soccer terms
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Extract key identifiers from team name (age group, location, main name)
 */
function extractTeamIdentifiers(name: string): {
  ageGroup?: string;
  location?: string;
  mainName: string;
  color?: string;
} {
  const lowerName = name.toLowerCase();
  
  // Extract age group patterns
  const ageGroupMatch = lowerName.match(/\b(u\d{1,2}|under\s*\d{1,2}|\d{4}|\d{2}[bg]?)\b/);
  const ageGroup = ageGroupMatch?.[0];
  
  // Extract color patterns
  const colorMatch = lowerName.match(/\b(red|blue|white|black|green|yellow|orange|purple|gold|silver)\b/);
  const color = colorMatch?.[0];
  
  // Extract location/club patterns
  const locationMatch = lowerName.match(/\b([a-z]{3,}\s*(fc|sc|united|soccer|club))/);
  const location = locationMatch?.[0];
  
  // Main name is what remains after removing age, color, common terms
  let mainName = name
    .replace(new RegExp(ageGroup || '', 'gi'), '')
    .replace(new RegExp(color || '', 'gi'), '')
    .replace(/\b(fc|sc|united|soccer|club|team|academy|youth)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (!mainName) mainName = name; // Fallback to original if nothing remains
  
  return {
    ageGroup,
    location,
    mainName,
    color
  };
}

/**
 * Find the best matching team from existing teams
 */
export function findBestTeamMatch(
  csvTeamName: string, 
  existingTeams: Team[],
  threshold: number = 0.7
): MatchResult[] {
  const results: MatchResult[] = [];
  const normalizedCsvName = normalizeTeamName(csvTeamName);
  const csvIdentifiers = extractTeamIdentifiers(csvTeamName);
  
  for (const team of existingTeams) {
    const normalizedExistingName = normalizeTeamName(team.name);
    const existingIdentifiers = extractTeamIdentifiers(team.name);
    
    // 1. Exact match (highest confidence)
    if (team.name.toLowerCase() === csvTeamName.toLowerCase()) {
      results.push({
        team,
        confidence: 1.0,
        matchType: 'exact',
        suggestion: `Exact match found`
      });
      continue;
    }
    
    // 2. Normalized exact match
    if (normalizedExistingName === normalizedCsvName) {
      results.push({
        team,
        confidence: 0.95,
        matchType: 'exact',
        suggestion: `Match after removing common terms`
      });
      continue;
    }
    
    // 3. Identifier-based matching (age group + main name)
    if (csvIdentifiers.ageGroup && existingIdentifiers.ageGroup) {
      if (csvIdentifiers.ageGroup === existingIdentifiers.ageGroup &&
          csvIdentifiers.mainName.toLowerCase().includes(existingIdentifiers.mainName.toLowerCase())) {
        results.push({
          team,
          confidence: 0.9,
          matchType: 'partial',
          suggestion: `Same age group (${csvIdentifiers.ageGroup}) and similar name`
        });
        continue;
      }
    }
    
    // 4. Fuzzy string matching using Levenshtein distance
    const distance = levenshteinDistance(normalizedCsvName, normalizedExistingName);
    const maxLen = Math.max(normalizedCsvName.length, normalizedExistingName.length);
    const similarity = 1 - (distance / maxLen);
    
    if (similarity >= threshold) {
      results.push({
        team,
        confidence: similarity,
        matchType: 'fuzzy',
        suggestion: `${Math.round(similarity * 100)}% similarity in name`
      });
      continue;
    }
    
    // 5. Partial contains matching
    if (normalizedCsvName.includes(normalizedExistingName) || 
        normalizedExistingName.includes(normalizedCsvName)) {
      results.push({
        team,
        confidence: 0.8,
        matchType: 'partial',
        suggestion: `One name contains the other`
      });
      continue;
    }
    
    // 6. Abbreviation matching
    const csvWords = normalizedCsvName.split(' ').filter(w => w.length > 2);
    const existingWords = normalizedExistingName.split(' ').filter(w => w.length > 2);
    
    if (csvWords.length > 0 && existingWords.length > 0) {
      const matchingWords = csvWords.filter(csvWord => 
        existingWords.some(existingWord => 
          csvWord.startsWith(existingWord) || 
          existingWord.startsWith(csvWord) ||
          csvWord === existingWord
        )
      );
      
      if (matchingWords.length / csvWords.length >= 0.6) {
        results.push({
          team,
          confidence: 0.75,
          matchType: 'abbreviation',
          suggestion: `${matchingWords.length}/${csvWords.length} words match`
        });
      }
    }
  }
  
  // Sort by confidence (highest first) and return top matches
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Return top 5 matches
}

/**
 * Generate validation warnings for potentially problematic matches
 */
export function generateMatchWarnings(
  csvTeamName: string,
  matches: MatchResult[]
): string[] {
  const warnings: string[] = [];
  
  if (matches.length === 0) {
    warnings.push(`No matching team found for "${csvTeamName}"`);
    return warnings;
  }
  
  const bestMatch = matches[0];
  
  // Multiple high-confidence matches (ambiguous)
  const highConfidenceMatches = matches.filter(m => m.confidence > 0.85);
  if (highConfidenceMatches.length > 1) {
    warnings.push(`Multiple teams match "${csvTeamName}": ${highConfidenceMatches.map(m => m.team.name).join(', ')}`);
  }
  
  // Low confidence match
  if (bestMatch.confidence < 0.8) {
    warnings.push(`Low confidence match for "${csvTeamName}" → "${bestMatch.team.name}" (${Math.round(bestMatch.confidence * 100)}%)`);
  }
  
  // Age group mismatch
  const csvAge = extractTeamIdentifiers(csvTeamName).ageGroup;
  const matchAge = extractTeamIdentifiers(bestMatch.team.name).ageGroup;
  if (csvAge && matchAge && csvAge !== matchAge) {
    warnings.push(`Age group mismatch: "${csvTeamName}" (${csvAge}) → "${bestMatch.team.name}" (${matchAge})`);
  }
  
  return warnings;
}