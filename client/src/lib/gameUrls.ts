/**
 * Utility functions for generating game URLs and QR codes
 */

/**
 * Generate a public game score URL that can be accessed without authentication
 * @param gameId - The ID of the game
 * @param baseUrl - Optional base URL (defaults to current domain)
 * @returns Full URL to the public game score page
 */
export function generateGameScoreUrl(gameId: number | string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/game/${gameId}`;
}

/**
 * Generate a QR code-friendly short URL for game score submission
 * @param gameId - The ID of the game
 * @returns Relative URL path for the game score page
 */
export function generateGameScoreShortUrl(gameId: number | string): string {
  return `/game/${gameId}`;
}

/**
 * Generate the API endpoint URL for score submission
 * @param gameId - The ID of the game
 * @returns API endpoint URL for POST requests
 */
export function generateScoreSubmissionApiUrl(gameId: number | string): string {
  return `/api/public/games/${gameId}/score`;
}

/**
 * Generate the API endpoint URL for game data retrieval
 * @param gameId - The ID of the game
 * @returns API endpoint URL for GET requests
 */
export function generateGameDataApiUrl(gameId: number | string): string {
  return `/api/public/games/${gameId}`;
}

/**
 * Extract game ID from a game score URL
 * @param url - The game score URL
 * @returns Game ID or null if not found
 */
export function extractGameIdFromUrl(url: string): string | null {
  const match = url.match(/\/game\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Validate if a URL is a valid game score URL
 * @param url - The URL to validate
 * @returns True if valid game score URL
 */
export function isValidGameScoreUrl(url: string): boolean {
  return /\/game\/\d+/.test(url);
}

/**
 * Generate a shareable text message with game information and score URL
 * @param gameData - Game information
 * @param includeQrUrl - Whether to include the QR code URL
 * @returns Formatted message for sharing
 */
export function generateShareableGameMessage(gameData: {
  homeTeam: string;
  awayTeam: string;
  startTime?: string;
  field?: string;
  gameId: number | string;
}, includeQrUrl: boolean = true): string {
  const gameUrl = generateGameScoreUrl(gameData.gameId);
  
  let message = `🏆 ${gameData.homeTeam} vs ${gameData.awayTeam}\n`;
  
  if (gameData.startTime) {
    const date = new Date(gameData.startTime);
    message += `📅 ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
  }
  
  if (gameData.field) {
    message += `🏟️ ${gameData.field}\n`;
  }
  
  message += `\n📱 Submit scores: ${gameUrl}`;
  
  if (includeQrUrl) {
    message += `\n📄 QR Code available for easy mobile access`;
  }
  
  return message;
}