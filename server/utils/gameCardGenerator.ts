import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { db } from '../../db';
import { teams, players, games, events, eventAgeGroups } from '@db/schema';
import { eq, and } from 'drizzle-orm';

interface GameData {
  gameNumber: string;
  date: string;
  time: string;
  venue: string;
  field: string;
  homeTeam: string;
  awayTeam: string;
}

interface PlayerData {
  name: string;
  dateOfBirth: string;
  jerseyNumber?: string;
}

interface TeamData {
  name: string;
  headCoach: string;
  manager: string;
  players: PlayerData[];
}

export class GameCardGenerator {
  private doc: PDFDocument;
  private pageWidth: number = 612; // 8.5 inches
  private pageHeight: number = 792; // 11 inches
  private margin: number = 36; // 0.5 inches

  constructor() {
    this.doc = new PDFDocument({
      size: 'letter',
      margins: {
        top: this.margin,
        bottom: this.margin,
        left: this.margin,
        right: this.margin
      }
    });
  }

  async generateGameCard(teamId: number, eventId: string): Promise<Buffer> {
    // Fetch team data
    const teamData = await this.fetchTeamData(teamId);
    if (!teamData) {
      throw new Error('Team not found');
    }

    // Fetch event data
    const eventData = await this.fetchEventData(eventId);
    if (!eventData) {
      throw new Error('Event not found');
    }

    // Fetch team's games
    const gamesData = await this.fetchTeamGames(teamId, eventId);

    // Generate the card
    await this.renderGameCard(teamData, eventData, gamesData);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }

  private async fetchTeamData(teamId: number): Promise<TeamData | null> {
    try {
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (team.length === 0) return null;

      const teamPlayers = await db
        .select()
        .from(players)
        .where(eq(players.teamId, teamId));

      return {
        name: team[0].teamName,
        headCoach: team[0].headCoach || 'TBD',
        manager: team[0].managerName || team[0].headCoach || 'TBD',
        players: teamPlayers.map(player => ({
          name: `${player.lastName}, ${player.firstName}`,
          dateOfBirth: this.formatDate(player.dateOfBirth),
          jerseyNumber: player.jerseyNumber?.toString()
        }))
      };
    } catch (error) {
      console.error('Error fetching team data:', error);
      return null;
    }
  }

  private async fetchEventData(eventId: string) {
    try {
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      return event.length > 0 ? event[0] : null;
    } catch (error) {
      console.error('Error fetching event data:', error);
      return null;
    }
  }

  private async fetchTeamGames(teamId: number, eventId: string): Promise<GameData[]> {
    try {
      const teamGames = await db
        .select({
          gameId: games.id,
          gameNumber: games.gameNumber,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          date: games.gameDate,
          time: games.gameTime,
          venue: games.venue,
          field: games.field,
          homeTeamName: teams.teamName,
          awayTeamName: teams.teamName
        })
        .from(games)
        .leftJoin(teams, eq(teams.id, games.homeTeamId))
        .where(
          and(
            eq(games.eventId, eventId),
            eq(games.homeTeamId, teamId)
          )
        );

      // Also get away games
      const awayGames = await db
        .select({
          gameId: games.id,
          gameNumber: games.gameNumber,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          date: games.gameDate,
          time: games.gameTime,
          venue: games.venue,
          field: games.field,
          homeTeamName: teams.teamName,
          awayTeamName: teams.teamName
        })
        .from(games)
        .leftJoin(teams, eq(teams.id, games.awayTeamId))
        .where(
          and(
            eq(games.eventId, eventId),
            eq(games.awayTeamId, teamId)
          )
        );

      const allGames = [...teamGames, ...awayGames];

      return allGames.map(game => ({
        gameNumber: `#${game.gameNumber || game.gameId}`,
        date: this.formatGameDate(game.date),
        time: game.time || 'TBD',
        venue: game.venue || 'TBD',
        field: game.field || 'TBD',
        homeTeam: game.homeTeamId === teamId ? 'HOME' : (game.homeTeamName || 'TBD'),
        awayTeam: game.awayTeamId === teamId ? 'AWAY' : (game.awayTeamName || 'TBD')
      })).slice(0, 6); // Limit to 6 games like the original
    } catch (error) {
      console.error('Error fetching team games:', error);
      return [];
    }
  }

  private async renderGameCard(teamData: TeamData, eventData: any, gamesData: GameData[]) {
    // Header Section
    this.renderHeader(teamData, eventData);
    
    // Team Roster Section
    this.renderTeamRoster(teamData);
    
    // Games Section
    this.renderGamesSection(gamesData);
    
    // Signature Section
    this.renderSignatureSection();
  }

