import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ClipboardList, Calendar, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  eventId: string;
  eventName: string;
  ageGroup: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'pending_payment' | 'registered';
  createdAt: string;
  startDate: string;
  role: 'coach' | 'manager';
}

function getStatusBadgeColor(status: Team['status']) {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'waitlisted':
      return 'bg-amber-500';
    case 'pending_payment':
      return 'bg-blue-500';
    case 'registered':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500'; // For 'pending' and any other status
  }
}

function getStatusLabel(status: Team['status']) {
  switch (status) {
    case 'pending_payment':
      return 'Pending Payment';
    case 'registered':
      return 'Registration Submitted';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function MyTeams() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };
    
    checkAuth();
  }, []);
  
  // Fetch teams using react-query
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams/my-teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    },
    // Only fetch if the user is authenticated
    enabled: isAuthenticated,
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000
  });
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>
            You need to log in to see your teams.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>Loading your teams...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription className="text-red-500">
            There was an error loading your teams. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // If no teams found
  if (!teams || teams.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>
            You currently have no teams. When you are added as a coach or manager to a team, it will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>My Teams</CardTitle>
        <CardDescription>
          Teams where you are listed as coach or manager
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teams?.map((team: Team) => (
            <div key={team.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">{team.eventName}</p>
                </div>
                <Badge className={`${getStatusBadgeColor(team.status)}`}>
                  {getStatusLabel(team.status)}
                </Badge>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex flex-col sm:flex-row gap-4 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{team.ageGroup}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Event Start: {format(new Date(team.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>Role: {team.role === 'coach' ? 'Coach' : 'Manager'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}