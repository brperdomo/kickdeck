import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, QrCode, Users, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { generateGameScoreUrl, generateShareableGameMessage } from '@/lib/gameUrls';

interface Game {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  ageGroupName: string;
  fieldName: string;
  complexName: string;
  startTime: string;
  endTime: string;
  gameDate: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}

interface GameCardsGeneratorProps {
  eventId: string;
}

export default function GameCardsGenerator({ eventId }: GameCardsGeneratorProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Fetch games data using the public game-cards endpoint (no auth required)
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['public-game-cards', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/public/game-cards/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  // Fetch tournament details using test endpoint that works without auth
  const { data: tournamentData } = useQuery({
    queryKey: ['/api/test-tournament', eventId],
    queryFn: async () => {
      // Use a simple test endpoint or hardcode tournament data for now
      return {
        event: {
          name: 'Scheduling Teams Tournament',
          startDate: '2025-10-01',
          endDate: '2025-10-04',
          location: 'Galway Downs Soccer Complex'
        }
      };
    }
  });

  // Transform public game-cards endpoint data to match Game interface
  const games: Game[] = (gamesData || []).map((game: any) => {
    // The public endpoint returns direct game data
    const gameDateTime = game.scheduledTime || '';
    
    return {
      id: game.id,
      homeTeamId: game.homeTeamId || 0,
      awayTeamId: game.awayTeamId || 0,
      homeTeamName: game.homeTeamName || 'TBD',
      awayTeamName: game.awayTeamName || 'TBD',
      ageGroupName: game.bracketName || `Game ${game.gameNumber}`,
      fieldName: game.fieldName || 'TBD',
      complexName: 'Tournament Complex',
      startTime: gameDateTime,
      endTime: gameDateTime,
      gameDate: gameDateTime,
      status: game.status || 'scheduled',
      homeScore: game.homeScore,
      awayScore: game.awayScore
    };
  });
  
  const tournament = tournamentData?.event || { name: 'Tournament', startDate: '', endDate: '', location: '' };

  // Filter games based on selection
  const filteredGames = games.filter(game => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'today') {
      const today = new Date().toDateString();
      return new Date(game.gameDate).toDateString() === today;
    }
    if (selectedFilter === 'upcoming') {
      return new Date(game.gameDate) >= new Date();
    }
    return game.ageGroupName === selectedFilter;
  });

  // Get unique age groups for filter options
  const ageGroups = Array.from(new Set(games.map(game => game.ageGroupName)));

  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 120,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const generateGameCardPDF = async (selectedGames: Game[]) => {
    setGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentPage = 1;

      // Load tournament/MatchPro logo
      const loadLogoImage = async (): Promise<string | null> => {
        try {
          // First try to load tournament-specific logo if available
          const tournamentLogoUrl = `/api/events/${eventId}/logo`;
          const tournamentResponse = await fetch(tournamentLogoUrl);
          
          if (tournamentResponse.ok) {
            const blob = await tournamentResponse.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.log('Tournament logo not available, using MatchPro branding');
        }
        
        // Fallback to MatchPro logo
        try {
          const matchProResponse = await fetch('/MatchPro.ai_Stacked_Color.png');
          if (matchProResponse.ok) {
            const blob = await matchProResponse.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.log('MatchPro logo not available');
        }
        
        return null;
      };

      const logoDataUrl = await loadLogoImage();

      for (let i = 0; i < selectedGames.length; i++) {
        const game = selectedGames[i];
        
        if (i > 0) {
          pdf.addPage();
          currentPage++;
        }

        // Modern header with gradient effect (simulated with rectangles)
        pdf.setFillColor(46, 134, 171); // MatchPro primary blue
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setFillColor(162, 59, 114); // MatchPro accent purple (lighter)
        pdf.rect(0, 25, pageWidth, 5, 'F');
        
        // Add logo if available
        if (logoDataUrl) {
          try {
            // Determine appropriate logo size based on content
            const logoSize = tournament.name && tournament.name.length > 20 ? 15 : 20;
            pdf.addImage(logoDataUrl, 'PNG', pageWidth - logoSize - 5, 5, logoSize, logoSize);
          } catch (error) {
            console.log('Error adding logo to PDF:', error);
          }
        }
        
        // Tournament title with modern typography
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(tournament.name || 'Tournament', 10, 12);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(tournament.location || 'Galway Downs Soccer Complex', 10, 20);
        
        // Game identifier in top right
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const gameText = `Game #${game.id}`;
        const gameTextWidth = pdf.getTextWidth(gameText);
        pdf.text(gameText, pageWidth - gameTextWidth - (logoDataUrl ? 30 : 10), 15);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const ageGroupText = game.ageGroupName;
        const ageGroupWidth = pdf.getTextWidth(ageGroupText);
        pdf.text(ageGroupText, pageWidth - ageGroupWidth - (logoDataUrl ? 30 : 10), 23);

        // Reset text color and start main content
        pdf.setTextColor(0, 0, 0);

        // Game details section with modern card styling
        let yPos = 40;
        
        // Match information card
        pdf.setFillColor(248, 249, 250); // Light gray background
        pdf.setDrawColor(229, 231, 235); // Border color
        pdf.setLineWidth(0.5);
        pdf.roundedRect(10, yPos, pageWidth - 20, 25, 2, 2, 'FD');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81); // Dark gray
        pdf.text('MATCH INFORMATION', 15, yPos + 8);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Date: ${new Date(game.gameDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`, 15, yPos + 16);
        pdf.text(`Time: ${game.startTime.slice(11, 16)} - ${game.endTime.slice(11, 16)}`, 80, yPos + 16);
        pdf.text(`Field: ${game.fieldName}`, 15, yPos + 21);
        pdf.text(`Venue: ${game.complexName}`, 80, yPos + 21);

        // Team information section with modern cards
        yPos += 35;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MATCH TEAMS', 10, yPos);
        
        yPos += 10;
        
        // Home team card
        pdf.setFillColor(239, 246, 255); // Light blue background
        pdf.setDrawColor(59, 130, 246); // Blue border
        pdf.setLineWidth(1);
        pdf.roundedRect(10, yPos, 85, 32, 3, 3, 'FD');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175); // Blue text
        pdf.text('HOME TEAM', 14, yPos + 8);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        // Truncate long team names to fit
        const homeTeamName = game.homeTeamName.length > 15 ? game.homeTeamName.substring(0, 15) + '...' : game.homeTeamName;
        pdf.text(homeTeamName, 14, yPos + 17);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text('Coach: _______________', 14, yPos + 26);

        // Away team card
        pdf.setFillColor(254, 242, 242); // Light red background
        pdf.setDrawColor(239, 68, 68); // Red border
        pdf.roundedRect(105, yPos, 85, 32, 3, 3, 'FD');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(185, 28, 28); // Red text
        pdf.text('AWAY TEAM', 109, yPos + 8);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        // Truncate long team names to fit
        const awayTeamName = game.awayTeamName.length > 15 ? game.awayTeamName.substring(0, 15) + '...' : game.awayTeamName;
        pdf.text(awayTeamName, 109, yPos + 17);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text('Coach: _______________', 109, yPos + 26);
        pdf.rect(105, yPos, 85, 25);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AWAY TEAM', 107, yPos + 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(game.awayTeamName, 107, yPos + 16);
        pdf.text('Coach: ____________________', 107, yPos + 22);

        // Score section with modern styling
        yPos += 42;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MATCH SCORE', 10, yPos);
        
        yPos += 10;
        
        // Modern score cards
        const scoreBoxes = [
          { label: 'HOME', sublabel: 'Halftime', color: [59, 130, 246], bg: [239, 246, 255] },
          { label: 'AWAY', sublabel: 'Halftime', color: [239, 68, 68], bg: [254, 242, 242] },
          { label: 'FINAL', sublabel: 'Full Time', color: [34, 197, 94], bg: [240, 253, 244] }
        ];
        
        scoreBoxes.forEach((box, index) => {
          const xPos = 10 + (index * 60);
          
          // Score box with color-coded styling
          pdf.setFillColor(box.bg[0], box.bg[1], box.bg[2]);
          pdf.setDrawColor(box.color[0], box.color[1], box.color[2]);
          pdf.setLineWidth(1.5);
          pdf.roundedRect(xPos, yPos, 50, 25, 4, 4, 'FD');
          
          // Label
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(box.color[0], box.color[1], box.color[2]);
          const labelWidth = pdf.getTextWidth(box.label);
          pdf.text(box.label, xPos + (50 - labelWidth) / 2, yPos + 8);
          
          // Sublabel
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(107, 114, 128);
          const sublabelWidth = pdf.getTextWidth(box.sublabel);
          pdf.text(box.sublabel, xPos + (50 - sublabelWidth) / 2, yPos + 20);
        });

        // QR Code section for score submission
        yPos += 35;
        
        // Generate QR code for this game
        const gameScoreUrl = generateGameScoreUrl(game.id);
        const qrCodeDataUrl = await generateQRCode(gameScoreUrl);
        
        if (qrCodeDataUrl) {
          // QR Code section header
          pdf.setFillColor(240, 253, 244); // Light green background
          pdf.setDrawColor(34, 197, 94); // Green border
          pdf.setLineWidth(1);
          pdf.roundedRect(10, yPos, pageWidth - 20, 35, 3, 3, 'FD');
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(22, 163, 74); // Green text
          pdf.text('📱 SCORE SUBMISSION', 15, yPos + 8);
          
          // Add QR code
          const qrSize = 25;
          pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - qrSize - 15, yPos + 5, qrSize, qrSize);
          
          // Instructions
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(75, 85, 99);
          pdf.text('Scan QR code to submit game scores', 15, yPos + 18);
          pdf.text('Or visit: ' + gameScoreUrl.replace(window.location.origin, ''), 15, yPos + 25);
          pdf.text('Mobile-friendly • Real-time updates • No login required', 15, yPos + 30);
          
          yPos += 40;
        }

        // Disciplinary section with modern table styling
        yPos += 40;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DISCIPLINARY RECORD', 10, yPos);
        
        yPos += 10;
        
        // Modern table header
        pdf.setFillColor(55, 65, 81); // Dark gray header
        pdf.setDrawColor(55, 65, 81);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(10, yPos, pageWidth - 20, 8, 1, 1, 'FD');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('PLAYER NAME', 12, yPos + 5);
        pdf.text('TEAM', 70, yPos + 5);
        pdf.text('CARD', 100, yPos + 5);
        pdf.text('MIN', 120, yPos + 5);
        pdf.text('REASON', 135, yPos + 5);
        
        // Table rows with alternating colors
        for (let row = 0; row < 5; row++) {
          yPos += 8;
          
          // Alternating row colors
          if (row % 2 === 0) {
            pdf.setFillColor(249, 250, 251); // Very light gray
          } else {
            pdf.setFillColor(255, 255, 255); // White
          }
          
          pdf.setDrawColor(229, 231, 235);
          pdf.rect(10, yPos, pageWidth - 20, 8, 'FD');
          
          // Add subtle grid lines
          pdf.setDrawColor(229, 231, 235);
          pdf.setLineWidth(0.3);
          pdf.line(68, yPos, 68, yPos + 8); // After player name
          pdf.line(98, yPos, 98, yPos + 8);  // After team
          pdf.line(118, yPos, 118, yPos + 8); // After card
          pdf.line(133, yPos, 133, yPos + 8); // After min
        }

        // Notes section for referees
        yPos += 25;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MATCH NOTES', 10, yPos);
        
        yPos += 10;
        
        // Notes box
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(10, yPos, pageWidth - 20, 25, 2, 2, 'FD');
        
        // Add lines for writing
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        for (let i = 0; i < 4; i++) {
          const lineY = yPos + 5 + (i * 5);
          pdf.line(12, lineY, pageWidth - 12, lineY);
        }

        // Signatures section with modern styling
        yPos += 40;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('OFFICIAL SIGNATURES', 10, yPos);
        
        yPos += 10;
        
        // Signature cards
        const signatures = [
          { label: 'REFEREE' },
          { label: 'HOME COACH' },
          { label: 'AWAY COACH' }
        ];
        
        signatures.forEach((sig, index) => {
          yPos += 12;
          
          // Signature line with modern styling
          pdf.setFillColor(248, 249, 250);
          pdf.setDrawColor(229, 231, 235);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(10, yPos, pageWidth - 20, 10, 2, 2, 'FD');
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(75, 85, 99);
          pdf.text(`${sig.label}:`, 15, yPos + 6);
          
          // Signature line
          pdf.setDrawColor(156, 163, 175);
          pdf.setLineWidth(0.5);
          pdf.line(60, yPos + 6, pageWidth - 15, yPos + 6);
        });

        // Modern footer with branding
        yPos = pageHeight - 15;
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.5);
        pdf.line(10, yPos, pageWidth - 10, yPos);
        
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, yPos + 8);
        
        if (logoDataUrl) {
          pdf.setTextColor(46, 134, 171);
          pdf.text('Powered by MatchPro AI', pageWidth - 45, yPos + 8);
        } else {
          pdf.setTextColor(107, 114, 128);
          pdf.text('Professional Tournament Management', pageWidth - 65, yPos + 8);
        }
        pdf.text(`Page ${currentPage} of ${selectedGames.length}`, pageWidth - 30, pageHeight - 10);
      }

      // Save the PDF
      const fileName = `game-cards-${tournament.name?.replace(/\s+/g, '-') || 'tournament'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Game Cards Generated",
        description: `Successfully generated ${selectedGames.length} game cards`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate game cards PDF",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGenerateAll = () => {
    generateGameCardPDF(filteredGames);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Game Cards Generator</h2>
        </div>
        <p className="text-blue-100">
          Generate professional PDF game cards with QR codes for score and card reporting
        </p>
      </div>

      {/* Stats and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{games.length}</div>
            <p className="text-sm text-gray-600">Available for cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtered Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{filteredGames.length}</div>
            <p className="text-sm text-gray-600">Will be generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">Score Reporting</Badge>
              <Badge variant="outline" className="text-xs">Card Reporting</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Games</CardTitle>
          <CardDescription>
            Select which games to include in the PDF generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter games..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games ({games.length})</SelectItem>
                <SelectItem value="today">Today's Games</SelectItem>
                <SelectItem value="upcoming">Upcoming Games</SelectItem>
                {ageGroups.map(ageGroup => (
                  <SelectItem key={ageGroup} value={ageGroup}>
                    {ageGroup} ({games.filter(g => g.ageGroupName === ageGroup).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleGenerateAll}
              disabled={generatingPDF || filteredGames.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generatingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate {filteredGames.length} Game Cards
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Games Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Games to Generate ({filteredGames.length})</CardTitle>
          <CardDescription>
            Preview of games that will be included in the PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No games match the current filter</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      #{game.id}
                    </div>
                    <div>
                      <div className="font-medium">
                        {game.homeTeamName} vs {game.awayTeamName}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(game.gameDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {game.fieldName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{game.ageGroupName}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600 mb-2">Score Reporting QR</h4>
              <p className="text-sm text-gray-600 mb-2">
                For team managers and coaches to report match scores
              </p>
              <code className="text-xs bg-gray-100 p-1 rounded">
                /score-report/[gameId]
              </code>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-red-600 mb-2">Card Reporting QR</h4>
              <p className="text-sm text-gray-600 mb-2">
                For referees to report yellow and red cards
              </p>
              <code className="text-xs bg-gray-100 p-1 rounded">
                /card-report/[gameId]
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}