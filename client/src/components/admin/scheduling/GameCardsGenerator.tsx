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

  // Fetch games data
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'schedule-viewer'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-viewer`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  // Fetch tournament details
  const { data: tournamentData } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tournament details');
      return response.json();
    }
  });

  const games: Game[] = gamesData?.games || [];
  const tournament = tournamentData?.event || {};

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

      for (let i = 0; i < selectedGames.length; i++) {
        const game = selectedGames[i];
        
        if (i > 0) {
          pdf.addPage();
          currentPage++;
        }

        // Header with tournament info
        pdf.setFillColor(46, 134, 171); // MatchPro blue
        pdf.rect(0, 0, pageWidth, 25, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(tournament.name || 'Tournament', 10, 15);
        
        pdf.setFontSize(12);
        pdf.text(`Game #${game.id}`, pageWidth - 30, 10);
        pdf.text(`${game.ageGroupName}`, pageWidth - 30, 20);

        // Reset text color
        pdf.setTextColor(0, 0, 0);

        // Game details section
        let yPos = 35;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MATCH INFORMATION', 10, yPos);
        
        yPos += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Date: ${new Date(game.gameDate).toLocaleDateString()}`, 10, yPos);
        pdf.text(`Time: ${game.startTime} - ${game.endTime}`, 100, yPos);
        
        yPos += 8;
        pdf.text(`Field: ${game.fieldName}`, 10, yPos);
        pdf.text(`Venue: ${game.complexName}`, 100, yPos);

        // Team information section
        yPos += 20;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TEAMS', 10, yPos);
        
        // Home team box
        yPos += 10;
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(10, yPos, 85, 25);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('HOME TEAM', 12, yPos + 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(game.homeTeamName, 12, yPos + 16);
        pdf.text('Coach: ____________________', 12, yPos + 22);

        // Away team box
        pdf.rect(105, yPos, 85, 25);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AWAY TEAM', 107, yPos + 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(game.awayTeamName, 107, yPos + 16);
        pdf.text('Coach: ____________________', 107, yPos + 22);

        // Score section
        yPos += 35;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SCORE', 10, yPos);
        
        yPos += 10;
        // Score boxes
        pdf.rect(10, yPos, 40, 20);
        pdf.rect(60, yPos, 40, 20);
        pdf.rect(110, yPos, 40, 20);
        
        pdf.setFontSize(10);
        pdf.text('HOME', 25, yPos + 6);
        pdf.text('AWAY', 75, yPos + 6);
        pdf.text('FINAL', 125, yPos + 6);
        
        pdf.setFontSize(8);
        pdf.text('Halftime Score', 10, yPos + 25);
        pdf.text('Halftime Score', 60, yPos + 25);
        pdf.text('Full Time', 110, yPos + 25);

        // Disciplinary section
        yPos += 40;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DISCIPLINARY RECORD', 10, yPos);
        
        yPos += 10;
        // Table headers
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PLAYER NAME', 10, yPos);
        pdf.text('TEAM', 60, yPos);
        pdf.text('CARD', 90, yPos);
        pdf.text('MIN', 110, yPos);
        pdf.text('REASON', 130, yPos);
        
        // Draw lines for disciplinary entries
        for (let row = 0; row < 5; row++) {
          yPos += 8;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(10, yPos + 3, pageWidth - 10, yPos + 3);
        }

        // Generate QR codes
        const baseUrl = window.location.origin;
        const scoreReportUrl = `${baseUrl}/score-report/${game.id}`;
        const cardReportUrl = `${baseUrl}/card-report/${game.id}`;
        
        const scoreQR = await generateQRCode(scoreReportUrl);
        const cardQR = await generateQRCode(cardReportUrl);

        // Add QR codes
        yPos += 20;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('QR CODES', 10, yPos);
        
        yPos += 10;
        if (scoreQR) {
          pdf.addImage(scoreQR, 'PNG', 10, yPos, 30, 30);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Score Reporting', 10, yPos + 35);
          pdf.text('(Team Managers/Coaches)', 10, yPos + 40);
        }
        
        if (cardQR) {
          pdf.addImage(cardQR, 'PNG', 50, yPos, 30, 30);
          pdf.text('Card Reporting', 50, yPos + 35);
          pdf.text('(Referees)', 50, yPos + 40);
        }

        // Signatures section
        yPos += 50;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SIGNATURES', 10, yPos);
        
        yPos += 15;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Referee: ________________________________', 10, yPos);
        yPos += 15;
        pdf.text('Home Coach: ____________________________', 10, yPos);
        yPos += 15;
        pdf.text('Away Coach: ____________________________', 10, yPos);

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, pageHeight - 10);
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