  private renderHeader(teamData: TeamData, eventData: any) {
    const startY = 50;
    
    // Team Roster title
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Team Roster', this.margin, startY);

    // Team info on the right
    const rightX = this.pageWidth - this.margin - 200;
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(teamData.name, rightX, startY)
      .fontSize(10)
      .font('Helvetica')
      .text(`Head Coach: ${teamData.headCoach}`, rightX, startY + 20)
      .text(`Manager: ${teamData.manager}`, rightX, startY + 35);

    // Event info
    if (eventData) {
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(eventData.name, rightX, startY + 55)
        .fontSize(10)
        .font('Helvetica')
        .text(eventData.divisionName || 'Tournament Division', rightX, startY + 70);
    }
  }

  private renderTeamRoster(teamData: TeamData) {
    const startY = 120;
    const lineHeight = 14;
    
    // Column headers
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('#', this.margin, startY)
      .text('NAME', this.margin + 40, startY)
      .text('DOB', this.margin + 200, startY);

    // Draw underline
    this.doc
      .moveTo(this.margin, startY + 12)
      .lineTo(this.margin + 300, startY + 12)
      .stroke();

    // Player rows
    let currentY = startY + 25;
    teamData.players.forEach((player, index) => {
      if (currentY > 350) return; // Stop if we run out of space

      this.doc
        .fontSize(10)
        .font('Helvetica')
        .text(player.jerseyNumber || '', this.margin, currentY)
        .text(player.name, this.margin + 40, currentY)
        .text(player.dateOfBirth, this.margin + 200, currentY);

      currentY += lineHeight;
    });
  }

  private renderGamesSection(gamesData: GameData[]) {
    const startY = 400;
    const gameWidth = 170;
    const gameHeight = 120;
    
    // Render up to 6 games in 2 rows of 3
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = this.margin + (col * (gameWidth + 10));
      const y = startY + (row * (gameHeight + 20));

      this.renderSingleGame(gamesData[i], x, y, gameWidth, gameHeight, i + 1);
    }
  }

  private renderSingleGame(gameData: GameData | undefined, x: number, y: number, width: number, height: number, gameNum: number) {
    // Draw border
    this.doc
      .rect(x, y, width, height)
      .stroke();

    if (!gameData) {
      // No data case
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Game ${gameNum}`, x + 5, y + 5)
        .fontSize(8)
        .font('Helvetica')
        .text('No Data found', x + 5, y + 20)
        .text('Venue:', x + 5, y + 35)
        .text('Game #', x + 5, y + 50);
    } else {
      // Game with data
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Game ${gameNum}`, x + 5, y + 5)
        .fontSize(8)
        .font('Helvetica')
        .text(gameData.date, x + 5, y + 20)
        .text(gameData.time, x + 100, y + 20)
        .text(`Venue: ${gameData.venue}`, x + 5, y + 35)
        .text(gameData.gameNumber, x + 5, y + 50);
    }

    // Score tracking section
    const scoreY = y + 65;
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .text('H', x + 5, scoreY)
      .text('O', x + 5, scoreY + 10)
      .text('M', x + 5, scoreY + 20)
      .text('E', x + 5, scoreY + 30)
      .text('Initials', x + 5, scoreY + 40);

    // Score boxes
    const boxSize = 12;
    const periods = ['1st', '2nd', 'OT', 'SO', 'Final'];
    periods.forEach((period, idx) => {
      const boxX = x + 25 + (idx * (boxSize + 2));
      this.doc
        .fontSize(6)
        .text(period, boxX, scoreY - 8)
        .rect(boxX, scoreY + 15, boxSize, boxSize)
        .stroke();
    });

    // Away team section
    const awayY = scoreY + 35;
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .text('A', x + 5, awayY)
      .text('W', x + 5, awayY + 10)
      .text('A', x + 5, awayY + 20)
      .text('Y', x + 5, awayY + 30)
      .text('Initials', x + 5, awayY + 40);

    // Away score boxes
    periods.forEach((period, idx) => {
      const boxX = x + 25 + (idx * (boxSize + 2));
      this.doc
        .rect(boxX, awayY + 15, boxSize, boxSize)
        .stroke();
    });

    // Team names if available
    if (gameData) {
      this.doc
        .fontSize(7)
        .text(gameData.homeTeam.substring(0, 20), x + 15, scoreY + 5)
        .text(gameData.awayTeam.substring(0, 20), x + 15, awayY + 5);
    }
  }

  private renderSignatureSection() {
    const y = this.pageHeight - 100;
    
    // Signature line
    this.doc
      .moveTo(this.margin, y)
      .lineTo(this.margin + 200, y)
      .stroke()
      .fontSize(10)
      .font('Helvetica')
      .text('TEAM SIGNATURE', this.margin, y + 10);

    // X marking box
    this.doc
      .rect(this.margin - 20, y - 30, 15, 15)
      .stroke()
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('X', this.margin - 17, y - 27);
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return '';
    }
  }

  private formatGameDate(dateString: string | null): string {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return 'TBD';
    }
  }
}