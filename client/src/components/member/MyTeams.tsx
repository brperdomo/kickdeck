import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { ClipboardList, Calendar, Users, Filter, ChevronDown, UserCheck, Shield } from 'lucide-react';

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
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  
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

  // Group teams by event and create filtering options
  const { groupedTeams, eventOptions, filteredTeams } = useMemo(() => {
    if (!teams) return { groupedTeams: {}, eventOptions: [], filteredTeams: [] };
    
    const grouped = teams.reduce((acc: Record<string, Team[]>, team: Team) => {
      const eventKey = `${team.eventName}_${team.eventId}`;
      if (!acc[eventKey]) {
        acc[eventKey] = [];
      }
      acc[eventKey].push(team);
      return acc;
    }, {});

    const events = Object.keys(grouped).map(eventKey => {
      const [eventName, eventId] = eventKey.split('_');
      return { name: eventName, id: eventId, key: eventKey };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const filtered = selectedEvent === 'all' 
      ? teams 
      : grouped[selectedEvent] || [];

    return {
      groupedTeams: grouped,
      eventOptions: events,
      filteredTeams: filtered
    };
  }, [teams, selectedEvent]);
  
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">My Teams</h2>
        <p className="text-muted-foreground">Teams where you are listed as coach or manager</p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events ({teams.length})</SelectItem>
                {eventOptions.map((event) => (
                  <SelectItem key={event.key} value={event.key}>
                    {event.name} ({groupedTeams[event.key]?.length || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredTeams.length} of {teams.length} teams
        </div>
      </div>

      {/* Teams Display */}
      {viewMode === 'grouped' && selectedEvent === 'all' ? (
        <div className="space-y-8">
          {eventOptions.map((event) => (
            <div key={event.key} className="space-y-4">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <Badge variant="secondary">{groupedTeams[event.key]?.length || 0} teams</Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 mt-4">
                    {(groupedTeams[event.key] || []).map((team: Team) => (
                      <TeamCard key={team.id} team={team} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filteredTeams.map((team: Team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

// Extracted Team Card component for reusability
function TeamCard({ team }: { team: Team }) {
  return (
    <Card className="team-card w-full h-full overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-2 team-card-header">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {team.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {team.eventName} | {team.ageGroup}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={`${getStatusBadgeColor(team.status)}`}>
              {getStatusLabel(team.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
            <span className="text-muted-foreground">Age Group:</span>
            <span className="font-medium">{team.ageGroup}</span>
          </div>
          
          <div className="flex justify-between items-center px-2 py-1">
            <span className="text-muted-foreground">Event Start:</span>
            <span>{format(new Date(team.startDate), 'MMM d, yyyy')}</span>
          </div>
          
          <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
            <span className="text-muted-foreground">My Role:</span>
            <span className="font-medium flex items-center gap-1">
              {team.role === 'coach' ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  Coach
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  Manager
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex flex-col w-full gap-2">
          <div className="text-xs text-muted-foreground">
            Created: {format(new Date(team.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}