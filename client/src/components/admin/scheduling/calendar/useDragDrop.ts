// ─── Drag-and-Drop Hook ─────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarGame, DragState, DropTarget } from './calendarTypes';
import { useToast } from '@/hooks/use-toast';

interface DragDropOptions {
  eventId: string;
}

export function useDragDrop({ eventId }: DragDropOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dragState, setDragState] = useState<DragState>({
    game: null,
    originFieldId: null,
    originSlot: null,
  });

  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // ── Reschedule mutation ───────────────────────────────────────────────────
  const rescheduleMutation = useMutation({
    mutationFn: async ({
      gameId,
      fieldId,
      startTime,
    }: {
      gameId: number;
      fieldId: number;
      startTime: string; // ISO
    }) => {
      const res = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId, startTime, eventId }),
      });
      if (!res.ok) throw new Error('Failed to reschedule game');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate schedule data so the grid refreshes
      queryClient.invalidateQueries({ queryKey: ['schedule-calendar', eventId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      toast({
        title: 'Game rescheduled',
        description: 'Game has been moved successfully.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Reschedule failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDragStart = useCallback(
    (game: CalendarGame, e: React.DragEvent) => {
      setDragState({
        game,
        originFieldId: game.fieldId,
        originSlot: game.startTime,
      });

      // Set drag data for HTML5 DnD
      e.dataTransfer.setData('text/plain', String(game.id));
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const onDragOver = useCallback(
    (target: DropTarget, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(target);
    },
    [],
  );

  const onDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const onDrop = useCallback(
    (target: DropTarget, e: React.DragEvent) => {
      e.preventDefault();
      setDropTarget(null);

      const game = dragState.game;
      if (!game) return;

      // Build ISO start time
      const startTimeISO = `${target.date}T${target.startTime}:00`;

      rescheduleMutation.mutate({
        gameId: game.id,
        fieldId: target.fieldId,
        startTime: startTimeISO,
      });

      setDragState({ game: null, originFieldId: null, originSlot: null });
    },
    [dragState.game, rescheduleMutation],
  );

  const onDragEnd = useCallback(() => {
    setDragState({ game: null, originFieldId: null, originSlot: null });
    setDropTarget(null);
  }, []);

  return {
    dragState,
    dropTarget,
    isDragging: dragState.game !== null,
    isRescheduling: rescheduleMutation.isPending,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  };
}
