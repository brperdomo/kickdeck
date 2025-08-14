import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Users, Trophy, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplatePreviewProps {
  template: {
    id: number;
    name: string;
    description: string;
    teamCount: number;
    bracketStructure: string;
    matchupPattern: string[][];
    totalGames: number;
    hasPlayoffGame: boolean;
    playoffDescription?: string;
  };
}

interface PreviewGame {
  gameNumber: number;
  round: number;
  homeTeam: string;
  awayTeam: string;
  gameType: 'pool_play' | 'knockout' | 'final' | 'third_place';
  isPlayoff: boolean;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate sample teams based on team count and bracket structure
  const generateSampleTeams = () => {
    const teams: string[] = [];
    
    if (template.bracketStructure === 'single') {
      // Single bracket: A1, A2, A3, A4
      for (let i = 1; i <= template.teamCount; i++) {
        teams.push(`A${i}`);
      }
    } else if (template.bracketStructure === 'dual') {
      // Dual bracket: A1-A4, B1-B4
      const teamsPerBracket = template.teamCount / 2;
      for (let i = 1; i <= teamsPerBracket; i++) {
        teams.push(`A${i}`);
      }
      for (let i = 1; i <= teamsPerBracket; i++) {
        teams.push(`B${i}`);
      }
    } else if (template.bracketStructure === 'crossover') {
      // Crossover: A1-A3, B1-B3
      const teamsPerPool = template.teamCount / 2;
      for (let i = 1; i <= teamsPerPool; i++) {
        teams.push(`A${i}`);
      }
      for (let i = 1; i <= teamsPerPool; i++) {
        teams.push(`B${i}`);
      }
    }
    
    return teams;
  };

  // Convert matchup patterns to preview games
  const generatePreviewGames = (): PreviewGame[] => {
    const games: PreviewGame[] = [];
    
    template.matchupPattern.forEach((matchup, index) => {
      const [home, away] = matchup;
      
      // Determine game type and round based on position and playoff flag
      let gameType: 'pool_play' | 'knockout' | 'final' | 'third_place' = 'pool_play';
      let round = 1;
      let isPlayoff = false;
      
      // Check if this is near the end and could be playoff
      const isLastGame = index === template.matchupPattern.length - 1;
      const isSecondToLastGame = index === template.matchupPattern.length - 2;
      
      if (template.hasPlayoffGame && isLastGame) {
        gameType = 'final';
        round = Math.ceil(template.matchupPattern.length / (template.teamCount / 2));
        isPlayoff = true;
      } else if (template.hasPlayoffGame && isSecondToLastGame && template.matchupPattern.length > template.teamCount) {
        gameType = 'third_place';
        round = Math.ceil(template.matchupPattern.length / (template.teamCount / 2));
        isPlayoff = true;
      } else if (home.includes('Winner') || away.includes('Winner') || home.includes('Pool') || away.includes('Pool')) {
        gameType = 'knockout';
        round = 2;
        isPlayoff = true;
      }
      
      games.push({
        gameNumber: index + 1,
        round,
        homeTeam: home,
        awayTeam: away,
        gameType,
        isPlayoff
      });
    });
    
    return games;
  };

  const sampleTeams = generateSampleTeams();
  const previewGames = generatePreviewGames();
  
  // Group games by round for better visualization
  const gamesByRound = previewGames.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {} as Record<number, PreviewGame[]>);

  const getBracketTypeIcon = (structure: string) => {
    switch (structure) {
      case 'single': return <Trophy className="h-4 w-4" />;
      case 'dual': return <Users className="h-4 w-4" />;
      case 'crossover': return <ArrowRight className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getBracketDescription = (structure: string) => {
    switch (structure) {
      case 'single': return 'All teams in one bracket';
      case 'dual': return 'Two separate pools with championship between winners';
      case 'crossover': return 'Pool A vs Pool B matchups throughout tournament';
      case 'round_robin': return 'Everyone plays everyone format';
      case 'swiss': return 'Performance-based pairing system';
      default: return 'Tournament bracket format';
    }
  };

  const getGameTypeColor = (gameType: string, isPlayoff: boolean) => {
    if (isPlayoff) {
      return gameType === 'final' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds && template.hasPlayoffGame) return 'Final Round';
    if (round === totalRounds - 1 && template.hasPlayoffGame) return 'Semifinals';
    return `Round ${round}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[75px]">
          <Eye className="h-3 w-3 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {getBracketTypeIcon(template.bracketStructure)}
            {template.name} - Tournament Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Template Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Template Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-2xl text-blue-600">{template.teamCount}</div>
                  <div className="text-muted-foreground">Teams</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-green-600">{template.totalGames}</div>
                  <div className="text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-purple-600">
                    {Object.keys(gamesByRound).length}
                  </div>
                  <div className="text-muted-foreground">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-orange-600">
                    {template.hasPlayoffGame ? 'Yes' : 'No'}
                  </div>
                  <div className="text-muted-foreground">Playoff</div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Badge variant="secondary" className="mr-2">
                  {template.bracketStructure.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getBracketDescription(template.bracketStructure)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {template.description}
              </div>
            </CardContent>
          </Card>

          {/* Sample Teams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sample Team Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sampleTeams.map((team, index) => (
                  <Badge key={index} variant="outline" className="font-mono">
                    {team}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                * Actual teams will replace these placeholders during scheduling
              </div>
            </CardContent>
          </Card>

          {/* Tournament Bracket Visualization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tournament Bracket Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(gamesByRound).map(([roundNum, roundGames]) => (
                <div key={roundNum} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold">
                      {getRoundName(parseInt(roundNum), Object.keys(gamesByRound).length)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {roundGames.length} game{roundGames.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {roundGames.map((game) => (
                      <div
                        key={game.gameNumber}
                        className="border rounded-lg p-3 bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Game {game.gameNumber}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={getGameTypeColor(game.gameType, game.isPlayoff)}
                          >
                            {game.gameType === 'pool_play' ? 'Pool Play' : 
                             game.gameType === 'third_place' ? 'Third Place' :
                             game.gameType.charAt(0).toUpperCase() + game.gameType.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-mono font-medium">{game.homeTeam}</span>
                          <span className="text-muted-foreground mx-2">vs</span>
                          <span className="font-mono font-medium">{game.awayTeam}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Integration Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Integration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-medium text-green-800">Template Ready for AI Scheduling</div>
                  <div className="text-sm text-green-600">
                    This template is fully integrated with our AI scheduling system
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Active
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• AI can automatically select this template for {template.teamCount}-team {template.bracketStructure} tournaments</div>
                <div>• Template will generate {template.totalGames} games with proper matchup patterns</div>
                <div>• All scheduling constraints and rest periods will be enforced</div>
                {template.hasPlayoffGame && (
                  <div>• Championship/playoff games will be scheduled with appropriate timing</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}