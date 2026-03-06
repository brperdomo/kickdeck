// ─── Calendar Data Hook ─────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  CalendarGame,
  CalendarField,
  ScheduleAPIResponse,
  FlightConfig,
} from './calendarTypes';
import { getFlightColor, resetFlightColors } from './calendarUtils';

export function useCalendarData(eventId: string) {
  // ── Fetch event metadata (dates) ──────────────────────────────────────────
  const eventQuery = useQuery({
    queryKey: ['event-data', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch event data');
      return res.json();
    },
  });

  // ── Fetch schedule calendar data ──────────────────────────────────────────
  const scheduleQuery = useQuery<ScheduleAPIResponse>({
    queryKey: ['schedule-calendar', eventId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/events/${eventId}/schedule-calendar`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to fetch schedule data');
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // ── Fetch flight configurations (for rest periods, max games) ─────────────
  const flightConfigQuery = useQuery<FlightConfig[]>({
    queryKey: ['flight-configurations', eventId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/events/${eventId}/flight-configurations`,
        { credentials: 'include' },
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!eventId,
    retry: false,
  });

  // ── Derive available dates from event ─────────────────────────────────────
  const availableDates = useMemo(() => {
    const event = eventQuery.data;
    if (!event?.startDate || !event?.endDate) return [];

    const dates: { value: string; label: string }[] = [];
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const cur = new Date(start);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const label = cur.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      dates.push({ value: dateStr, label });
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [eventQuery.data]);

  // ── Transform games with flight colors ────────────────────────────────────
  const { games, fields, flightNames } = useMemo(() => {
    const raw = scheduleQuery.data;
    if (!raw) return { games: [] as CalendarGame[], fields: [] as CalendarField[], flightNames: [] as string[] };

    resetFlightColors();

    // Collect unique flight names first for consistent ordering
    const uniqueFlights = new Set<string>();
    raw.games?.forEach((g: any) => {
      const fName = g.flightName || g.bracketName || 'Unassigned';
      uniqueFlights.add(fName);
    });
    const sortedFlightNames = [...uniqueFlights].sort();
    // Pre-assign colors in sorted order for deterministic mapping
    sortedFlightNames.forEach((f) => getFlightColor(f));

    // Deduplicate by game ID
    const seenIds = new Set<number>();
    const transformedGames: CalendarGame[] = [];

    for (const g of raw.games || []) {
      if (seenIds.has(g.id)) continue;
      seenIds.add(g.id);

      const flightName = g.flightName || g.bracketName || 'Unassigned';

      // Build startTime ISO if we have date + time
      let startTimeISO: string | null = g.startTime || null;
      if (!startTimeISO && g.date !== 'TBD' && g.time !== 'TBD') {
        startTimeISO = `${g.date}T${g.time}:00`;
      }

      transformedGames.push({
        id: g.id,
        homeTeamName: g.homeTeam || g.homeTeamName || 'TBD',
        awayTeamName: g.awayTeam || g.awayTeamName || 'TBD',
        homeTeamId: g.homeTeamId || null,
        awayTeamId: g.awayTeamId || null,
        ageGroup: g.ageGroup || 'Unknown',
        fieldId: g.fieldId || null,
        fieldName: g.fieldName || g.field || 'Unassigned',
        startTime: startTimeISO,
        endTime: g.endTime || null,
        date: g.date || 'TBD',
        time: g.time || 'TBD',
        duration: g.duration || 90,
        status: g.status || 'scheduled',
        homeTeamCoach: g.homeTeamCoach || '',
        awayTeamCoach: g.awayTeamCoach || '',
        bracketName: g.bracketName || '',
        bracketId: g.bracketId || null,
        flightName,
        round: g.round || null,
        flightColor: getFlightColor(flightName),
      });
    }

    const transformedFields: CalendarField[] = (raw.fields || []).map(
      (f: any) => ({
        id: f.id,
        name: f.name,
        fieldSize: f.fieldSize || '11v11',
        complexName: f.complexName || 'Unknown',
        isOpen: f.isOpen !== false,
      }),
    );

    return {
      games: transformedGames,
      fields: transformedFields,
      flightNames: sortedFlightNames,
    };
  }, [scheduleQuery.data]);

  return {
    games,
    fields,
    flightNames,
    availableDates,
    flightConfigs: flightConfigQuery.data || [],
    isLoading:
      scheduleQuery.isLoading || eventQuery.isLoading,
    error: scheduleQuery.error || eventQuery.error,
    refetch: scheduleQuery.refetch,
  };
}
