import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CalendarDays,
  Users,
  Trophy,
  CalendarClock,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Team {
  id: number;
  name: string;
  eventId: string;
  eventName: string;
  ageGroup: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  createdAt: string;
  startDate: string;
  role: 'coach' | 'manager';
}

export function MyTeams() {
  const { user } = useAuth();
  const [noTeamsFound, setNoTeamsFound] = useState(false);

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['/api/teams/my-teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams/my-teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    },
    enabled: !!user,
    onSuccess: (data) => {
      setNoTeamsFound(data.length === 0);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'waitlisted':
        return <Badge variant="secondary" className="bg-amber-500 text-white">Waitlisted</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'waitlisted':
        return <CalendarClock className="h-4 w-4 text-amber-500" />;
      default:
        return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  return (
    <Card className="member-card">
      <CardHeader className="member-card-header">
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5" /> My Teams
        </CardTitle>
        <CardDescription>
          Teams you are coaching or managing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>Failed to load teams. Please try again later.</p>
          </div>
        ) : noTeamsFound ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-8 w-8 mb-2" />
            <p>You don't have any teams yet.</p>
            <p className="text-sm mt-2">
              When you're added as a coach or manager to a team, it will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team: Team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.eventName}</TableCell>
                  <TableCell>{team.ageGroup}</TableCell>
                  <TableCell className="capitalize">{team.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(team.status)}
                      {getStatusBadge(team.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}