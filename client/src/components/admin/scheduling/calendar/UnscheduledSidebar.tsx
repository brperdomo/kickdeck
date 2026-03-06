// ─── Unscheduled Sidebar — collapsible list of unassigned games ──────────────

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CalendarX } from 'lucide-react';
import type { CalendarGame, ConflictInfo } from './calendarTypes';
import { GameCard } from './GameCard';

interface UnscheduledSidebarProps {
  games: CalendarGame[];
  gameConflicts: Map<number, ConflictInfo[]>;
  onDragStart: (game: CalendarGame, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function UnscheduledSidebar({
  games,
  gameConflicts,
  onDragStart,
  onDragEnd,
}: UnscheduledSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Unscheduled = no field or no startTime
  const unscheduled = games.filter(
    (g) => !g.fieldId || !g.startTime || g.date === 'TBD',
  );

  if (unscheduled.length === 0) return null;

  return (
    <div
      className={`
        shrink-0 border-l border-slate-700 bg-slate-800/50
        transition-all duration-200 flex flex-col
        ${isOpen ? 'w-60' : 'w-10'}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-3 text-slate-400 hover:text-white transition-colors border-b border-slate-700"
      >
        {isOpen ? (
          <>
            <ChevronRight size={14} />
            <span className="text-xs font-medium">Unscheduled</span>
            <span className="ml-auto text-[10px] bg-slate-700 text-slate-300 rounded-full px-1.5 py-0.5">
              {unscheduled.length}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 w-full">
            <ChevronLeft size={14} />
            <CalendarX size={14} />
            <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-1.5 py-0.5">
              {unscheduled.length}
            </span>
          </div>
        )}
      </button>

      {/* Game list */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {unscheduled.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              conflicts={gameConflicts.get(game.id) || []}
              variant="sidebar"
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
