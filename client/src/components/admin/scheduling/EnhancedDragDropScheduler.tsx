import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, AlertTriangle, MoreVertical, CalendarDays, Clock, Users } from 'lucide-react';
import { SchedulingConstraintsManager } from './SchedulingConstraintsManager';
import { GapFillingOptimizer } from './GapFillingOptimizer';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  ageGroup: string;
  startTime: string;
  endTime: string;
  fieldName: string;
  fieldId: number;
  status: string;
  duration: number;
  homeTeamCoach?: string;
  awayTeamCoach?: string;
  bracketName?: string;
}

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  isOpen: boolean;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  timestampMinutes: number; // Minutes from start of day for easy calculations
}

interface ConflictInfo {
  type: 'coach' | 'team_rest' | 'field_size' | 'capacity' | 'games_per_day' | 'team_conflict' | 'rest_period';
  severity: 'warning' | 'error';
  message: string;
  gameIds: number[];
}

interface EnhancedDragDropSchedulerProps {
  eventId: string;
}

export default function EnhancedDragDropScheduler({ eventId }: EnhancedDragDropSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-16');
  const [timeInterval, setTimeInterval] = useState<number>(15); // 5, 10, 15 minute intervals
  const [draggedGame, setDraggedGame] = useState<Game | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ fieldId: number; timeSlot: string } | null>(null);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [gamePositions, setGamePositions] = useState<Map<number, { fieldId: number; startTime: string }>>(new Map());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Available tournament days (this should come from event data)
  const availableDays = [
    { value: '2025-08-16', label: 'Saturday, Aug 16' },
    { value: '2025-08-17', label: 'Sunday, Aug 17' },
    { value: '2025-08-18', label: 'Monday, Aug 18' }
  ];

  // Fetch games and fields data
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['enhanced-schedule', eventId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-calendar`);
      if (!response.ok) throw new Error('Failed to fetch schedule data');
      const data = await response.json();
      
      // Transform the games data to match calendar interface expectations
      const transformedGames = data.games?.map((game: any) => ({
        id: game.id,
        homeTeamName: game.homeTeam || 'TBD',
        awayTeamName: game.awayTeam || 'TBD',
        ageGroup: game.ageGroup || 'Unknown',
        fieldId: game.fieldId,
        fieldName: game.fieldName || game.field || 'Field Unknown',
        startTime: game.startTime || (game.date !== 'TBD' && game.time !== 'TBD' ? `${game.date}T${game.time}:00` : null),
        endTime: game.endTime || null,
        duration: game.duration || 90,
        status: game.status || 'scheduled',
        homeTeamCoach: game.homeTeamCoach || '',
        awayTeamCoach: game.awayTeamCoach || '',
        bracketName: game.bracketName || ''
      })) || [];
      
      console.log('🎯 [ENHANCED DRAG DROP] Transformed games for calendar:', transformedGames);
      console.log('🎯 [ENHANCED DRAG DROP] Fields data:', data.fields);
      
      // Debug game-field mapping
      transformedGames.forEach((game: any) => {
        console.log(`🎯 [GAME-FIELD DEBUG] Game ${game.id}: fieldId=${game.fieldId}, fieldName="${game.fieldName}", startTime="${game.startTime}"`);
      });
      
      return {
        ...data,
        games: transformedGames
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Calculate total game duration to match Flight Configuration Overview
  const calculateTotalGameDuration = useCallback((game: Game) => {
    // Use flight configuration-aligned calculation to match the 85-minute total
    // This makes games span exactly 6 time intervals instead of 7 (85 min ÷ 15 min = 5.67 → 6 slots)
    const gameLength = game.duration || 90; // Actual game play time
    
    // Reduced buffer to align with Flight Configuration showing 85 minutes total
    // This ensures games don't visually extend beyond expected time intervals
    const transitionBuffer = 0; // Remove buffer to match flight config calculation
    
    return gameLength - 5; // 90 - 5 = 85 minutes (matches Flight Configuration)
  }, []);

  // Calculate how many time slot intervals a game should span
  const calculateGameSpanSlots = useCallback((game: Game) => {
    const totalDuration = calculateTotalGameDuration(game);
    const slotsNeeded = Math.ceil(totalDuration / timeInterval);
    return Math.max(1, slotsNeeded); // At least 1 slot
  }, [calculateTotalGameDuration, timeInterval]);

  // Generate time slots with fine-grained intervals
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const intervalMinutes = timeInterval;

    for (let totalMinutes = startHour * 60; totalMinutes < endHour * 60; totalMinutes += intervalMinutes) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Calculate end time
      const endTotalMinutes = totalMinutes + intervalMinutes;
      const endHours = Math.floor(endTotalMinutes / 60);
      const endMinutes = endTotalMinutes % 60;
      const endTimeString = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      slots.push({
        id: `${selectedDate}-${timeString}`,
        startTime: timeString,
        endTime: endTimeString,
        displayTime: formatDisplayTime(timeString),
        timestampMinutes: totalMinutes
      });
    }

    return slots;
  }, [timeInterval, selectedDate]);

  const formatDisplayTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Check if a time slot is occupied by an extending game from an earlier slot (now horizontally)
  const isSlotOccupiedByExtendingGame = useCallback((fieldId: number, timeSlot: TimeSlot): boolean => {
    if (!scheduleData?.games) return false;

    const timeSlots = generateTimeSlots();
    const currentSlotIndex = timeSlots.findIndex(s => s.id === timeSlot.id);
    
    // Check all previous time slots for games that might extend horizontally into this slot
    for (let i = 0; i < currentSlotIndex; i++) {
      const previousSlot = timeSlots[i];
      const gamesInPreviousSlot = scheduleData.games.filter((game: Game) => {
        const position = gamePositions.get(game.id);
        const effectiveFieldId = position?.fieldId ?? game.fieldId;
        const effectiveStartTime = position?.startTime ?? game.startTime;

        if (effectiveFieldId !== fieldId) return false;

        const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
        const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                        effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');

        return gameDate === selectedDate && gameTime === previousSlot.startTime;
      });

      // Check if any game from previous slot extends horizontally into current slot
      for (const game of gamesInPreviousSlot) {
        const gameSpanSlots = calculateGameSpanSlots(game);
        const slotsFromStart = currentSlotIndex - i;
        if (slotsFromStart < gameSpanSlots) {
          return true; // This slot is occupied by an extending game
        }
      }
    }

    return false;
  }, [scheduleData?.games, selectedDate, gamePositions, generateTimeSlots, calculateGameSpanSlots, draggedGame]);

  // Get games for a specific field and time slot (only games that START in this slot)
  const getGamesForSlot = useCallback((fieldId: number, timeSlot: TimeSlot): Game[] => {
    if (!scheduleData?.games) return [];

    return scheduleData.games.filter((game: Game) => {
      // Check if game has been moved optimistically
      const position = gamePositions.get(game.id);
      const effectiveFieldId = position?.fieldId ?? game.fieldId;
      const effectiveStartTime = position?.startTime ?? game.startTime;

      if (effectiveFieldId !== fieldId) return false;

      // Parse the game's effective start time - improved for different time intervals
      const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
      const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                      effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');

      // For time interval compatibility: check if game time matches any time slot that could contain it
      if (gameDate !== selectedDate) return false;
      
      // Convert times to minutes for flexible interval matching
      const gameMinutes = getTimeInMinutes(gameTime);
      const slotMinutes = getTimeInMinutes(timeSlot.startTime);
      
      // Check if game starts exactly at this time slot OR 
      // if this time slot is the closest valid interval start time for the game
      const isExactMatch = gameTime === timeSlot.startTime;
      
      // For different intervals, find the slot that would contain this game time
      const intervalMinutes = timeInterval;
      const startOfDay = 8 * 60; // 8 AM in minutes
      const gameOffsetFromStart = gameMinutes - startOfDay;
      const expectedSlotIndex = Math.floor(gameOffsetFromStart / intervalMinutes);
      const expectedSlotMinutes = startOfDay + (expectedSlotIndex * intervalMinutes);
      
      const isIntervalMatch = slotMinutes === expectedSlotMinutes && 
                             gameMinutes >= slotMinutes && 
                             gameMinutes < slotMinutes + intervalMinutes;
      
      return isExactMatch || isIntervalMatch;
    });
  }, [scheduleData?.games, selectedDate, gamePositions, draggedGame]);

  // Helper function to convert time string to minutes since midnight
  const getTimeInMinutes = (timeString: string): number => {
    const timeStr = timeString?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                   timeString?.split(' ')[1]?.split(':').slice(0, 2).join(':') || timeString;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to format minutes back to time string
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Helper function to get rest period (60min default, configurable by admins)
  const getRestPeriod = (): number => {
    // TODO: Load from admin configuration/database settings
    // For now, use universal 60-minute default
    return 60;
  };

  // Helper function to check if a team name is a winner placeholder
  const isWinnerPlaceholder = (teamName: string): boolean => {
    if (!teamName) return false;
    
    const placeholders = [
      'TBD',
      '1st in Points',
      '2nd in Points', 
      '1st Place Bracket A',
      '1st Place Bracket B',
      '2nd Place Bracket A',
      '2nd Place Bracket B',
      'Winner Semifinal 1',
      'Winner Semifinal 2',
      '1st Place',
      '2nd Place'
    ];
    
    return placeholders.includes(teamName);
  };

  // Helper function to check if a game has winner placeholders
  const hasWinnerPlaceholder = (game: any): boolean => {
    return isWinnerPlaceholder(game.homeTeamName) || isWinnerPlaceholder(game.awayTeamName);
  };

  // Detect scheduling conflicts with enhanced overlap detection
  const detectConflicts = useCallback((games: Game[]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    
    console.log(`🔍 [CONFLICT DETECTION] Starting enhanced overlap detection for ${games.length} games`);
    
    // Enhanced overlap detection - check each game against all other games
    games.forEach((game1, i) => {
      const position1 = gamePositions.get(game1.id);
      const effectiveStartTime1 = position1?.startTime ?? game1.startTime;
      const gameDate1 = effectiveStartTime1?.split('T')[0] || effectiveStartTime1?.split(' ')[0];
      
      // Only check conflicts for games on the selected date
      if (gameDate1 !== selectedDate) return;
      
      const gameStartMinutes1 = getTimeInMinutes(effectiveStartTime1);
      const gameEndMinutes1 = gameStartMinutes1 + calculateTotalGameDuration(game1);
      
      games.forEach((game2, j) => {
        if (i >= j) return; // Avoid duplicate checks
        
        const position2 = gamePositions.get(game2.id);
        const effectiveStartTime2 = position2?.startTime ?? game2.startTime;
        const gameDate2 = effectiveStartTime2?.split('T')[0] || effectiveStartTime2?.split(' ')[0];
        
        // Only check conflicts for games on the same date
        if (gameDate2 !== selectedDate) return;
        
        const gameStartMinutes2 = getTimeInMinutes(effectiveStartTime2);
        const gameEndMinutes2 = gameStartMinutes2 + calculateTotalGameDuration(game2);
        
        // Check for time overlap
        const hasTimeOverlap = gameStartMinutes1 < gameEndMinutes2 && gameStartMinutes2 < gameEndMinutes1;
        
        if (hasTimeOverlap) {
          // Check for team conflicts (same team playing at overlapping times)
          // Filter out winner placeholders (they're not actual teams yet)
          const teams1 = [game1.homeTeamName, game1.awayTeamName].filter(t => t && !isWinnerPlaceholder(t));
          const teams2 = [game2.homeTeamName, game2.awayTeamName].filter(t => t && !isWinnerPlaceholder(t));
          
          const teamOverlap = teams1.some(team => teams2.includes(team));
          const bothHavePlaceholders = hasWinnerPlaceholder(game1) && hasWinnerPlaceholder(game2);
          
          if (teamOverlap || bothHavePlaceholders) {
            const overlappingTeams = teamOverlap ? 
              teams1.filter(team => teams2.includes(team)) :
              ['Championship Games'];
              
            console.log(`🚨 [OVERLAP DETECTED] Team conflict between games ${game1.id} and ${game2.id}:`, overlappingTeams);
            conflicts.push({
              type: 'team_conflict',
              severity: 'error',
              message: `${overlappingTeams.join(', ')} has overlapping games: ${formatTime(gameStartMinutes1)}-${formatTime(gameEndMinutes1)} and ${formatTime(gameStartMinutes2)}-${formatTime(gameEndMinutes2)}`,
              gameIds: [game1.id, game2.id]
            });
          }
        }
        
        // Check for rest period violations (even if games don't overlap)
        // Only check rest periods for actual teams, not winner placeholders
        const teams1 = [game1.homeTeamName, game1.awayTeamName].filter(t => t && !isWinnerPlaceholder(t));
        const teams2 = [game2.homeTeamName, game2.awayTeamName].filter(t => t && !isWinnerPlaceholder(t));
        
        const teamRestViolation = teams1.some(team => teams2.includes(team));
        
        if (teamRestViolation && !hasTimeOverlap) {
          // Use universal 60-minute rest period (configurable by admins)
          const requiredRestPeriod = getRestPeriod();
          
          // Calculate time between games
          const timeBetween = Math.abs(gameEndMinutes1 - gameStartMinutes2);
          const timeBetweenReverse = Math.abs(gameEndMinutes2 - gameStartMinutes1);
          const shortestGap = Math.min(timeBetween, timeBetweenReverse);
          
          if (shortestGap < requiredRestPeriod) {
            const violatingTeams = teams1.filter(team => teams2.includes(team));
            
            console.log(`⚠️ [REST PERIOD] Rest period violation between games ${game1.id} and ${game2.id}:`, violatingTeams, `Gap: ${shortestGap}min, Required: ${requiredRestPeriod}min`);
            conflicts.push({
              type: 'rest_period',
              severity: 'warning',
              message: `${violatingTeams.join(', ')} has insufficient rest period: ${shortestGap}min between games (minimum: ${requiredRestPeriod}min)`,
              gameIds: [game1.id, game2.id]
            });
          }
        }
      });
    });

    const timeSlots = generateTimeSlots();
    
    console.log(`🔍 [CONFLICT DETECTION] Starting legacy slot-based detection for ${games.length} games`);
    console.log(`🔍 [CONFLICT DETECTION] Time slots: ${timeSlots.length}`);
    console.log(`🔍 [CONFLICT DETECTION] Sample games:`, games.slice(0, 3).map(g => ({
      id: g.id,
      homeTeamName: g.homeTeamName,
      awayTeamName: g.awayTeamName,
      startTime: g.startTime
    })));

    // ENHANCED: Check games per day limits for teams
    const gamesPerTeamPerDay = new Map<string, Game[]>();
    games.filter(game => {
      const position = gamePositions.get(game.id);
      const effectiveStartTime = position?.startTime ?? game.startTime;
      const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
      return gameDate === selectedDate;
    }).forEach(game => {
      [game.homeTeamName, game.awayTeamName].forEach(teamName => {
        if (!gamesPerTeamPerDay.has(teamName)) {
          gamesPerTeamPerDay.set(teamName, []);
        }
        gamesPerTeamPerDay.get(teamName)!.push(game);
      });
    });

    // ENHANCED: Check for teams exceeding games-per-day limit (from database settings)
    // Fetch constraints from the constraint manager or use defaults
    const MAX_GAMES_PER_DAY = 2; // Will be dynamically loaded from database settings
    gamesPerTeamPerDay.forEach((teamGames, teamName) => {
      if (teamGames.length > MAX_GAMES_PER_DAY) {
        conflicts.push({
          type: 'games_per_day' as const,
          severity: 'error' as const,
          message: `${teamName} has ${teamGames.length} games scheduled for ${selectedDate} (limit: ${MAX_GAMES_PER_DAY} games per day)`,
          gameIds: teamGames.map(g => g.id)
        });
      }
    });

    timeSlots.forEach(slot => {
      const slotGames = games.filter(game => {
        const position = gamePositions.get(game.id);
        const effectiveStartTime = position?.startTime ?? game.startTime;
        const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
        const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                        effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
        
        // CRITICAL FIX: Only check conflicts for games on the SAME DAY as the selected date
        return gameDate === selectedDate && gameTime === slot.startTime;
      });

      // Enhanced coach conflict detection using coach emails
      const coachGames = new Map<string, Game[]>();
      slotGames.forEach(game => {
        // Extract coach emails from both teams
        const coaches = [];
        
        // Home team coach extraction
        if ((game as any).homeTeam?.coach) {
          try {
            const coachData = typeof (game as any).homeTeam.coach === 'string' 
              ? JSON.parse((game as any).homeTeam.coach) 
              : (game as any).homeTeam.coach;
            if (coachData.email) {
              coaches.push({ email: coachData.email, name: coachData.name || coachData.headCoachName, team: game.homeTeamName });
            }
          } catch (e) {
            // Silent fail
          }
        }
        
        // Away team coach extraction
        if ((game as any).awayTeam?.coach) {
          try {
            const coachData = typeof (game as any).awayTeam.coach === 'string' 
              ? JSON.parse((game as any).awayTeam.coach) 
              : (game as any).awayTeam.coach;
            if (coachData.email) {
              coaches.push({ email: coachData.email, name: coachData.name || coachData.headCoachName, team: game.awayTeamName });
            }
          } catch (e) {
            // Silent fail
          }
        }
        
        // Map coaches by email to detect conflicts
        coaches.forEach(coach => {
          const coachKey = coach.email;
          if (!coachGames.has(coachKey)) coachGames.set(coachKey, []);
          coachGames.get(coachKey)!.push(game);
        });
      });

      coachGames.forEach((games, coachEmail) => {
        if (games.length > 1) {
          const coachName = coachEmail;
          const teams = games.map(g => g.homeTeamName).concat(games.map(g => g.awayTeamName)).filter(Boolean);
          const uniqueTeams = Array.from(new Set(teams));
          
          conflicts.push({
            type: 'coach',
            severity: 'error',
            message: `Coach ${coachName} (${coachEmail}) has ${games.length} overlapping games at ${slot.displayTime} with teams: ${uniqueTeams.join(', ')}`,
            gameIds: games.map(g => g.id)
          });
        }
      });

      // CRITICAL: Same team conflict detection - same team cannot play multiple games at same time
      const teamGames = new Map<string, Game[]>();
      slotGames.forEach(game => {
        // Check both home and away teams, but handle TBD specially
        [game.homeTeamName, game.awayTeamName].forEach(teamName => {
          // Only track actual team names, not placeholders like "TBD"
          if (teamName && teamName.trim() !== '' && teamName !== 'TBD') {
            if (!teamGames.has(teamName)) teamGames.set(teamName, []);
            teamGames.get(teamName)!.push(game);
          }
        });
      });

      // Check for simultaneous scheduling of same team on different fields
      teamGames.forEach((games, teamName) => {
        if (games.length > 1) {
          console.log(`🚨 [TEAM CONFLICT] ${teamName} has ${games.length} games at ${slot.displayTime}:`, games.map(g => ({ id: g.id, vs: `${g.homeTeamName} vs ${g.awayTeamName}`, fieldId: g.fieldId })));
          conflicts.push({
            type: 'team_conflict',
            severity: 'error',
            message: `${teamName} is scheduled for ${games.length} games at the same time (${slot.displayTime}) on different fields`,
            gameIds: games.map(g => g.id)
          });
        }
      });

      // SPECIAL: Handle TBD vs TBD conflicts - these should also be flagged as simultaneous scheduling conflicts  
      const tbdGames = slotGames.filter(game => 
        (game.homeTeamName === 'TBD' && game.awayTeamName === 'TBD') ||
        (game.homeTeamName === 'TBD' || game.awayTeamName === 'TBD')
      );
      
      if (tbdGames.length > 1) {
        console.log(`🚨 [TBD CONFLICT] ${tbdGames.length} TBD games at ${slot.displayTime}:`, tbdGames.map(g => ({ id: g.id, vs: `${g.homeTeamName} vs ${g.awayTeamName}`, fieldId: g.fieldId })));
        conflicts.push({
          type: 'team_conflict', 
          severity: 'error',
          message: `TBD is scheduled for ${tbdGames.length} games at the same time (${slot.displayTime})`,
          gameIds: tbdGames.map(g => g.id)
        });
      }

      // ENHANCED: Team rest period conflicts (from database settings)
      // Will be dynamically loaded from event schedule constraints
      const MIN_REST_PERIOD_MINUTES = 90; // Default, will be overridden by database settings
      slotGames.forEach(game => {
        const teams = [game.homeTeamName, game.awayTeamName];
        
        // Check if same teams play within rest period
        const conflictingSlots = timeSlots.filter(checkSlot => {
          const timeDiff = Math.abs(checkSlot.timestampMinutes - slot.timestampMinutes);
          return timeDiff > 0 && timeDiff < MIN_REST_PERIOD_MINUTES;
        });

        conflictingSlots.forEach(conflictSlot => {
          const conflictGames = games.filter(g => {
            const position = gamePositions.get(g.id);
            const effectiveStartTime = position?.startTime ?? g.startTime;
            const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
            const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                            effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
            
            // CRITICAL FIX: Only check rest conflicts for games on the SAME DAY as the selected date
            return gameDate === selectedDate && 
                   gameTime === conflictSlot.startTime && 
                   (teams.includes(g.homeTeamName) || teams.includes(g.awayTeamName));
          });

          if (conflictGames.length > 0) {
            // Get the specific teams that have conflicts
            const conflictingTeams = new Set<string>();
            teams.forEach(team => {
              if (conflictGames.some(g => g.homeTeamName === team || g.awayTeamName === team)) {
                conflictingTeams.add(team);
              }
            });
            
            const teamList = Array.from(conflictingTeams);
            const teamNames = teamList.length > 2 
              ? `${teamList.slice(0, 2).join(', ')} and ${teamList.length - 2} other teams`
              : teamList.join(' and ');
            
            conflicts.push({
              type: 'team_rest',
              severity: 'warning',
              message: `${teamNames} have insufficient rest between ${slot.displayTime} and ${conflictSlot.displayTime}`,
              gameIds: [game.id, ...conflictGames.map(g => g.id)]
            });
          }
        });
      });
    });

    return conflicts;
  }, [generateTimeSlots, gamePositions]);

  // Update game position mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, fieldId, startTime }: { gameId: number; fieldId: number; startTime: string }) => {
      console.log(`🚀 [ENHANCED MUTATION] Sending reschedule request to backend...`);
      console.log(`📤 Request details: gameId=${gameId}, fieldId=${fieldId}, startTime=${startTime}, eventId=${eventId}`);
      
      const response = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId, startTime, eventId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ [ENHANCED MUTATION] Request failed with status ${response.status}`);
        console.error(`📝 Error response:`, errorData);
        throw new Error(errorData.error || 'Failed to update game position');
      }

      const result = await response.json();
      console.log(`✅ [ENHANCED MUTATION] Request successful`);
      console.log(`📥 Response data:`, result);
      return result;
    },
    onSuccess: (data) => {
      console.log(`🎉 [ENHANCED MUTATION SUCCESS] Game reschedule completed successfully`);
      console.log(`📊 Server response:`, data);
      console.log(`🔄 Clearing optimistic update and refreshing data...`);
      
      // Invalidate both Calendar Interface and Schedule Viewer queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-schedule', eventId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-schedule', eventId] });
      
      setIsOptimisticUpdate(false);
      toast({ title: 'Game moved successfully', description: 'Schedule Viewer will refresh automatically' });
    },
    onError: (error) => {
      console.error(`❌ [ENHANCED MUTATION FAILED] Game reschedule failed`);
      console.error(`💥 Error details:`, error);
      console.error(`📝 Error message:`, error.message);
      console.log(`↩️  Reverting optimistic update...`);
      
      // Revert optimistic update
      setGamePositions(prev => {
        const updated = new Map(prev);
        if (draggedGame) {
          updated.delete(draggedGame.id);
        }
        return updated;
      });
      setIsOptimisticUpdate(false);
      toast({ 
        title: 'Failed to move game', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Function to move game to different day
  const moveGameToDay = useCallback(async (game: Game, newDate: string) => {
    try {
      // Calculate new start time for the selected day at 8:00 AM
      const newStartTime = `${newDate}T08:00:00.000Z`;
      
      // Find the first available field for this game
      const firstAvailableField = fields.find((f: Field) => f.isOpen)?.id || game.fieldId;
      
      // Call the reschedule API with new date
      updateGameMutation.mutate({
        gameId: game.id,
        fieldId: firstAvailableField,
        startTime: newStartTime
      });
      
      toast({
        title: "Game Moved",
        description: `${game.homeTeamName} vs ${game.awayTeamName} moved to ${availableDays.find(d => d.value === newDate)?.label}`
      });
      
      // Switch to the new date to show the moved game
      setSelectedDate(newDate);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move game to new day",
        variant: "destructive"
      });
    }
  }, [updateGameMutation, toast, availableDays, setSelectedDate]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, game: Game) => {
    console.log(`🎬 [ENHANCED DRAG DROP] Drag started for game ${game.id}`);
    console.log(`📋 Dragging: ${game.homeTeamName} vs ${game.awayTeamName} (${game.ageGroup})`);
    console.log(`📍 Current position: Field ${game.fieldName} at ${game.startTime}`);
    
    setDraggedGame(game);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', game.id.toString());
    
    // Add visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle drag over - FIXED: Better collision detection for occupied slots
  const handleDragOver = (e: React.DragEvent, fieldId: number, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedGame) return;
    
    const timeSlots = generateTimeSlots();
    const timeSlotObj = timeSlots.find(slot => slot.startTime === timeSlot);
    if (!timeSlotObj) return;
    
    // Get all games in this slot, excluding the dragged game
    const gamesInSlot = getGamesForSlot(fieldId, timeSlotObj);
    const nonDraggedGames = gamesInSlot.filter(game => game.id !== draggedGame.id);
    
    // Check if extending games from previous slots would conflict (excluding dragged game)
    const isOccupiedByExtending = isSlotOccupiedByExtendingGame(fieldId, timeSlotObj);
    
    // Calculate how many slots the dragged game would need
    const draggedGameSpanSlots = calculateGameSpanSlots(draggedGame);
    const currentSlotIndex = timeSlots.findIndex(s => s.id === timeSlotObj.id);
    
    // Check if ALL required slots for the dragged game are available
    let canDrop = true;
    for (let i = 0; i < draggedGameSpanSlots; i++) {
      const checkSlotIndex = currentSlotIndex + i;
      if (checkSlotIndex >= timeSlots.length) {
        canDrop = false; // Game would extend beyond available time slots
        break;
      }
      
      const checkSlot = timeSlots[checkSlotIndex];
      const checkGames = getGamesForSlot(fieldId, checkSlot).filter(g => g.id !== draggedGame.id);
      const checkOccupied = isSlotOccupiedByExtendingGame(fieldId, checkSlot);
      
      // If any slot in the span is occupied, can't drop
      if (checkGames.length > 0 || checkOccupied) {
        canDrop = false;
        break;
      }
    }
    
    // Allow drop only if all required slots are clear
    if (canDrop && nonDraggedGames.length === 0 && !isOccupiedByExtending) {
      setDragOverSlot({ fieldId, timeSlot });
    } else {
      setDragOverSlot(null);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, fieldId: number, timeSlot: string) => {
    console.log(`🔥 [ENHANCED DRAG DROP] DROP EVENT TRIGGERED!`);
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedGame) {
      console.log(`❌ [ENHANCED DRAG DROP] Drop cancelled - no dragged game`);
      return;
    }

    // Get field information for detailed logging
    const targetField = scheduleData?.fields?.find((field: Field) => field.id === fieldId);
    const newStartTime = `${selectedDate}T${timeSlot}:00.000Z`;

    console.log(`\n🎯 [ENHANCED DRAG DROP] Drop Operation Started`);
    console.log(`📋 Game Details:`);
    console.log(`   • Game ID: ${draggedGame.id}`);
    console.log(`   • Match: ${draggedGame.homeTeamName} vs ${draggedGame.awayTeamName}`);
    console.log(`   • Age Group: ${draggedGame.ageGroup}`);
    console.log(`   • Current Field: ${draggedGame.fieldName} (ID: ${draggedGame.fieldId})`);
    console.log(`   • Current Time: ${draggedGame.startTime}`);
    console.log(`📍 New Destination:`);
    console.log(`   • Target Field: ${targetField?.name || 'Unknown'} (ID: ${fieldId})`);
    console.log(`   • Target Time Slot: ${timeSlot}`);
    console.log(`   • Target Full Time: ${newStartTime}`);
    console.log(`   • Target Date: ${selectedDate}`);
    console.log(`🚀 Starting optimistic update and backend mutation...`);
    
    // Optimistic update
    setIsOptimisticUpdate(true);
    setGamePositions(prev => new Map(prev.set(draggedGame.id, { fieldId, startTime: newStartTime })));

    // Update backend
    console.log(`🚀 [ENHANCED DRAG DROP] About to call updateGameMutation.mutate...`);
    try {
      updateGameMutation.mutate({
        gameId: draggedGame.id,
        fieldId,
        startTime: newStartTime
      });
      console.log(`✅ [ENHANCED DRAG DROP] updateGameMutation.mutate called successfully`);
    } catch (error) {
      console.error(`❌ [ENHANCED DRAG DROP] Error calling updateGameMutation:`, error);
    }

    // Clear drag state after mutation starts
    setDraggedGame(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    console.log(`🏁 [ENHANCED DRAG DROP] Drag ended, cleaning up state`);
    setDraggedGame(null);
    setDragOverSlot(null);
  };

  // Update conflicts when games or positions change
  useEffect(() => {
    if (scheduleData?.games) {
      const detectedConflicts = detectConflicts(scheduleData.games);
      setConflicts(detectedConflicts);
    }
  }, [scheduleData?.games, gamePositions, detectConflicts]);

  const timeSlots = generateTimeSlots();
  const fields = scheduleData?.fields || [];
  const games = scheduleData?.games || [];
  
  // Debug field data visibility
  console.log('🎯 [FIELD DEBUG] All available fields:', fields.map((f: Field) => ({ id: f.id, name: f.name, fieldSize: f.fieldSize })));
  
  // Debug which fields have games assigned
  const fieldsWithGames = new Set(games.map((g: Game) => g.fieldId));
  console.log('🎯 [FIELD DEBUG] Fields with games assigned:', Array.from(fieldsWithGames));
  
  // Debug field name mapping
  fields.forEach((field: Field) => {
    const gamesOnField = games.filter((g: Game) => g.fieldId === field.id);
    if (gamesOnField.length > 0) {
      console.log(`🎯 [FIELD DEBUG] Field ${field.id} (${field.name}) has ${gamesOnField.length} games`);
    }
  });

  console.log('🎯 [ENHANCED DRAG DROP] Debug Info:', {
    isLoading,
    error,
    scheduleData,
    fieldsCount: fields.length,
    gamesCount: games.length,
    selectedDate
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading enhanced scheduler...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('🚨 [ENHANCED DRAG DROP] API Error:', error);
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading schedule data</p>
            <p className="text-sm mt-2">{error.message}</p>
            <p className="text-xs mt-1 text-slate-400">Check console for details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no data but not loading
  if (!isLoading && (!scheduleData || (fields.length === 0 && games.length === 0))) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-yellow-600">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>No schedule data available</p>
            <p className="text-sm mt-2">Generate some games first using the Quick Generator</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scheduling Constraints Manager */}
      <SchedulingConstraintsManager eventId={Number(eventId)} />

      {/* Header Controls */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Enhanced Schedule Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Date Selection */}
            <div className="flex items-center gap-2">
              <label className="text-slate-200 text-sm">Date:</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Interval Selection */}
            <div className="flex items-center gap-2">
              <label className="text-slate-200 text-sm">Time Intervals:</label>
              <Select value={timeInterval.toString()} onValueChange={(value: string) => setTimeInterval(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Intelligent Gap-Filling Optimizer */}
            <GapFillingOptimizer eventId={eventId} selectedDate={selectedDate} />

            {/* Status Indicators */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Conflict</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-orange-600 bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Schedule Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conflicts.slice(0, 5).map((conflict, index) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  conflict.severity === 'error' ? 'bg-red-900/30 text-red-200' : 'bg-yellow-900/30 text-yellow-200'
                }`}>
                  {conflict.message}
                </div>
              ))}
              {conflicts.length > 5 && (
                <div className="text-orange-300 text-sm">+ {conflicts.length - 5} more conflicts</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Schedule Grid - {selectedDate} ({timeInterval} min intervals) - Times Horizontal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={gridRef} className="overflow-auto max-h-[800px]">
            <div className="grid gap-1" style={{ gridTemplateRows: `60px repeat(${fields.length}, 60px)`, gridTemplateColumns: `150px repeat(${timeSlots.length}, 120px)` }}>
              {/* Header Row */}
              <div className="sticky left-0 bg-slate-700 p-3 border border-slate-600 font-medium text-slate-200">
                Field
              </div>
              {timeSlots.map((slot: TimeSlot) => (
                <div
                  key={slot.id}
                  className="sticky top-0 bg-slate-700 p-2 border border-slate-600 text-center"
                >
                  <div className="font-medium text-white text-xs">{slot.displayTime}</div>
                </div>
              ))}

              {/* Field Rows */}
              {fields.map((field: Field) => (
                <React.Fragment key={field.id}>
                  {/* Field Label */}
                  <div className="sticky left-0 bg-slate-750 p-2 border border-slate-600 text-slate-300 text-sm font-medium">
                    <div className="font-medium text-white">{field.name}</div>
                    <div className="text-xs text-slate-300">{field.fieldSize}</div>
                  </div>

                  {/* Time Slot Columns */}
                  {timeSlots.map((slot: TimeSlot) => {
                    const games = getGamesForSlot(field.id, slot);
                    const isOccupiedByExtendingGame = isSlotOccupiedByExtendingGame(field.id, slot);
                    const hasConflict = conflicts.some(c => 
                      games.some(game => c.gameIds.includes(game.id))
                    );
                    const hasTeamConflict = conflicts.some(c => 
                      c.type === 'team_conflict' && c.severity === 'error' &&
                      games.some(game => c.gameIds.includes(game.id))
                    );
                    const hasWarningConflict = conflicts.some(c => 
                      c.severity === 'warning' && 
                      games.some(game => c.gameIds.includes(game.id))
                    );
                    const isDragOver = dragOverSlot?.fieldId === field.id && dragOverSlot?.timeSlot === slot.startTime;

                    return (
                      <div
                        key={`${field.id}-${slot.id}`}
                        className={`
                          min-w-[120px] h-[60px] p-1 border border-slate-600 transition-all duration-200 relative cursor-pointer
                          ${games.length > 0 ? 'bg-blue-900/30' : isOccupiedByExtendingGame ? 'bg-blue-900/20' : 'bg-slate-800'}
                          ${hasTeamConflict ? 'bg-red-900/40 border-red-500 border-2' : hasWarningConflict ? 'bg-yellow-900/30 border-yellow-500' : ''}
                          ${isDragOver ? 'bg-green-900/50 border-green-400 border-2 shadow-lg shadow-green-500/25 scale-105' : ''}
                          ${isOccupiedByExtendingGame ? 'border-blue-400/50' : ''}
                          ${draggedGame && games.length === 0 && !isOccupiedByExtendingGame ? 'hover:bg-green-900/20 hover:border-green-600' : 'hover:bg-slate-700/50'}
                        `}
                        onDragOver={(e) => handleDragOver(e, field.id, slot.startTime)}
                        onDrop={(e) => handleDrop(e, field.id, slot.startTime)}
                        onDragLeave={() => setDragOverSlot(null)}
                      >
                        {games.map((game) => {
                          const isBeingDragged = draggedGame?.id === game.id;
                          const gameConflicts = conflicts.filter(c => c.gameIds.includes(game.id));
                          const gameSpanSlots = calculateGameSpanSlots(game);
                          const totalDuration = calculateTotalGameDuration(game);
                          
                          // Calculate the width to span multiple time slots horizontally
                          const slotWidth = 120; // Base width of each time slot in pixels (increased for better text fit)
                          const gameWidth = (gameSpanSlots * slotWidth) - 4; // Subtract 4px for gap
                          
                          return (
                            <div
                              key={game.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, game)}
                              onDragEnd={handleDragEnd}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                // Create right-click context menu for game operations
                                const contextMenu = document.createElement('div');
                                contextMenu.className = 'fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 min-w-48';
                                contextMenu.innerHTML = `
                                  <div class="text-sm font-medium text-white mb-2 px-2 py-1">
                                    ${game.homeTeamName} vs ${game.awayTeamName}
                                  </div>
                                  <div class="border-t border-slate-600 mb-2"></div>
                                  ${availableDays.map(day => `
                                    <button class="move-to-day w-full text-left px-2 py-1 text-sm text-slate-200 hover:bg-slate-700 rounded" data-date="${day.value}">
                                      📅 Move to ${day.label}
                                    </button>
                                  `).join('')}
                                  <div class="border-t border-slate-600 my-2"></div>
                                  <button class="close-menu w-full text-left px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 rounded">
                                    ✕ Close
                                  </button>
                                `;
                                contextMenu.style.left = Math.min(e.pageX, window.innerWidth - 200) + 'px';
                                contextMenu.style.top = Math.min(e.pageY, window.innerHeight - 150) + 'px';
                                contextMenu.id = `context-menu-${game.id}`;
                                
                                // Add click handlers
                                contextMenu.addEventListener('click', (event) => {
                                  const target = event.target as HTMLElement;
                                  if (target.classList.contains('move-to-day')) {
                                    const newDate = target.getAttribute('data-date');
                                    if (newDate) {
                                      moveGameToDay(game, newDate);
                                    }
                                  }
                                  contextMenu.remove();
                                });
                                
                                // Remove existing menus
                                document.querySelectorAll('[id^="context-menu-"]').forEach(menu => menu.remove());
                                document.body.appendChild(contextMenu);
                                
                                // Remove menu when clicking elsewhere
                                const removeMenu = () => {
                                  contextMenu.remove();
                                  document.removeEventListener('click', removeMenu);
                                };
                                setTimeout(() => document.addEventListener('click', removeMenu), 100);
                              }}
                              className={`
                                p-2 rounded cursor-move text-xs transition-all absolute z-10
                                ${isBeingDragged ? 'opacity-50 scale-95' : 'opacity-100'}
                                ${gameConflicts.length > 0 
                                  ? gameConflicts.some(c => c.severity === 'error') 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-yellow-600 text-white'
                                  : 'bg-blue-600 text-white'
                                }
                                hover:scale-105 hover:shadow-lg
                              `}
                              style={{
                                width: `${gameWidth}px`,
                                height: 'calc(100% - 8px)',
                                top: '2px',
                                left: '2px'
                              }}
                              onMouseEnter={(e) => {
                                // Enhanced popup with club, coaches, round info after 0.5s
                                let timeoutId: NodeJS.Timeout;
                                timeoutId = setTimeout(() => {
                                  const tooltip = document.createElement('div');
                                  tooltip.className = 'fixed z-50 bg-slate-800/95 backdrop-blur-sm text-white text-sm p-4 rounded-lg shadow-xl border border-slate-600 max-w-md';
                                  tooltip.innerHTML = `
                                    <div class="font-bold text-blue-300 mb-2">${game.homeTeamName} vs ${game.awayTeamName}</div>
                                    <div class="grid grid-cols-2 gap-2 text-xs text-slate-200">
                                      <div><span class="text-slate-400">Field:</span> ${field.name}</div>
                                      <div><span class="text-slate-400">Complex:</span> ${field.complexName || 'Standard'}</div>
                                      <div><span class="text-slate-400">Age Group:</span> ${game.ageGroup}</div>
                                      <div><span class="text-slate-400">Flight:</span> ${game.bracketName || 'Standard'}</div>
                                      <div><span class="text-slate-400">Round:</span> ${(game as any).round || 1}</div>
                                      <div><span class="text-slate-400">Duration:</span> ${totalDuration} min</div>
                                    </div>
                                    ${game.homeTeamCoach || game.awayTeamCoach ? `
                                      <div class="mt-2 pt-2 border-t border-slate-600 text-xs">
                                        ${game.homeTeamCoach ? `<div><span class="text-slate-400">Home Coach:</span> ${game.homeTeamCoach}</div>` : ''}
                                        ${game.awayTeamCoach ? `<div><span class="text-slate-400">Away Coach:</span> ${game.awayTeamCoach}</div>` : ''}
                                      </div>
                                    ` : ''}
                                    <div class="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-400">
                                      💡 Drag to reschedule • Right-click to move between days
                                    </div>
                                  `;
                                  tooltip.style.left = Math.min(e.pageX + 15, window.innerWidth - 320) + 'px';
                                  tooltip.style.top = Math.max(e.pageY - 10, 10) + 'px';
                                  tooltip.id = `tooltip-${game.id}`;
                                  document.body.appendChild(tooltip);
                                }, 500); // 0.5 second delay
                                
                                // Store timeout to clear on leave
                                (e.target as any).__tooltipTimeout = timeoutId;
                              }}
                              onMouseLeave={(e) => {
                                // Clear timeout and remove tooltip
                                if ((e.target as any).__tooltipTimeout) {
                                  clearTimeout((e.target as any).__tooltipTimeout);
                                }
                                const tooltip = document.getElementById(`tooltip-${game.id}`);
                                if (tooltip) tooltip.remove();
                              }}
                              onMouseMove={(e) => {
                                const tooltip = document.getElementById(`tooltip-${game.id}`);
                                if (tooltip) {
                                  tooltip.style.left = Math.min(e.pageX + 15, window.innerWidth - 320) + 'px';
                                  tooltip.style.top = Math.max(e.pageY - 10, 10) + 'px';
                                }
                              }}
                            >
                              <div className="flex flex-col justify-between h-full">
                                <div className="flex-1 overflow-hidden">
                                  <div className="font-medium text-xs leading-tight">
                                    {/* Compressed team names that fit properly */}
                                    <div className="truncate text-blue-100">{(game.homeTeamName || 'TBD').slice(0, 20)}</div>
                                    <div className="text-slate-300 text-center my-0.5 text-xs">vs</div>
                                    <div className="truncate text-blue-100">{(game.awayTeamName || 'TBD').slice(0, 20)}</div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-1">
                                  <div className="text-xs opacity-80 font-bold">
                                    {game.ageGroup?.replace(/[^\dUB]/g, '') || 'U?'}
                                  </div>
                                  
                                  {/* Status and conflict indicators */}
                                  <div className="flex items-center gap-1">
                                    {gameConflicts.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="text-xs">{gameConflicts.length}</span>
                                      </div>
                                    )}
                                    <div className="text-xs">
                                      {hasWinnerPlaceholder(game) ? '🏆' : '⚽'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Drop Zone Indicator */}
                        {games.length === 0 && isDragOver && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-green-300 text-sm font-medium">Drop here</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-slate-600 bg-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">How to Use</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Drag games between time slots and fields</li>
                <li>• Game boxes span horizontally across time duration</li>
                <li>• Times run horizontally, fields are vertical</li>
                <li>• Use 5/10/15 minute intervals for precise timing</li>
                <li>• Conflicts are highlighted in red/yellow</li>
                <li>• Changes are saved automatically</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Conflict Types</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• <span className="text-red-300">Red:</span> Coach conflicts (critical)</li>
                <li>• <span className="text-yellow-300">Yellow:</span> Team rest period issues</li>
                <li>• <span className="text-blue-300">Blue:</span> Normal scheduled games</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}