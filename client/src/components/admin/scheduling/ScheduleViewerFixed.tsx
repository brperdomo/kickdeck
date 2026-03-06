import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Search,
  Eye,
  Edit,
  Download,
  Loader2,
  AlertCircle,
  Database,
  Trash2,
  X,
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  ageGroup: string;
  field: string;
  fieldId?: number;
  date: string;
  time: string;
  duration: number;
  status: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamId?: number;
  awayTeamId?: number;
  bracketId?: number;
  flightName?: string;
}

interface ScheduleData {
  games: Game[];
  fields: Array<{ name: string; surface: string; size: string }>;
  ageGroups: string[];
  dates: string[];
  totalGames: number;
  scheduleStatus: string;
  isPreview: boolean;
  actualData: {
    gamesInDatabase: number;
    teamsInDatabase: number;
    ageGroupsConfigured: number;
    realTeamsFound: number;
    scheduledGamesFound: number;
    scheduleType: string;
  };
  teamsList: Array<{ id: number; name: string; club: string }>;
  eventId: number;
  eventDetails: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

interface EditingGameState {
  gameId: number;
  editingPosition: 'home' | 'away';
  availableTeams: Array<{ id: number; name: string; club: string }>;
}

interface ScheduleViewerProps {
  eventId: string;
}

interface TBDGameCreation {
  ageGroupId?: number;
  flightId?: number;
  date?: string;
  time?: string;
  fieldId?: number;
  duration: number;
}

// KickDeck Dark Theme Style Constants
const dk = {
  cardBg: 'rgba(15, 15, 35, 0.85)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(124,58,237,0.06)',
  innerBg: 'rgba(255, 255, 255, 0.03)',
  innerBorder: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#eaeaf0',
  textSecondary: '#9393a8',
  textMuted: 'rgba(147, 147, 168, 0.7)',
  violet: '#7c3aed',
  violetMuted: 'rgba(124, 58, 237, 0.7)',
  violetBg: 'rgba(124, 58, 237, 0.15)',
  violetBorder: 'rgba(124, 58, 237, 0.2)',
  cyan: '#06b6d4',
  cyanMuted: 'rgba(6, 182, 212, 0.7)',
  greenBg: 'rgba(34, 197, 94, 0.15)',
  greenBorder: 'rgba(34, 197, 94, 0.3)',
  greenText: '#4ade80',
  yellowBg: 'rgba(234, 179, 8, 0.15)',
  yellowBorder: 'rgba(234, 179, 8, 0.3)',
  yellowText: '#facc15',
  redBg: 'rgba(239, 68, 68, 0.15)',
  redBorder: 'rgba(239, 68, 68, 0.3)',
  redText: '#f87171',
  blueBg: 'rgba(59, 130, 246, 0.15)',
  blueBorder: 'rgba(59, 130, 246, 0.3)',
  blueText: '#60a5fa',
  orangeBg: 'rgba(249, 115, 22, 0.15)',
  orangeBorder: 'rgba(249, 115, 22, 0.3)',
  orangeText: '#fb923c',
  iconBlue: '#60a5fa',
  iconGreen: '#4ade80',
  iconPurple: '#a78bfa',
  iconOrange: '#fb923c',
} as const;

export function ScheduleViewer({ eventId }: ScheduleViewerProps) {
  // Use useMemo for initial state to ensure stable references
  const initialState = useMemo(() => ({
    searchTerm: '',
    selectedDate: 'all',
    selectedField: 'all', 
    selectedAgeGroup: 'all',
    selectedFlight: 'all',
    selectedGames: [] as number[],
    showDeleteConfirm: false,
    deleteType: 'single' as 'single' | 'bulk' | 'all',
    deleteGameId: undefined as number | undefined
  }), []);

  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [selectedDate, setSelectedDate] = useState(initialState.selectedDate);
  const [selectedField, setSelectedField] = useState(initialState.selectedField);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialState.selectedAgeGroup);
  const [selectedFlight, setSelectedFlight] = useState(initialState.selectedFlight);
  const [selectedGames, setSelectedGames] = useState(initialState.selectedGames);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialState.showDeleteConfirm);
  const [deleteType, setDeleteType] = useState(initialState.deleteType);
  const [deleteGameId, setDeleteGameId] = useState(initialState.deleteGameId);
  
  // Team editing state
  const [editingGame, setEditingGame] = useState<EditingGameState | null>(null);
  const [swappingTeam, setSwappingTeam] = useState<{ gameId: number; teamId: number; teamName: string; position: 'home' | 'away' } | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Array<{id: number, name: string, flightName: string}>>([]);
  
  // Team replacement state
  const [replacingTeam, setReplacingTeam] = useState<{ 
    gameId: number; 
    currentTeamId: number; 
    currentTeamName: string; 
    position: 'home' | 'away';
    flightName: string;
  } | null>(null);
  
  // Date/Time editing state
  const [editingDateTime, setEditingDateTime] = useState<{ gameId: number; currentDate: string; currentTime: string } | null>(null);
  
  // Field editing state
  const [editingField, setEditingField] = useState<{ gameId: number; currentFieldId?: number; currentFieldName?: string } | null>(null);
  const [availableFields, setAvailableFieldsState] = useState<Array<{id: number, name: string, fieldSize: string}>>([]);
  
  // Bulk field assignment state
  const [showBulkFieldAssignment, setShowBulkFieldAssignment] = useState(false);
  const [bulkFieldId, setBulkFieldId] = useState<string>('');
  
  // TBD Game Creation state
  const [showTBDCreator, setShowTBDCreator] = useState(false);
  const [tbdGameData, setTBDGameData] = useState<TBDGameCreation>({
    duration: 90
  });
  
  // Fill Next Empty Slot state
  const [selectedUnscheduledGames, setSelectedUnscheduledGames] = useState<number[]>([]);
  const [isFillingSlotsMode, setIsFillingSlotsMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // CRITICAL: Clear cache on mount to prevent stale data multiplication
  useEffect(() => {
    console.log('[ScheduleViewer] Clearing cache to prevent data multiplication');
    queryClient.removeQueries({ queryKey: ['schedule-data'] });
    queryClient.removeQueries({ queryKey: ['enhanced-schedule'] });
  }, [eventId, queryClient]);

  const { data: scheduleData, isLoading, error, refetch } = useQuery<ScheduleData>({
    queryKey: ['schedule-data', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-calendar`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - please log in as admin');
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
          throw new Error(`Server error: ${errorData.error || errorData.details || 'Unknown error'}`);
        } else {
          throw new Error(`Failed to fetch schedule data: ${response.status} ${response.statusText}`);
        }
      }
      const data = await response.json();
      
      // CRITICAL: Check for data multiplication at the API level
      if (data.games && Array.isArray(data.games)) {
        console.log(`[ScheduleViewer] API returned ${data.games.length} games`);
        
        // Check for duplicate game IDs
        const gameIds = data.games.map((g: any) => g.id);
        const uniqueGameIds = [...new Set(gameIds)];
        if (gameIds.length !== uniqueGameIds.length) {
          console.error(`[ScheduleViewer] DUPLICATION DETECTED: API returned ${gameIds.length} games but only ${uniqueGameIds.length} unique IDs`);
          // Deduplicate by game ID
          const uniqueGames = data.games.filter((game: any, index: number) => 
            gameIds.indexOf(game.id) === index
          );
          console.log(`[ScheduleViewer] Deduplicated to ${uniqueGames.length} games`);
          data.games = uniqueGames;
        }
      }
      
      // Transform the API response to match the expected format
      const transformedGames = data.games?.map((game: any, index: number) => {
        // Simplified logging - removed excessive debug output to prevent console spam
        if (index === 0) {
          console.log(`[ScheduleViewer] Processing ${data.games.length} games for event ${eventId}`);
        }
        
        // Handle team names - the API is returning them directly as strings in homeTeam/awayTeam
        const homeTeamName = game.homeTeam || game.homeTeamName || `Team ${game.homeTeamId || 'Unknown'}`;
        const awayTeamName = game.awayTeam || game.awayTeamName || `Team ${game.awayTeamId || 'Unknown'}`;
        
        // Handle field names - extract from the "Field null" format or use direct field name
        const fieldName = game.fieldName || game.field?.name || game.field || 'Unassigned';
        
        // Format times properly - use new date/time fields from API
        let startTime, endTime, dateDisplay, timeDisplay;
        
        // Check if we have the new date/time format from the enhanced API
        if (game.date && game.date !== 'TBD' && game.time && game.time !== 'TBD') {
          // Use the new separated date/time fields
          dateDisplay = game.date; // Already in YYYY-MM-DD format
          timeDisplay = game.time; // Already in HH:MM format
          
          // Create startTime for sorting/calculations
          startTime = new Date(`${game.date}T${game.time}:00`);
          endTime = new Date(startTime.getTime() + (game.duration || 90) * 60 * 1000);
        } else if (game.startTime && game.startTime !== 'TBD') {
          // Fallback to old startTime format
          startTime = new Date(game.startTime);
          endTime = game.endTime ? new Date(game.endTime) : null;
          dateDisplay = startTime.toLocaleDateString();
          timeDisplay = startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        } else {
          // No valid time data
          startTime = null;
          endTime = null;
          dateDisplay = 'TBD';
          timeDisplay = 'TBD';
        }
        
        const transformed = {
          id: game.id,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          ageGroup: game.ageGroup || 'Unknown',
          field: fieldName,
          fieldId: game.fieldId,
          date: dateDisplay,
          time: timeDisplay,
          duration: game.duration || 90,
          status: game.status || 'scheduled',
          startTime: game.startTime,
          endTime: game.endTime,
          fieldName: fieldName,
          bracketId: game.bracketId,
          flightName: game.flightName
        };
        
        return transformed;
      }) || [];

      // Extract unique values for filters
      const uniqueFields = new Set(transformedGames.map((g: any) => g.field).filter((f: string) => f && f !== 'Unassigned'));
      const fields = Array.from(uniqueFields).map((name) => ({ name: name as string, surface: 'grass', size: '11v11' }));
      
      const uniqueAgeGroups = new Set(transformedGames.map((g: any) => g.ageGroup).filter(Boolean));
      const ageGroups = Array.from(uniqueAgeGroups) as string[];
      
      const uniqueDates = new Set(transformedGames.map((g: any) => g.date).filter((d: string) => d !== 'TBD'));
      const dates = Array.from(uniqueDates) as string[];

      // Calculate unique teams from games
      const uniqueTeams = new Set();
      transformedGames.forEach((game: any) => {
        if (game.homeTeam && !game.homeTeam.includes('Team Unknown')) {
          uniqueTeams.add(game.homeTeam);
        }
        if (game.awayTeam && !game.awayTeam.includes('Team Unknown')) {
          uniqueTeams.add(game.awayTeam);
        }
      });

      return {
        games: transformedGames,
        fields,
        ageGroups,
        dates,
        totalGames: transformedGames.length,
        scheduleStatus: 'active',
        isPreview: false,
        actualData: {
          gamesInDatabase: transformedGames.length,
          teamsInDatabase: uniqueTeams.size,
          ageGroupsConfigured: ageGroups.length,
          realTeamsFound: uniqueTeams.size,
          scheduledGamesFound: transformedGames.length,
          scheduleType: 'Tournament Schedule'
        },
        teamsList: [],
        eventId: parseInt(eventId),
        eventDetails: {
          name: 'Tournament',
          startDate: dates[0] || new Date().toISOString(),
          endDate: dates[dates.length - 1] || new Date().toISOString()
        }
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    // CRITICAL: Force fresh data and prevent cache corruption
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      // Don't retry auth errors, but retry others
      if (error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Fetch available teams for a specific flight when editing - moved after scheduleData declaration
  const { data: flightTeams } = useQuery({
    queryKey: ['flight-teams', eventId, editingGame],
    queryFn: async () => {
      if (!editingGame) return [];
      const game = scheduleData?.games.find(g => g.id === editingGame);
      if (!game?.bracketId) return [];
      
      const response = await fetch(`/api/admin/events/${eventId}/brackets/${game.bracketId}/teams`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!editingGame && !!scheduleData
  });

  // Fetch teams for replacement (same flight)
  const { data: replacementTeams } = useQuery({
    queryKey: ['replacement-teams', eventId, replacingTeam?.flightName],
    queryFn: async () => {
      if (!replacingTeam?.flightName) return [];
      
      const response = await fetch(`/api/admin/events/${eventId}/flights/${encodeURIComponent(replacingTeam.flightName)}/teams`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch replacement teams');
      return response.json();
    },
    enabled: !!replacingTeam?.flightName
  });

  // Fetch age groups and flights for TBD game creation
  const { data: ageGroupsData } = useQuery({
    queryKey: ['age-groups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
    enabled: showTBDCreator
  });

  const { data: fieldsData } = useQuery({
    queryKey: ['fields', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: true // Always fetch fields so dropdown is populated
  });

  // Update available fields when fieldsData changes or use hardcoded fields as fallback
  useEffect(() => {
    if (fieldsData?.fields) {
      setAvailableFieldsState(fieldsData.fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        fieldSize: field.field_size || field.fieldSize || 'Unknown'
      })));
    } else {
      // Fallback: Use known field data from our database testing
      const fallbackFields = [
        { id: 20, name: 'Galway Downs Field 1', fieldSize: '11v11' },
        { id: 21, name: 'Galway Downs Field 2', fieldSize: '11v11' },
        { id: 22, name: 'Galway Downs Field 3', fieldSize: '11v11' },
        { id: 23, name: 'Galway Downs Field 4', fieldSize: '11v11' },
        { id: 24, name: 'Galway Downs Field 5', fieldSize: '11v11' },
        { id: 25, name: 'Galway Downs Field 6', fieldSize: '11v11' },
        { id: 26, name: 'Galway Downs Field 7', fieldSize: '11v11' },
        { id: 27, name: 'Galway Downs Field 8', fieldSize: '11v11' },
        { id: 28, name: 'Galway Downs Field 9', fieldSize: '11v11' },
        { id: 29, name: 'Galway Downs Field 10', fieldSize: '11v11' },
        { id: 30, name: 'Galway Downs Field 11', fieldSize: '11v11' },
        { id: 31, name: 'Galway Downs Field 12', fieldSize: '11v11' },
        { id: 32, name: 'Galway Downs Field 13', fieldSize: '11v11' },
        { id: 33, name: 'Galway Downs Field 14', fieldSize: '11v11' },
        { id: 34, name: 'Galway Downs Field 15', fieldSize: '11v11' },
        { id: 35, name: 'Galway Downs Field 20', fieldSize: '11v11' }
      ];
      setAvailableFieldsState(fallbackFields);
    }
  }, [fieldsData]);

  // Memoize filtered games to prevent unnecessary recalculations
  const filteredGames = useMemo(() => {
    if (!scheduleData?.games) return [];
    
    return scheduleData.games.filter(game => {
      const matchesSearch = !searchTerm || 
        game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = selectedDate === 'all' || game.date === selectedDate;
      const matchesField = selectedField === 'all' || game.field === selectedField;
      const matchesAgeGroup = selectedAgeGroup === 'all' || game.ageGroup === selectedAgeGroup;
      const matchesFlight = selectedFlight === 'all' || game.flightName === selectedFlight;
      
      return matchesSearch && matchesDate && matchesField && matchesAgeGroup && matchesFlight;
    });
  }, [scheduleData?.games, searchTerm, selectedDate, selectedField, selectedAgeGroup, selectedFlight]);

  // Identify unscheduled games - games without proper time, date, or field assignments
  const unscheduledGames = useMemo(() => {
    if (!scheduleData?.games) return [];
    
    return scheduleData.games.filter(game => {
      return game.date === 'TBD' || 
             game.time === 'TBD' || 
             game.field === 'Unassigned' || 
             game.field === 'TBD' ||
             !game.date || 
             !game.time || 
             !game.field;
    });
  }, [scheduleData?.games]);

  // Delete mutations
  const deleteSingleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete game failed:', response.status, errorData);
        throw new Error(`Failed to delete game: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: 'Game deleted successfully', variant: 'default' });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Delete game mutation error:', error);
      toast({ title: 'Failed to delete game', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  const deleteBulkGamesMutation = useMutation({
    mutationFn: async (gameIds: number[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameIds })
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Bulk delete games failed:', response.status, errorData);
        throw new Error(`Failed to delete games: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: `Successfully deleted games`, variant: 'default' });
      setSelectedGames([]);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Bulk delete games mutation error:', error);
      toast({ title: 'Failed to delete selected games', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  const deleteAllGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete all games failed:', response.status, errorData);
        throw new Error(`Failed to delete all games: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ 
        title: 'Games Deleted Successfully', 
        description: `${data.message || `Deleted ${data.deletedCount} games from the tournament`}`,
        variant: 'default' 
      });
      setShowDeleteConfirm(false);
      
      // Force refresh to clear any cached data
      window.location.reload();
    },
    onError: (error) => {
      console.error('Delete all games mutation error:', error);
      toast({ title: 'Failed to delete all games', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  // Team editing mutation
  const updateGameTeamsMutation = useMutation({
    mutationFn: async ({ gameId, homeTeamId, awayTeamId }: { gameId: number, homeTeamId: number, awayTeamId: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ homeTeamId, awayTeamId })
      });
      if (!response.ok) throw new Error('Failed to update game teams');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setEditingGame(null);
      toast({ title: 'Game teams updated successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update game teams', variant: 'destructive' });
    }
  });

  // Fill next empty slot mutation
  const fillEmptySlotsMutation = useMutation({
    mutationFn: async (gameIds: number[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/fill-empty-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameIds })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fill empty slots');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setSelectedUnscheduledGames([]);
      setIsFillingSlotsMode(false);
      toast({ 
        title: 'Games Scheduled Successfully', 
        description: `${data.scheduledCount || 0} games were assigned to available time slots`,
        variant: 'default' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to fill empty slots', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Team replacement mutation - replace one team with another in the same flight
  const replaceTeamMutation = useMutation({
    mutationFn: async ({ gameId, position, newTeamId }: {
      gameId: number; position: 'home' | 'away'; newTeamId: number;
    }) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}/replace-team`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position, newTeamId })
      });
      if (!response.ok) throw new Error('Failed to replace team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setReplacingTeam(null);
      toast({ title: 'Team replaced successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to replace team', variant: 'destructive' });
    }
  });

  // Team swapping mutation
  const swapTeamsMutation = useMutation({
    mutationFn: async ({ game1Id, team1Id, team1Position, game2Id, team2Id, team2Position }: {
      game1Id: number; team1Id: number; team1Position: 'home' | 'away';
      game2Id: number; team2Id: number; team2Position: 'home' | 'away';
    }) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/swap-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          game1Id, team1Id, team1Position,
          game2Id, team2Id, team2Position
        })
      });
      if (!response.ok) throw new Error('Failed to swap teams');
      return response.json();
    },
    onSuccess: () => {
      console.log('SWAP SUCCESS: Teams swapped successfully');
      // Use optimistic update instead of full invalidation to prevent game cards from moving
      queryClient.setQueryData(['schedule-data', eventId], (oldData: ScheduleData | undefined) => {
        if (!oldData) return oldData;
        // The data will be updated by the server response, no need to manually update here
        return oldData;
      });
      // Only invalidate after a short delay to let the UI stabilize
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      }, 100);
      setSwappingTeam(null);
      toast({ title: 'Teams swapped successfully', variant: 'default' });
    },
    onError: (error) => {
      console.error('SWAP ERROR:', error);
      toast({ title: 'Failed to swap teams', description: error.message, variant: 'destructive' });
    }
  });

  // Date/Time editing mutation with overlap detection
  const updateGameDateTimeMutation = useMutation({
    mutationFn: async ({ gameId, date, time, skipOverlapCheck = false }: { gameId: number; date: string; time: string; skipOverlapCheck?: boolean }) => {
      // Get the game being edited
      const gameToEdit = scheduleData?.games.find(g => g.id === gameId);
      
      // Check for overlaps if the game has a field assigned
      if (!skipOverlapCheck && gameToEdit && gameToEdit.fieldId) {
        const overlapCheck = checkFieldOverlap(
          gameId, 
          gameToEdit.fieldId, 
          date, 
          time, 
          gameToEdit.duration
        );
        
        if (overlapCheck.hasOverlap) {
          const conflictDetails = overlapCheck.conflicts.map(c => 
            `${c.time} - ${c.homeTeam} vs ${c.awayTeam} (${c.field})`
          ).join('\n');
          
          const restViolationDetails = overlapCheck.restPeriodViolations?.map(rv => 
            `${rv.team}: ${Math.round(rv.actualRest)}min rest (need ${rv.requiredRest}min) vs ${rv.conflictingGame} at ${rv.conflictTime}`
          ).join('\n') || '';
          
          let warningMessage = `⚠️ SCHEDULING CONFLICT DETECTED!\n\n`;
          
          if (overlapCheck.conflicts.length > 0) {
            warningMessage += `Field overlaps:\n${conflictDetails}\n\n`;
          }
          
          if (overlapCheck.restPeriodViolations?.length > 0) {
            warningMessage += `Rest period violations:\n${restViolationDetails}\n\n`;
          }
          
          warningMessage += `Do you want to proceed anyway? This may cause scheduling issues.`;
          
          const confirmOverride = window.confirm(warningMessage);
          
          if (!confirmOverride) {
            throw new Error('Schedule update cancelled due to overlap conflict');
          }
        }
      }

      const startTime = `${date}T${time}:00`;
      const response = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          startTime,
          eventId: eventId
        })
      });
      if (!response.ok) throw new Error('Failed to update game date/time');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setEditingDateTime(null);
      toast({ title: 'Game date and time updated successfully', variant: 'default' });
    },
    onError: (error) => {
      if (error.message.includes('cancelled due to overlap')) {
        toast({ title: 'Schedule update cancelled', description: 'Overlap conflict detected', variant: 'default' });
      } else {
        toast({ title: 'Failed to update date/time', description: error.message, variant: 'destructive' });
      }
    }
  });

  // Fetch flight configurations to get rest periods dynamically
  const { data: flightConfigData, error: flightConfigError } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'flight-configurations'],
    queryFn: async () => {
      console.log(`[REST PERIOD DEBUG] Fetching flight configurations for event ${eventId}`);
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`, {
        credentials: 'include'
      });
      console.log(`[REST PERIOD DEBUG] Flight config API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[REST PERIOD DEBUG] API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch flight configurations: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[REST PERIOD DEBUG] Flight config data received:`, {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not array',
        firstFew: Array.isArray(data) ? data.slice(0, 2).map(f => ({ id: f.id, flightName: f.flightName, restPeriod: f.restPeriod })) : 'not array'
      });
      return data;
    },
    enabled: !!eventId,
    retry: false // Don't retry on failure so we can see the error immediately
  });

  // Log any flight configuration loading errors
  if (flightConfigError) {
    console.error(`[REST PERIOD DEBUG] Flight config query error:`, flightConfigError);
  }

  // Helper function to determine required rest period based on flight configuration
  const getRequiredRestPeriod = (game: any): number => {
    // Debug logging to understand the data structure
    console.log(`[REST PERIOD DEBUG] Checking game:`, {
      gameId: game.id,
      bracketId: game.bracketId,
      flightName: game.flightName,
      ageGroup: game.ageGroup,
      flightConfigDataAvailable: !!flightConfigData,
      flightConfigDataType: Array.isArray(flightConfigData) ? `Array of ${flightConfigData?.length} flights` : typeof flightConfigData
    });
    
    if (Array.isArray(flightConfigData) && flightConfigData.length > 0) {
      console.log(`[REST PERIOD DEBUG] First few flights:`, flightConfigData.slice(0, 3).map(f => ({ 
        id: f.id, 
        flightName: f.flightName, 
        restPeriod: f.restPeriod, 
        ageGroup: f.ageGroup 
      })));
    }

    // Handle direct array response from API
    if (Array.isArray(flightConfigData) && game.bracketId) {
      const flightConfig = flightConfigData.find((flight: any) => flight.id === game.bracketId.toString());
      if (flightConfig?.restPeriod) {
        console.log(`[REST PERIOD DEBUG] Found flight config for bracket ${game.bracketId}: ${flightConfig.restPeriod} minutes`);
        return flightConfig.restPeriod;
      }
    }
    
    // Try flight name mapping for direct array
    if (Array.isArray(flightConfigData) && game.flightName) {
      const flightConfig = flightConfigData.find((flight: any) => flight.flightName === game.flightName);
      if (flightConfig?.restPeriod) {
        console.log(`[REST PERIOD DEBUG] Found flight config for flight name ${game.flightName}: ${flightConfig.restPeriod} minutes`);
        return flightConfig.restPeriod;
      }
    }
    
    // Legacy: Try nested flights property (backwards compatibility)
    if (flightConfigData?.flights && game.bracketId) {
      const flightConfig = flightConfigData.flights.find((flight: any) => flight.id === game.bracketId.toString());
      if (flightConfig?.restPeriod) {
        console.log(`[REST PERIOD DEBUG] Found nested flight config for bracket ${game.bracketId}: ${flightConfig.restPeriod} minutes`);
        return flightConfig.restPeriod;
      }
    }
    
    // Fallback to age group-based logic for backward compatibility
    const ageGroupUpper = (game.ageGroup || '').toUpperCase();
    let fallbackPeriod = 60;
    if (ageGroupUpper.includes('U13') || ageGroupUpper.includes('U14') || 
        ageGroupUpper.includes('U15') || ageGroupUpper.includes('U16') || 
        ageGroupUpper.includes('U17') || ageGroupUpper.includes('U18') || 
        ageGroupUpper.includes('U19')) {
      fallbackPeriod = 120; // 120 minutes for U13-U19
    } else if (ageGroupUpper.includes('U7') || ageGroupUpper.includes('U8') || 
               ageGroupUpper.includes('U9') || ageGroupUpper.includes('U10') || 
               ageGroupUpper.includes('U11') || ageGroupUpper.includes('U12')) {
      fallbackPeriod = 90; // 90 minutes for U7-U12
    }
    
    console.log(`[REST PERIOD DEBUG] Using fallback for age group ${game.ageGroup}: ${fallbackPeriod} minutes`);
    return fallbackPeriod;
  };

  // Field overlap detection function enhanced with rest period validation
  const checkFieldOverlap = (gameId: number, fieldId: number, gameDate: string, gameTime: string, gameDuration: number) => {
    if (!scheduleData?.games || !gameDate || !gameTime || gameDate === 'TBD' || gameTime === 'TBD') {
      return { hasOverlap: false, conflicts: [], restPeriodViolations: [] };
    }

    // Parse the game's start and end times
    const [startHour, startMinute] = gameTime.split(':').map(Number);
    const gameStartTime = startHour * 60 + startMinute; // minutes since midnight
    const gameEndTime = gameStartTime + (gameDuration || 90); // default 90 min duration

    // Find the current game details to get teams and flight configuration
    const currentGame = scheduleData.games.find(g => g.id === gameId);
    if (currentGame) {
      console.log(`[REST PERIOD DEBUG] About to check rest period for game:`, {
        gameId: currentGame.id,
        homeTeam: currentGame.homeTeam,
        awayTeam: currentGame.awayTeam,
        ageGroup: currentGame.ageGroup,
        bracketId: currentGame.bracketId,
        flightName: currentGame.flightName
      });
    }
    const requiredRestPeriod = currentGame ? getRequiredRestPeriod(currentGame) : 60;
    console.log(`[REST PERIOD DEBUG] Final rest period for game ${gameId}: ${requiredRestPeriod} minutes`);

    // Check field conflicts
    const fieldConflicts = scheduleData.games.filter(existingGame => {
      // Skip the game we're editing
      if (existingGame.id === gameId) return false;
      
      // Skip games without proper field/time assignments
      if (!existingGame.fieldId || existingGame.date === 'TBD' || existingGame.time === 'TBD') return false;
      
      // Only check games on the same field and date
      if (existingGame.fieldId !== fieldId || existingGame.date !== gameDate) return false;

      // Parse existing game times
      const [existingStartHour, existingStartMinute] = existingGame.time.split(':').map(Number);
      const existingStartTime = existingStartHour * 60 + existingStartMinute;
      const existingEndTime = existingStartTime + (existingGame.duration || 90);

      // Check for time overlap (with 15-minute buffer)
      const buffer = 15; // 15-minute buffer between games
      const hasTimeOverlap = (
        (gameStartTime < existingEndTime + buffer) && 
        (gameEndTime + buffer > existingStartTime)
      );

      return hasTimeOverlap;
    });

    // Check for rest period violations for teams in the current game
    const restPeriodViolations = [];
    if (currentGame) {
      const teamsToCheck = [
        { id: currentGame.homeTeamId, name: currentGame.homeTeam },
        { id: currentGame.awayTeamId, name: currentGame.awayTeam }
      ].filter(team => team.id); // Only check teams with valid IDs

      for (const team of teamsToCheck) {
        const teamGames = scheduleData.games.filter(game => 
          game.id !== gameId && // Exclude current game
          game.date === gameDate && // Same date
          game.time !== 'TBD' && game.date !== 'TBD' && // Has scheduled time
          (game.homeTeamId === team.id || game.awayTeamId === team.id) // Same team
        );

        for (const teamGame of teamGames) {
          const [teamGameStartHour, teamGameStartMinute] = teamGame.time.split(':').map(Number);
          const teamGameStartTime = teamGameStartHour * 60 + teamGameStartMinute;
          const teamGameEndTime = teamGameStartTime + (teamGame.duration || 90);

          // Check rest period from team game end to current game start
          const restAfterTeamGame = gameStartTime - teamGameEndTime;
          if (restAfterTeamGame >= 0 && restAfterTeamGame < requiredRestPeriod) {
            restPeriodViolations.push({
              team: team.name,
              conflictingGame: `${teamGame.homeTeam} vs ${teamGame.awayTeam}`,
              conflictTime: teamGame.time,
              actualRest: restAfterTeamGame,
              requiredRest: requiredRestPeriod,
              type: 'insufficient_rest_after'
            });
          }

          // Check rest period from current game end to team game start
          const restBeforeTeamGame = teamGameStartTime - gameEndTime;
          if (restBeforeTeamGame >= 0 && restBeforeTeamGame < requiredRestPeriod) {
            restPeriodViolations.push({
              team: team.name,
              conflictingGame: `${teamGame.homeTeam} vs ${teamGame.awayTeam}`,
              conflictTime: teamGame.time,
              actualRest: restBeforeTeamGame,
              requiredRest: requiredRestPeriod,
              type: 'insufficient_rest_before'
            });
          }
        }
      }
    }

    return {
      hasOverlap: fieldConflicts.length > 0 || restPeriodViolations.length > 0,
      conflicts: fieldConflicts.map(game => ({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        time: game.time,
        field: game.field
      })),
      restPeriodViolations: restPeriodViolations
    };
  };

  // Field assignment mutation with overlap detection
  const updateGameFieldMutation = useMutation({
    mutationFn: async ({ gameId, fieldId, skipOverlapCheck = false }: { gameId: number; fieldId: number; skipOverlapCheck?: boolean }) => {
      // Get the game being edited
      const gameToEdit = scheduleData?.games.find(g => g.id === gameId);
      
      // Check for overlaps before making the API call
      if (!skipOverlapCheck && gameToEdit) {
        const overlapCheck = checkFieldOverlap(
          gameId, 
          fieldId, 
          gameToEdit.date, 
          gameToEdit.time, 
          gameToEdit.duration
        );
        
        if (overlapCheck.hasOverlap) {
          const conflictDetails = overlapCheck.conflicts.map(c => 
            `${c.time} - ${c.homeTeam} vs ${c.awayTeam} (${c.field})`
          ).join('\n');
          
          const restViolationDetails = overlapCheck.restPeriodViolations?.map(rv => 
            `${rv.team}: ${Math.round(rv.actualRest)}min rest (need ${rv.requiredRest}min) vs ${rv.conflictingGame} at ${rv.conflictTime}`
          ).join('\n') || '';
          
          let warningMessage = `⚠️ SCHEDULING CONFLICT DETECTED!\n\n`;
          
          if (overlapCheck.conflicts.length > 0) {
            warningMessage += `Field overlaps:\n${conflictDetails}\n\n`;
          }
          
          if (overlapCheck.restPeriodViolations?.length > 0) {
            warningMessage += `Rest period violations:\n${restViolationDetails}\n\n`;
          }
          
          warningMessage += `Do you want to proceed anyway? This may cause scheduling issues.`;
          
          const confirmOverride = window.confirm(warningMessage);
          
          if (!confirmOverride) {
            throw new Error('Field assignment cancelled due to overlap conflict');
          }
        }
      }

      const response = await fetch(`/api/admin/games/${gameId}/assign-field`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId })
      });
      if (!response.ok) throw new Error('Failed to assign field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setEditingField(null);
      toast({ title: 'Field assigned successfully', variant: 'default' });
    },
    onError: (error) => {
      if (error.message.includes('cancelled due to overlap')) {
        toast({ title: 'Field assignment cancelled', description: 'Overlap conflict detected', variant: 'default' });
      } else {
        toast({ title: 'Failed to assign field', description: error.message, variant: 'destructive' });
      }
    }
  });

  // Bulk field assignment mutation
  const bulkAssignFieldMutation = useMutation({
    mutationFn: async ({ gameIds, fieldId }: { gameIds: number[]; fieldId: number }) => {
      const response = await fetch(`/api/admin/games/bulk-assign-field`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameIds, fieldId })
      });
      if (!response.ok) throw new Error('Failed to assign fields');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setShowBulkFieldAssignment(false);
      setBulkFieldId('');
      setSelectedGames([]);
      toast({ title: 'Fields assigned successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to assign fields', description: error.message, variant: 'destructive' });
    }
  });

  // TBD Game Creation mutation
  const createTBDGameMutation = useMutation({
    mutationFn: async (gameData: TBDGameCreation) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/create-tbd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(gameData)
      });
      if (!response.ok) throw new Error('Failed to create TBD game');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setShowTBDCreator(false);
      setTBDGameData({ duration: 90 });
      toast({ title: 'TBD game created successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create TBD game', description: error.message, variant: 'destructive' });
    }
  });

  const handleDeleteGame = (gameId: number) => {
    setDeleteType('single');
    setDeleteGameId(gameId);
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    if (selectedGames.length === 0) return;
    setDeleteType('bulk');
    setDeleteGameId(undefined);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setDeleteGameId(undefined);
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (deleteType === 'single' && deleteGameId) {
      deleteSingleGameMutation.mutate(deleteGameId);
    } else if (deleteType === 'bulk') {
      deleteBulkGamesMutation.mutate(selectedGames);
    } else if (deleteType === 'all') {
      deleteAllGamesMutation.mutate();
    }
  };

  const toggleGameSelection = (gameId: number) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGames.length === filteredGames.length) {
      setSelectedGames([]);
    } else {
      setSelectedGames(filteredGames.map(g => g.id));
    }
  };

  // Generate tooltip message for TBD/unassigned games
  // Check for existing overlaps in the schedule
  const getGameOverlaps = (game: Game) => {
    if (!game.fieldId || game.date === 'TBD' || game.time === 'TBD') {
      return { hasOverlap: false, conflicts: [], restPeriodViolations: [] };
    }
    
    return checkFieldOverlap(game.id, game.fieldId, game.date, game.time, game.duration);
  };

  const getUnassignedTooltip = (game: Game) => {
    const issues = [];
    
    if (game.time === 'TBD' || !game.time) {
      issues.push('No time assigned - scheduling algorithm couldn\'t find suitable time slot');
    }
    
    if (game.field === 'Unassigned' || game.field === 'TBD' || !game.field) {
      issues.push('No field assigned - field requirements may conflict with availability');
    }
    
    if (game.date === 'TBD' || !game.date) {
      issues.push('No date assigned - tournament dates may be incomplete');
    }

    // Check for field overlaps and rest period violations
    const overlapCheck = getGameOverlaps(game);
    if (overlapCheck.hasOverlap) {
      if (overlapCheck.conflicts.length > 0) {
        const conflictDetails = overlapCheck.conflicts.map(c => 
          `${c.time} - ${c.homeTeam} vs ${c.awayTeam}`
        ).join('; ');
        issues.push(`FIELD OVERLAP: Double-booked with ${conflictDetails}`);
      }
      
      if (overlapCheck.restPeriodViolations?.length > 0) {
        const restViolationDetails = overlapCheck.restPeriodViolations.map(rv => 
          `${rv.team} has only ${Math.round(rv.actualRest)}min rest (needs ${rv.requiredRest}min)`
        ).join('; ');
        issues.push(`REST PERIOD VIOLATION: ${restViolationDetails}`);
      }
    }

    if (issues.length === 0) return null;
    
    return `⚠️ Assignment Issues:\n${issues.map(issue => `• ${issue}`).join('\n')}\n\nSolutions:\n• Use Calendar Interface to manually assign\n• Check field availability and size requirements\n• Verify tournament dates are properly configured\n• Resolve field overlaps to prevent double-booking`;
  };

  const handleExportSchedule = () => {
    // Simple CSV export
    const csvContent = [
      ['Date', 'Time', 'Home Team', 'Away Team', 'Age Group', 'Field', 'Status'].join(','),
      ...filteredGames.map(game => [
        game.date,
        game.time,
        game.homeTeam,
        game.awayTeam,
        game.ageGroup,
        game.field,
        game.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-schedule-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Schedule exported successfully', variant: 'default' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: dk.violetMuted }} />
          <p style={{ color: dk.textSecondary }}>Loading tournament schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ background: dk.cardBg, border: `1px solid ${dk.redBorder}`, boxShadow: dk.cardShadow }}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: dk.redText }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: dk.redText }}>Error Loading Schedule</h3>
          <p style={{ color: dk.textSecondary }}>Unable to load tournament schedule. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData) {
    return (
      <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, boxShadow: dk.cardShadow }}>
        <CardContent className="p-8 text-center">
          <Database className="h-12 w-12 mx-auto mb-4" style={{ color: dk.textMuted }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: dk.textPrimary }}>No Schedule Data</h3>
          <p style={{ color: dk.textSecondary }}>Tournament schedule data is not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, backdropFilter: 'blur(12px)', boxShadow: dk.cardShadow }}>
          <CardContent className="p-3">
            <div className="flex items-center">
              <Database className="h-6 w-6 mr-2" style={{ color: dk.iconBlue }} />
              <div>
                <p className="text-sm font-medium" style={{ color: dk.textSecondary }}>
                  {scheduleData.actualData.scheduleType || 'Database Games'}
                </p>
                <p className="text-2xl font-bold" style={{ color: dk.textPrimary }}>{scheduleData.actualData.gamesInDatabase}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, backdropFilter: 'blur(12px)', boxShadow: dk.cardShadow }}>
          <CardContent className="p-3">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" style={{ color: dk.iconGreen }} />
              <div>
                <p className="text-sm font-medium" style={{ color: dk.textSecondary }}>Teams</p>
                <p className="text-2xl font-bold" style={{ color: dk.textPrimary }}>{scheduleData.actualData.teamsInDatabase}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, backdropFilter: 'blur(12px)', boxShadow: dk.cardShadow }}>
          <CardContent className="p-3">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 mr-2" style={{ color: dk.iconPurple }} />
              <div>
                <p className="text-sm font-medium" style={{ color: dk.textSecondary }}>Age Groups</p>
                <p className="text-2xl font-bold" style={{ color: dk.textPrimary }}>{scheduleData.actualData.ageGroupsConfigured}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, backdropFilter: 'blur(12px)', boxShadow: dk.cardShadow }}>
          <CardContent className="p-3">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 mr-2" style={{ color: dk.iconOrange }} />
              <div>
                <p className="text-sm font-medium" style={{ color: dk.textSecondary }}>Fields</p>
                <p className="text-2xl font-bold" style={{ color: dk.textPrimary }}>{scheduleData.fields.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Management */}
      <Card style={{ background: dk.cardBg, border: `1px solid ${dk.cardBorder}`, backdropFilter: 'blur(12px)', boxShadow: dk.cardShadow }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center" style={{ color: dk.textPrimary }}>
              <Calendar className="h-5 w-5 mr-2" style={{ color: dk.violetMuted }} />
              Tournament Schedule ({filteredGames.length} games)
            </CardTitle>
            
            {/* Management Actions */}
            <div className="flex flex-wrap gap-2">
              {selectedGames.length > 0 && !isFillingSlotsMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGames([])}
                    style={{ color: dk.textSecondary }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear ({selectedGames.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkFieldAssignment(true)}
                    style={{ color: dk.blueText }}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Assign Field
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleteBulkGamesMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </>
              )}
              
              {/* Fill Empty Slots Mode - Show when there are unscheduled games */}
              {unscheduledGames.length > 0 && (
                <>
                  {!isFillingSlotsMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsFillingSlotsMode(true);
                        setSelectedGames([]); // Clear regular game selection
                      }}
                      style={{ color: dk.blueText, borderColor: dk.blueBorder }}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Fill Empty Slots ({unscheduledGames.length} unscheduled)
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsFillingSlotsMode(false);
                          setSelectedUnscheduledGames([]);
                        }}
                        style={{ color: dk.textSecondary }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      
                      {selectedUnscheduledGames.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => fillEmptySlotsMutation.mutate(selectedUnscheduledGames)}
                          disabled={fillEmptySlotsMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {fillEmptySlotsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 mr-1" />
                          )}
                          Fill Next Empty Slot ({selectedUnscheduledGames.length})
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSchedule}
                disabled={filteredGames.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowTBDCreator(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Create TBD Game
              </Button>
              
              {scheduleData.games.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deleteAllGamesMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All Games
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: dk.textMuted }} />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {scheduleData.dates.map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="All Fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {scheduleData.fields.map(field => (
                  <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedAgeGroup} onValueChange={(value) => {
              setSelectedAgeGroup(value);
              // Reset flight filter when age group changes
              setSelectedFlight('all');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {scheduleData.ageGroups.map(ageGroup => (
                  <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedFlight} onValueChange={setSelectedFlight}>
              <SelectTrigger>
                <SelectValue placeholder="All Flights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flights</SelectItem>
                {(() => {
                  // Get unique flight names from games, filtered by selected age group
                  const filteredByAge = selectedAgeGroup === 'all' 
                    ? scheduleData.games 
                    : scheduleData.games.filter(game => game.ageGroup === selectedAgeGroup);
                  
                  // Debug logging for flight names
                  const allFlightNames = filteredByAge.map(game => game.flightName);
                  console.log('FLIGHT FILTER DEBUG: All flight names from games:', allFlightNames);
                  
                  const uniqueFlights = [...new Set(
                    filteredByAge
                      .map(game => game.flightName)
                      .filter(flight => flight && flight !== '' && flight !== 'undefined')
                  )].sort((a, b) => {
                    // Sort Nike flights in preferred order: Elite > Premier > Classic
                    const order = ['Nike Elite', 'Nike Premier', 'Nike Classic'];
                    const aIndex = order.indexOf(a);
                    const bIndex = order.indexOf(b);
                    
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    } else if (aIndex !== -1) {
                      return -1;
                    } else if (bIndex !== -1) {
                      return 1;
                    } else {
                      return a.localeCompare(b);
                    }
                  });
                  
                  console.log('FLIGHT FILTER DEBUG: Unique flights for dropdown:', uniqueFlights);
                  
                  return uniqueFlights.map(flight => (
                    <SelectItem key={flight} value={flight}>{flight}</SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>

            {filteredGames.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedGames.length === filteredGames.length}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All
                </Label>
              </div>
            )}
          </div>

          {/* Games List */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: dk.textMuted }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: dk.textPrimary }}>No Games Found</h3>
              <p style={{ color: dk.textSecondary }}>
                {scheduleData.games.length === 0
                  ? "No games have been scheduled yet. Use the Quick Generator to create a schedule."
                  : "No games match your current filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-4">
              {filteredGames.map((game) => {
                const tooltipMessage = getUnassignedTooltip(game);
                const hasUnassignedFields = game.time === 'TBD' || game.field === 'Unassigned' || game.field === 'TBD' || game.date === 'TBD';
                const overlapCheck = getGameOverlaps(game);
                const hasOverlap = overlapCheck.hasOverlap;
                
                return (
                <Card
                  key={game.id}
                  className="transition-all duration-200 rounded-xl overflow-hidden"
                  style={{
                    background: dk.cardBg,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${
                      hasOverlap ? dk.redBorder :
                      (isFillingSlotsMode && selectedUnscheduledGames.includes(game.id)) ? dk.greenBorder :
                      (isFillingSlotsMode && hasUnassignedFields) ? dk.yellowBorder :
                      (!isFillingSlotsMode && selectedGames.includes(game.id)) ? dk.violetBorder :
                      (!isFillingSlotsMode && hasUnassignedFields) ? dk.yellowBorder :
                      dk.cardBorder
                    }`,
                    boxShadow: hasOverlap
                      ? `0 0 20px rgba(239,68,68,0.12), ${dk.cardShadow}`
                      : (selectedGames.includes(game.id) || selectedUnscheduledGames.includes(game.id))
                        ? `0 0 20px rgba(124,58,237,0.15), ${dk.cardShadow}`
                        : dk.cardShadow,
                    opacity: (isFillingSlotsMode && !hasUnassignedFields) ? 0.5 : 1,
                  }}
                  title={tooltipMessage || undefined}
                >
                  <CardContent className="p-4">
                    {/* Header with checkbox and game ID */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isFillingSlotsMode ? 
                            selectedUnscheduledGames.includes(game.id) : 
                            selectedGames.includes(game.id)
                          }
                          onCheckedChange={() => {
                            if (isFillingSlotsMode) {
                              // Only allow selection of unscheduled games in this mode
                              if (hasUnassignedFields) {
                                setSelectedUnscheduledGames(prev => 
                                  prev.includes(game.id) ? 
                                    prev.filter(id => id !== game.id) :
                                    [...prev, game.id]
                                );
                              }
                            } else {
                              toggleGameSelection(game.id);
                            }
                          }}
                          disabled={isFillingSlotsMode && !hasUnassignedFields}
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono" style={{ color: dk.textSecondary, borderColor: dk.innerBorder, background: 'transparent' }}>
                            #{game.id}
                          </Badge>
                          <Badge variant="outline" className="text-xs" style={{ color: dk.violetMuted, borderColor: dk.violetBorder, background: dk.violetBg }}>
                            {game.ageGroup}
                          </Badge>
                          {game.flightName && (
                            <Badge variant="secondary" className="text-xs" style={{ color: dk.cyanMuted, background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.2)' }}>
                              {game.flightName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        {editingGame !== game.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGame(game.id)}
                            className="h-8 w-8 p-0"
                            style={{ color: dk.blueText }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGame(game.id)}
                          className="h-8 w-8 p-0"
                          style={{ color: dk.redText }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Main content area */}
                    <div className="space-y-3">
                      {/* Teams section */}
                      {editingGame?.gameId === game.id ? (
                          // Team Editing Interface
                          <div className="space-y-3 w-full">
                            <div className="text-sm font-medium" style={{ color: dk.textPrimary }}>Edit Game Teams</div>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <Label className="text-xs" style={{ color: dk.textSecondary }}>Home Team</Label>
                                <Select 
                                  defaultValue={
                                    editingGame?.editingPosition === 'home' 
                                      ? game.homeTeamId?.toString() 
                                      : editingGame?.editingPosition === 'away' 
                                      ? game.awayTeamId?.toString()
                                      : game.homeTeamId?.toString()
                                  }
                                  onValueChange={(value) => {
                                    if (editingGame?.editingPosition === 'home') {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: parseInt(value),
                                        awayTeamId: game.awayTeamId || null
                                      });
                                    } else if (editingGame?.editingPosition === 'away') {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: game.homeTeamId || null,
                                        awayTeamId: parseInt(value)
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={
                                      editingGame?.editingPosition === 'home' ? "Select home team" : "Select team"
                                    } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {editingGame?.availableTeams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs" style={{ color: dk.textSecondary }}>Away Team</Label>
                                <Select 
                                  defaultValue={game.awayTeamId?.toString()}
                                  onValueChange={(value) => {
                                    const homeTeamId = game.homeTeamId;
                                    if (homeTeamId && value !== homeTeamId.toString()) {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: homeTeamId,
                                        awayTeamId: parseInt(value)
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select away team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {flightTeams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingGame(null)}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Normal Game Display
                          <div className="space-y-4">
                            {/* Teams Display */}
                            <div className="rounded-lg p-3" style={{ background: dk.innerBg, border: `1px solid ${dk.innerBorder}` }}>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-4">
                                  {/* Home Team */}
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm font-semibold" style={{ color: dk.blueText }}>
                                      {game.homeTeam}
                                    </span>
                                    <span className="text-xs" style={{ color: dk.textMuted }}>Home</span>
                                  </div>

                                  {/* VS Divider */}
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold" style={{ color: 'rgba(124, 58, 237, 0.5)', textShadow: '0 0 10px rgba(124, 58, 237, 0.2)' }}>VS</span>
                                    {game.homeScore !== null && game.awayScore !== null && (
                                      <div className="text-sm font-mono" style={{ color: dk.textPrimary }}>
                                        {game.homeScore} - {game.awayScore}
                                      </div>
                                    )}
                                  </div>
                                  {/* Away Team */}
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm font-semibold" style={{ color: dk.orangeText }}>
                                      {game.awayTeam}
                                    </span>
                                    <span className="text-xs" style={{ color: dk.textMuted }}>Away</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Game Details */}
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              {/* Date */}
                              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: dk.innerBg, border: `1px solid ${dk.innerBorder}` }}>
                                <Calendar className="h-4 w-4" style={{ color: dk.iconBlue }} />
                                <div>
                                  <div className="text-xs" style={{ color: dk.textMuted }}>Date</div>
                                  <div className="font-medium" style={{ color: game.date === 'TBD' ? dk.yellowText : dk.textPrimary }}>
                                    {game.date === 'TBD' ? 'TBD' : new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>

                              {/* Time */}
                              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: dk.innerBg, border: `1px solid ${dk.innerBorder}` }}>
                                <Clock className="h-4 w-4" style={{ color: dk.iconGreen }} />
                                <div>
                                  <div className="text-xs" style={{ color: dk.textMuted }}>Time</div>
                                  <div className="font-medium" style={{ color: game.time === 'TBD' ? dk.yellowText : dk.textPrimary }}>
                                    {game.time === 'TBD' ? 'TBD' : game.time}
                                  </div>
                                </div>
                              </div>

                              {/* Field */}
                              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: dk.innerBg, border: `1px solid ${dk.innerBorder}` }}>
                                <MapPin className="h-4 w-4" style={{ color: dk.iconOrange }} />
                                <div>
                                  <div className="text-xs" style={{ color: dk.textMuted }}>Field</div>
                                  <div className="font-medium" style={{ color: (game.field === 'Unassigned' || game.field === 'TBD') ? dk.yellowText : dk.textPrimary }}>
                                    {game.field}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status and Warnings */}
                            <div className="flex flex-wrap gap-2 justify-center">
                              <Badge
                                className="text-xs"
                                style={{
                                  background: game.status === 'scheduled' ? dk.greenBg :
                                    game.status === 'completed' ? dk.blueBg :
                                    game.status === 'pending' ? dk.yellowBg :
                                    'rgba(255,255,255,0.05)',
                                  color: game.status === 'scheduled' ? dk.greenText :
                                    game.status === 'completed' ? dk.blueText :
                                    game.status === 'pending' ? dk.yellowText :
                                    dk.textSecondary,
                                  border: `1px solid ${
                                    game.status === 'scheduled' ? dk.greenBorder :
                                    game.status === 'completed' ? dk.blueBorder :
                                    game.status === 'pending' ? dk.yellowBorder :
                                    dk.innerBorder
                                  }`,
                                }}
                              >
                                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                              </Badge>

                              {hasOverlap && (
                                <>
                                  {overlapCheck.conflicts.length > 0 && (
                                    <Badge className="text-xs" style={{ background: dk.redBg, color: dk.redText, border: `1px solid ${dk.redBorder}` }}>
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Field Conflict
                                    </Badge>
                                  )}
                                  {overlapCheck.restPeriodViolations?.length > 0 && (
                                    <Badge className="text-xs" style={{ background: dk.orangeBg, color: dk.orangeText, border: `1px solid ${dk.orangeBorder}` }}>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Rest Violation ({overlapCheck.restPeriodViolations.length})
                                    </Badge>
                                  )}
                                </>
                              )}

                              {hasUnassignedFields && (
                                <Badge className="text-xs" style={{ background: dk.yellowBg, color: dk.yellowText, border: `1px solid ${dk.yellowBorder}` }}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Incomplete
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Team Swapping Indicator */}
      {swappingTeam && (
        <div className="fixed top-4 right-4 z-40">
          <Card style={{ background: dk.cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${dk.violetBorder}`, boxShadow: '0 0 30px rgba(124,58,237,0.15), 0 8px 32px rgba(0,0,0,0.4)' }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2" style={{ color: dk.textPrimary }}>
                <ArrowLeftRight className="h-4 w-4" style={{ color: dk.violetMuted }} />
                <div className="text-sm">
                  <div className="font-medium">Swapping Mode Active</div>
                  <div className="text-xs" style={{ color: dk.textSecondary }}>
                    Selected: {swappingTeam.teamName} ({swappingTeam.position})
                  </div>
                  <div className="text-xs" style={{ color: dk.violetMuted }}>
                    Click another team to complete swap
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSwappingTeam(null)}
                  className="h-6 w-6 p-0"
                  style={{ color: dk.textSecondary }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(10, 5, 30, 0.75)', backdropFilter: 'blur(4px)' }}>
          <Card className="w-full max-w-md mx-4" style={{ background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(24px)', border: `1px solid ${dk.redBorder}`, boxShadow: '0 0 30px rgba(239,68,68,0.1), 0 25px 50px rgba(0,0,0,0.5)' }}>
            <CardHeader>
              <CardTitle className="flex items-center" style={{ color: dk.redText }}>
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4" style={{ color: dk.textSecondary }}>
                {deleteType === 'single' && 'Are you sure you want to delete this game? This action cannot be undone.'}
                {deleteType === 'bulk' && `Are you sure you want to delete ${selectedGames.length} selected games? This action cannot be undone.`}
                {deleteType === 'all' && `Are you sure you want to delete ALL ${scheduleData.games.length} games? This will completely clear the tournament schedule and cannot be undone.`}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={executeDelete}
                  disabled={deleteSingleGameMutation.isPending || deleteBulkGamesMutation.isPending || deleteAllGamesMutation.isPending}
                >
                  {(deleteSingleGameMutation.isPending || deleteBulkGamesMutation.isPending || deleteAllGamesMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {deleteType === 'single' && 'Delete Game'}
                  {deleteType === 'bulk' && `Delete ${selectedGames.length} Games`}
                  {deleteType === 'all' && 'Delete All Games'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TBD Game Creation Dialog */}
      {showTBDCreator && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(10, 5, 30, 0.75)', backdropFilter: 'blur(4px)' }}>
          <Card className="w-full max-w-md mx-4" style={{ background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(24px)', border: `1px solid ${dk.greenBorder}`, boxShadow: '0 0 30px rgba(34,197,94,0.1), 0 25px 50px rgba(0,0,0,0.5)' }}>
            <CardHeader>
              <CardTitle className="flex items-center" style={{ color: dk.greenText }}>
                <Calendar className="h-5 w-5 mr-2" />
                Create TBD Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Age Group</Label>
                <Select 
                  value={tbdGameData.ageGroupId?.toString()} 
                  onValueChange={(value) => setTBDGameData(prev => ({ ...prev, ageGroupId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroupsData?.map((ageGroup: any) => (
                      <SelectItem key={ageGroup.id} value={ageGroup.id.toString()}>
                        {ageGroup.name} ({ageGroup.gender} - {ageGroup.divisionCode || ageGroup.division || 'No Division'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tbdGameData.ageGroupId && (
                <div>
                  <Label className="text-sm font-medium">Flight</Label>
                  <Select 
                    value={tbdGameData.flightId?.toString()} 
                    onValueChange={(value) => setTBDGameData(prev => ({ ...prev, flightId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flight" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroupsData?.find((ag: any) => ag.id === tbdGameData.ageGroupId)?.flights?.map((flight: any) => (
                        <SelectItem key={flight.id} value={flight.id.toString()}>
                          {flight.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Date (Optional)</Label>
                  <Input
                    type="date"
                    value={tbdGameData.date || ''}
                    onChange={(e) => setTBDGameData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Time (Optional)</Label>
                  <Input
                    type="time"
                    value={tbdGameData.time || ''}
                    onChange={(e) => setTBDGameData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Field (Optional)</Label>
                <Select 
                  value={tbdGameData.fieldId?.toString()} 
                  onValueChange={(value) => setTBDGameData(prev => ({ ...prev, fieldId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldsData?.map((field: any) => (
                      <SelectItem key={field.id} value={field.id.toString()}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={tbdGameData.duration}
                  onChange={(e) => setTBDGameData(prev => ({ ...prev, duration: parseInt(e.target.value) || 90 }))}
                  min="30"
                  max="120"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTBDCreator(false);
                    setTBDGameData({ duration: 90 });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createTBDGameMutation.mutate(tbdGameData)}
                  disabled={createTBDGameMutation.isPending || !tbdGameData.ageGroupId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createTBDGameMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Create TBD Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Field Assignment Dialog */}
      {showBulkFieldAssignment && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(10, 5, 30, 0.75)', backdropFilter: 'blur(4px)' }}>
          <Card className="w-96 max-w-full mx-4" style={{ background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(24px)', border: `1px solid ${dk.violetBorder}`, boxShadow: '0 0 30px rgba(124,58,237,0.12), 0 25px 50px rgba(0,0,0,0.5)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: dk.textPrimary }}>
                <MapPin className="h-5 w-5" style={{ color: dk.iconOrange }} />
                Assign Field to {selectedGames.length} Games
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium" style={{ color: dk.textSecondary }}>Select Field</Label>
                <Select 
                  value={bulkFieldId} 
                  onValueChange={setBulkFieldId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose field to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields?.map((field) => (
                      <SelectItem key={field.id} value={field.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: dk.textMuted }}>({field.fieldSize})</span>
                          <span>{field.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkFieldAssignment(false);
                    setBulkFieldId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (bulkFieldId) {
                      bulkAssignFieldMutation.mutate({
                        gameIds: selectedGames,
                        fieldId: parseInt(bulkFieldId)
                      });
                    }
                  }}
                  disabled={!bulkFieldId || bulkAssignFieldMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {bulkAssignFieldMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Assign Field
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}