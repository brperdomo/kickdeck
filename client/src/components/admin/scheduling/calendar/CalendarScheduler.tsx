// ─── CalendarScheduler — Root orchestrator for the calendar view ────────────

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { LayoutMode, FlightFilter } from './calendarTypes';
import { computeSmartInterval, generateTimeSlots, getFlightColor } from './calendarUtils';
import { useCalendarData } from './useCalendarData';
import { useConflictDetection } from './useConflictDetection';
import { useDragDrop } from './useDragDrop';
import { CalendarToolbar } from './CalendarToolbar';
import { VerticalGrid } from './VerticalGrid';
import { HorizontalGrid } from './HorizontalGrid';
import { UnscheduledSidebar } from './UnscheduledSidebar';
import { ConflictBanner } from './ConflictBanner';

interface CalendarSchedulerProps {
  eventId: string;
}

export function CalendarScheduler({ eventId }: CalendarSchedulerProps) {
  // ── Data ────────────────────────────────────────────────────────────────
  const {
    games,
    fields,
    flightNames,
    availableDates,
    flightConfigs,
    isLoading,
    error,
  } = useCalendarData(eventId);

  // ── Local state ─────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState('');
  const [layout, setLayout] = useState<LayoutMode>('vertical');
  const [interval, setInterval] = useState<number>(0); // 0 = auto
  const [flightFilters, setFlightFilters] = useState<FlightFilter[]>([]);

  // Initialize selected date when dates are available
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].value);
    }
  }, [availableDates, selectedDate]);

  // Initialize flight filters when flight names change
  useEffect(() => {
    if (flightNames.length > 0 && flightFilters.length === 0) {
      setFlightFilters(
        flightNames.map((name) => ({
          flightName: name,
          color: getFlightColor(name),
          visible: true,
        })),
      );
    }
  }, [flightNames, flightFilters.length]);

  // ── Computed values ─────────────────────────────────────────────────────
  const smartInterval = useMemo(() => computeSmartInterval(games), [games]);
  const activeInterval = interval === 0 ? smartInterval : interval;

  // Filter games by visible flights
  const visibleFlights = new Set(
    flightFilters.filter((f) => f.visible).map((f) => f.flightName),
  );
  const visibleGames = useMemo(
    () =>
      flightFilters.length === 0
        ? games
        : games.filter((g) => visibleFlights.has(g.flightName)),
    [games, flightFilters, visibleFlights],
  );

  // Generate time slots for the selected day
  const slots = useMemo(
    () => generateTimeSlots(activeInterval, selectedDate, visibleGames),
    [activeInterval, selectedDate, visibleGames],
  );

  // Only show fields that have games on the selected date (or all if no games)
  const activeFields = useMemo(() => {
    const dayGames = visibleGames.filter((g) => {
      const d = g.startTime?.split('T')[0] || g.date;
      return d === selectedDate && g.fieldId;
    });
    const fieldIds = new Set(dayGames.map((g) => g.fieldId));
    const active = fields.filter((f) => fieldIds.has(f.id));
    return active.length > 0 ? active : fields.slice(0, 6); // fallback to first 6
  }, [fields, visibleGames, selectedDate]);

  // ── Conflict detection ──────────────────────────────────────────────────
  const { conflicts, gameConflicts } = useConflictDetection({
    games: visibleGames,
    selectedDate,
    flightConfigs,
  });

  // ── Drag-and-drop ──────────────────────────────────────────────────────
  const {
    dragState,
    dropTarget,
    isDragging,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  } = useDragDrop({ eventId });

  // ── Highlighted games (from conflict banner clicks) ─────────────────────
  const [highlightedGameIds, setHighlightedGameIds] = useState<Set<number>>(new Set());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHighlightGames = useCallback((gameIds: number[]) => {
    // Clear any existing timer
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    const ids = new Set(gameIds);
    setHighlightedGameIds(ids);

    // Scroll to the first highlighted game
    requestAnimationFrame(() => {
      const firstId = gameIds[0];
      if (firstId != null) {
        const el = document.querySelector(`[data-game-id="${firstId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    });

    // Auto-clear after 4 seconds
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedGameIds(new Set());
    }, 4000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // ── Flight filter toggle ────────────────────────────────────────────────
  const handleFlightFilterToggle = (flightName: string) => {
    setFlightFilters((prev) =>
      prev.map((f) =>
        f.flightName === flightName ? { ...f, visible: !f.visible } : f,
      ),
    );
  };

  // ── Loading / Error ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span className="text-sm">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <span className="text-sm">Failed to load schedule: {(error as Error).message}</span>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
        <p className="text-sm">No games found for this event.</p>
        <p className="text-xs text-slate-500">Generate a schedule first from the Setup tab.</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const gridProps = {
    fields: activeFields,
    games: visibleGames,
    slots,
    selectedDate,
    interval: activeInterval,
    gameConflicts,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    dropTarget,
    isDragging,
    draggedGame: dragState.game,
    highlightedGameIds,
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <CalendarToolbar
        selectedDate={selectedDate}
        availableDates={availableDates}
        onDateChange={setSelectedDate}
        layout={layout}
        onLayoutChange={setLayout}
        interval={interval === 0 ? activeInterval : interval}
        onIntervalChange={setInterval}
        flightFilters={flightFilters}
        onFlightFilterToggle={handleFlightFilterToggle}
      />

      {/* Conflict banner */}
      <ConflictBanner conflicts={conflicts} onHighlightGames={handleHighlightGames} />

      {/* Main content: grid + sidebar */}
      <div className="flex flex-1 min-h-0 gap-0 rounded-lg overflow-hidden">
        {/* Grid area */}
        <div className="flex-1 min-w-0 overflow-auto">
          {layout === 'vertical' ? (
            <VerticalGrid {...gridProps} />
          ) : (
            <HorizontalGrid {...gridProps} />
          )}
        </div>

        {/* Unscheduled games sidebar */}
        <UnscheduledSidebar
          games={games}
          gameConflicts={gameConflicts}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500 px-1">
        <span>{games.length} total games</span>
        <span>{visibleGames.filter((g) => g.fieldId && g.startTime).length} scheduled</span>
        <span>{games.filter((g) => !g.fieldId || !g.startTime).length} unscheduled</span>
        <span>{activeFields.length} fields</span>
        <span>Interval: {activeInterval}min</span>
      </div>
    </div>
  );
}
