import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Download, FileText, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: number;
  teamName: string;
  status: string;
  headCoach: string;
  managerName: string;
}

interface GameCardManagerProps {
  eventId: string;
}

export function GameCardManager({ eventId }: GameCardManagerProps) {
  const [downloadingTeam, setDownloadingTeam] = useState<number | null>(null);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  // Fetch teams for this event
  const {
    data: teams = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["event-teams", eventId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/events/${eventId}/teams`);
      return data.filter((team: Team) => team.status === 'approved');
    },
    enabled: !!eventId,
  });

  const downloadGameCard = async (teamId: number, teamName: string) => {
    try {
      setDownloadingTeam(teamId);
      
      const response = await axios.get(
        `/api/admin/events/${eventId}/teams/${teamId}/game-card`,
        { responseType: 'blob' }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `game-card-${teamName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Game card downloaded for ${teamName}`);
    } catch (error) {
      console.error('Error downloading game card:', error);
      toast.error(`Failed to download game card for ${teamName}`);
    } finally {
      setDownloadingTeam(null);
    }
  };

  const previewGameCard = async (teamId: number, teamName: string) => {
    try {
      const response = await axios.get(
        `/api/admin/events/${eventId}/teams/${teamId}/game-card/preview`,
        { responseType: 'blob' }
      );

      // Open PDF in new window/tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error previewing game card:', error);
      toast.error(`Failed to preview game card for ${teamName}`);
    }
  };

  const downloadBulkGameCards = async () => {
    try {
      setDownloadingBulk(true);
      
      const response = await axios.get(`/api/admin/events/${eventId}/game-cards/bulk`);
      
      if (response.data.success) {
        // Download each card individually (since we can't zip them easily in the browser)
        for (const cardData of response.data.gameCards) {
          if (cardData.pdfBuffer && !cardData.error) {
            const blob = new Blob([
              new Uint8Array(Buffer.from(cardData.pdfBuffer, 'base64'))
            ], { type: 'application/pdf' });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `game-card-${cardData.teamName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Small delay between downloads to avoid browser blocking
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        toast.success(`Downloaded ${response.data.gameCards.length} game cards`);
      }
    } catch (error) {
      console.error('Error downloading bulk game cards:', error);
      toast.error('Failed to download bulk game cards');
    } finally {
      setDownloadingBulk(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading teams...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
            <p className="text-destructive">Error loading teams</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : 'Failed to load teams. Please try again.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No approved teams found</p>
            <p className="text-muted-foreground text-sm">
              Game cards can only be generated for approved teams with complete registration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Game Card Management</h2>
          <p className="text-muted-foreground">
            Generate and download game cards for referees. Cards include team rosters, schedules, and score tracking.
          </p>
        </div>
        <Button 
          onClick={downloadBulkGameCards}
          disabled={downloadingBulk}
          size="lg"
        >
          {downloadingBulk ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download All Cards
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Game Cards ({teams.length} teams)
          </CardTitle>
          <CardDescription>
            Individual game cards for each approved team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Head Coach</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team: Team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.teamName}</TableCell>
                  <TableCell>{team.headCoach || 'TBD'}</TableCell>
                  <TableCell>{team.managerName || 'TBD'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {team.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewGameCard(team.id, team.teamName)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadGameCard(team.id, team.teamName)}
                        disabled={downloadingTeam === team.id}
                      >
                        {downloadingTeam === team.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}