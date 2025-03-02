
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ScoresPage() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const { data: scores, isLoading: isLoadingScores } = useQuery({
    queryKey: ["scores"],
    queryFn: async () => {
      const response = await fetch("/api/scores");
      if (!response.ok) throw new Error("Failed to fetch scores");
      return response.json();
    },
  });

  const exportScores = () => {
    // Logic to export scores as CSV
    if (!scores) return;
    
    const headers = ["Team", "Wins", "Losses", "Ties", "Points", "Rank"];
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      scores.map(score => 
        [
          score.team, 
          score.wins, 
          score.losses, 
          score.ties, 
          score.points, 
          score.rank
        ].join(",")
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tournament_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingEvents || isLoadingScores) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scores & Standings</h1>
        <Button onClick={exportScores}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="matches">Match Results</TabsTrigger>
          <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">T</TableHead>
                    <TableHead className="text-center">GF</TableHead>
                    <TableHead className="text-center">GA</TableHead>
                    <TableHead className="text-center">GD</TableHead>
                    <TableHead className="text-center">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores && scores.length > 0 ? (
                    scores.map((team, index) => (
                      <TableRow key={team.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="text-center">{team.wins}</TableCell>
                        <TableCell className="text-center">{team.losses}</TableCell>
                        <TableCell className="text-center">{team.ties}</TableCell>
                        <TableCell className="text-center">{team.goalsFor}</TableCell>
                        <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                        <TableCell className="text-center">{team.goalDifference}</TableCell>
                        <TableCell className="text-center font-bold">{team.points}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No scores available yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Home Team</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Away Team</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No matches available yet
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Tournament Scoring Rules</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Points System:</h4>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Win: 3 points</li>
                    <li>Tie: 1 point</li>
                    <li>Loss: 0 points</li>
                    <li>Goal Capped Win: 4 points</li>
                    <li>Shutout: 1 bonus point</li>
                    <li>Red Card: -1 point</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Tiebreakers:</h4>
                  <ol className="list-decimal pl-5 mt-2">
                    <li>Head-to-head results</li>
                    <li>Goal differential</li>
                    <li>Goals scored</li>
                    <li>Fewest goals allowed</li>
                    <li>Fewest disciplinary points</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
