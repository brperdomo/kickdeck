// ─── Vertical Grid — Fields as columns, time flows top-to-bottom ────────────

import React, { useRef } from 'react';
import type { CalendarGame, CalendarField, CalendarSlot, ConflictInfo, DropTarget } from './calendarTypes';
import { timeToMinutes } from './calendarUtils';
import { GameCard } from './GameCard';

interface VerticalGridProps {
  fields: CalendarField[];
  games: CalendarGame[];
  slots: CalendarSlot[];
  selectedDate: string;
  interval: number;
  gameConflicts: Map<number, ConflictInfo[]>;
  // Drag-and-drop
  onDragStart: (game: CalendarGame, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (target: DropTarget, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (target: DropTarget, e: React.DragEvent) => void;
  dropTarget: DropTarget | null;
  isDragging: boolean;
  draggedGame: CalendarGame | null;
  highlightedGameIds: Set<number>;
}

const ROW_HEIGHT = 48; // px per interval row

export function VerticalGrid({
  fields,
  games,
  slots,
  selectedDate,
  interval,
  gameConflicts,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dropTarget,
  isDragging,
  draggedGame,
  highlightedGameIds,
}: VerticalGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Only show games on the selected date that have field assignments
  const dayGames = games.filter((g) => {
    const d = g.startTime?.split('T')[0] || g.date;
    return d === selectedDate && g.fieldId !== null && g.startTime;
  });

  const firstSlotMinutes = slots.length > 0 ? slots[0].minutes : 0;

  /** Calculate pixel offset and height for a game card */
  function gameStyle(game: CalendarGame): React.CSSProperties {
    const startMin = timeToMinutes(game.startTime);
    const offset = startMin - firstSlotMinutes;
    const top = (offset / interval) * ROW_HEIGHT;
    const height = (game.duration / interval) * ROW_HEIGHT;
    return {
      top: `${top}px`,
      height: `${Math.max(height, ROW_HEIGHT * 0.8)}px`,
    };
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-700" ref={gridRef}>
      <div
        className="grid min-w-fit"
        style={{
          gridTemplateColumns: `64px repeat(${fields.length}, minmax(160px, 1fr))`,
        }}
      >
        {/* ── Header row: empty corner + field names ─────────────────────── */}
        <div className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 p-2" />
        {fields.map((field) => (
          <div
            key={field.id}
            className="sticky top-0 z-30 bg-slate-800 border-b border-l border-slate-700 px-2 py-2 text-center"
          >
            <p className="text-xs font-semibold text-white truncate">{field.name}</p>
            <p className="text-[10px] text-slate-400">{field.fieldSize}</p>
          </div>
        ))}

        {/* ── Time gutter + field columns ─────────────────────────────────── */}
        {/* Time labels column */}
        <div className="relative">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-start justify-end pr-2 border-b border-slate-700/50"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              <span className="text-[10px] text-slate-500 -mt-1.5 select-none">
                {slot.displayTime}
              </span>
            </div>
          ))}
        </div>

        {/* Field columns — each is a relative container for absolute game cards */}
        {fields.map((field) => {
          const fieldGames = dayGames.filter((g) => g.fieldId === field.id);

          return (
            <div key={field.id} className="relative border-l border-slate-700">
              {/* Slot grid lines (drop targets) */}
              {slots.map((slot) => {
                const isTarget =
                  dropTarget?.fieldId === field.id &&
                  dropTarget?.startTime === slot.startTime;

                return (
                  <div
                    key={slot.id}
                    className={`
                      border-b border-slate-700/30
                      transition-colors duration-100
                      ${isDragging ? 'hover:bg-blue-500/10' : ''}
                      ${isTarget ? 'bg-blue-500/20 ring-1 ring-inset ring-blue-400/50' : ''}
                    `}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onDragOver={(e) =>
                      onDragOver(
                        { fieldId: field.id, startTime: slot.startTime, date: selectedDate },
                        e,
                      )
                    }
                    onDragLeave={onDragLeave}
                    onDrop={(e) =>
                      onDrop(
                        { fieldId: field.id, startTime: slot.startTime, date: selectedDate },
                        e,
                      )
                    }
                  />
                );
              })}

              {/* Absolutely-positioned game cards */}
              {fieldGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  conflicts={gameConflicts.get(game.id) || []}
                  variant="vertical"
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDragging={draggedGame?.id === game.id}
                  isHighlighted={highlightedGameIds.has(game.id)}
                  style={gameStyle(game)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
