// ─── Horizontal Grid — Fields as rows, time flows left-to-right ─────────────

import React, { useRef } from 'react';
import type { CalendarGame, CalendarField, CalendarSlot, ConflictInfo, DropTarget } from './calendarTypes';
import { timeToMinutes } from './calendarUtils';
import { GameCard } from './GameCard';

interface HorizontalGridProps {
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

const COL_WIDTH = 100; // px per time slot column
const ROW_HEIGHT = 72; // px per field row
const FIELD_LABEL_WIDTH = 140; // px for field name column

export function HorizontalGrid({
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
}: HorizontalGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const dayGames = games.filter((g) => {
    const d = g.startTime?.split('T')[0] || g.date;
    return d === selectedDate && g.fieldId !== null && g.startTime;
  });

  const firstSlotMinutes = slots.length > 0 ? slots[0].minutes : 0;
  const totalSlotsWidth = slots.length * COL_WIDTH;

  /** Calculate pixel offset and width for a game card within the time-slot area */
  function gameStyle(game: CalendarGame): React.CSSProperties {
    const startMin = timeToMinutes(game.startTime);
    const offset = startMin - firstSlotMinutes;
    const left = (offset / interval) * COL_WIDTH;
    const width = (game.duration / interval) * COL_WIDTH;
    return {
      left: `${left}px`,
      width: `${Math.max(width, COL_WIDTH * 0.8)}px`,
    };
  }

  /** Find which time slot a pixel X offset falls in */
  function getSlotForX(x: number): string | null {
    const slotIndex = Math.floor(x / COL_WIDTH);
    if (slotIndex >= 0 && slotIndex < slots.length) {
      return slots[slotIndex].startTime;
    }
    return null;
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-700" ref={gridRef}>
      {/* Time header row */}
      <div className="flex sticky top-0 z-30">
        {/* Corner cell */}
        <div
          className="shrink-0 sticky left-0 z-40 bg-slate-800 border-b border-r border-slate-700"
          style={{ width: FIELD_LABEL_WIDTH }}
        />
        {/* Time slot headers */}
        <div className="flex">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="shrink-0 bg-slate-800 border-b border-l border-slate-700 text-center py-2"
              style={{ width: COL_WIDTH }}
            >
              <span className="text-[10px] text-slate-400 select-none">
                {slot.displayTime}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Field rows */}
      {fields.map((field) => {
        const fieldGames = dayGames.filter((g) => g.fieldId === field.id);

        return (
          <div key={field.id} className="flex" style={{ height: ROW_HEIGHT }}>
            {/* Field label — sticky left */}
            <div
              className="shrink-0 sticky left-0 z-20 bg-slate-800 border-b border-r border-slate-700 px-3 flex flex-col justify-center"
              style={{ width: FIELD_LABEL_WIDTH }}
            >
              <p className="text-xs font-semibold text-white truncate">{field.name}</p>
              <p className="text-[10px] text-slate-400">{field.fieldSize}</p>
            </div>

            {/* Time slots area — relative container for absolute game cards */}
            <div
              className="relative"
              style={{ width: totalSlotsWidth }}
            >
              {/* Slot grid lines (also serve as drop targets) */}
              <div className="absolute inset-0 flex">
                {slots.map((slot) => {
                  const isTarget =
                    dropTarget?.fieldId === field.id &&
                    dropTarget?.startTime === slot.startTime;

                  return (
                    <div
                      key={`${field.id}-${slot.id}`}
                      className={`
                        shrink-0 h-full border-l border-b border-slate-700/30
                        transition-colors duration-100
                        ${isDragging ? 'hover:bg-blue-500/10' : ''}
                        ${isTarget ? 'bg-blue-500/20 ring-1 ring-inset ring-blue-400/50' : ''}
                      `}
                      style={{ width: COL_WIDTH }}
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
              </div>

              {/* Game cards — absolutely positioned, can span across slot boundaries */}
              {fieldGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  conflicts={gameConflicts.get(game.id) || []}
                  variant="horizontal"
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDragging={draggedGame?.id === game.id}
                  isHighlighted={highlightedGameIds.has(game.id)}
                  style={gameStyle(game)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
