// ─── GameCard — Reusable, flight-colored game card ──────────────────────────

import React from 'react';
import { AlertTriangle, GripVertical } from 'lucide-react';
import type { CalendarGame, ConflictInfo } from './calendarTypes';
import { formatDisplayTime, extractTime } from './calendarUtils';

interface GameCardProps {
  game: CalendarGame;
  conflicts?: ConflictInfo[];
  /** "vertical" cards are taller; "horizontal" cards are wider */
  variant: 'vertical' | 'horizontal' | 'sidebar';
  onDragStart?: (game: CalendarGame, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  /** Whether this card is highlighted from a conflict banner click */
  isHighlighted?: boolean;
  /** Pixel height — only for vertical variant (set by grid) */
  style?: React.CSSProperties;
  className?: string;
}

export function GameCard({
  game,
  conflicts = [],
  variant,
  onDragStart,
  onDragEnd,
  isDragging,
  isHighlighted = false,
  style,
  className = '',
}: GameCardProps) {
  const { flightColor } = game;
  const hasConflict = conflicts.length > 0;
  const hasError = conflicts.some((c) => c.severity === 'error');

  const timeStr =
    game.time !== 'TBD'
      ? formatDisplayTime(game.time)
      : '';

  const endMinutes =
    game.startTime
      ? (() => {
          const t = game.startTime!.includes('T')
            ? game.startTime!.split('T')[1]
            : game.startTime!;
          const [h, m] = t.split(':').map(Number);
          const total = h * 60 + m + game.duration;
          const eh = Math.floor(total / 60) % 24;
          const em = total % 60;
          return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
        })()
      : '';

  const endTimeStr = endMinutes ? formatDisplayTime(endMinutes) : '';

  // Tooltip text
  const title = [
    `Game #${game.id}`,
    `${game.homeTeamName} vs ${game.awayTeamName}`,
    game.flightName ? `Flight: ${game.flightName}` : '',
    game.ageGroup ? `Age: ${game.ageGroup}` : '',
    timeStr && endTimeStr ? `Time: ${timeStr} – ${endTimeStr}` : '',
    game.fieldName !== 'Unassigned' ? `Field: ${game.fieldName}` : '',
    game.homeTeamCoach ? `Home Coach: ${game.homeTeamCoach}` : '',
    game.awayTeamCoach ? `Away Coach: ${game.awayTeamCoach}` : '',
    game.round ? `Round: ${game.round}` : '',
    ...conflicts.map((c) => `⚠ ${c.message}`),
  ]
    .filter(Boolean)
    .join('\n');

  // ── Sidebar variant (compact, full width) ─────────────────────────────────
  if (variant === 'sidebar') {
    return (
      <div
        draggable
        data-game-id={game.id}
        onDragStart={(e) => onDragStart?.(game, e)}
        onDragEnd={onDragEnd}
        title={title}
        className={`
          group relative cursor-grab active:cursor-grabbing
          rounded-md border-l-3 px-2.5 py-2
          ${flightColor.bg} ${flightColor.border}
          hover:brightness-125 transition-all duration-150
          ${isDragging ? 'opacity-40' : ''}
          ${isHighlighted ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30 animate-pulse z-30' : ''}
          ${className}
        `}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${flightColor.text} truncate`}>
              {game.homeTeamName} vs {game.awayTeamName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {game.flightName} &middot; {game.ageGroup}
            </p>
          </div>
          {hasConflict && (
            <AlertTriangle
              size={12}
              className={hasError ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Vertical variant ──────────────────────────────────────────────────────
  if (variant === 'vertical') {
    return (
      <div
        draggable
        data-game-id={game.id}
        onDragStart={(e) => onDragStart?.(game, e)}
        onDragEnd={onDragEnd}
        title={title}
        style={style}
        className={`
          group absolute left-0.5 right-0.5 cursor-grab active:cursor-grabbing
          rounded-md border-l-3 px-2 py-1 overflow-hidden
          ${flightColor.bg} ${flightColor.border}
          hover:brightness-125 hover:z-20 transition-all duration-150
          ${isDragging ? 'opacity-40 scale-95' : ''}
          ${isHighlighted ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30 animate-pulse z-30' : hasConflict ? 'ring-1 ring-offset-0' : ''}
          ${!isHighlighted && hasError ? 'ring-red-500/50' : !isHighlighted && hasConflict ? 'ring-amber-500/30' : ''}
          ${className}
        `}
      >
        {/* Drag handle appears on hover */}
        <GripVertical
          size={10}
          className="absolute top-1 right-0.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
        />

        <div className="flex flex-col gap-0.5 min-h-0">
          {/* Team names */}
          <p className={`text-[11px] font-semibold leading-tight ${flightColor.text} truncate`}>
            {game.homeTeamName}
          </p>
          <p className="text-[10px] text-slate-500 leading-none">vs</p>
          <p className={`text-[11px] font-semibold leading-tight ${flightColor.text} truncate`}>
            {game.awayTeamName}
          </p>

          {/* Time range */}
          {timeStr && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}
            </p>
          )}

          {/* Flight badge */}
          <span
            className={`inline-block mt-0.5 px-1 py-0 rounded text-[9px] font-medium text-white ${flightColor.badge} max-w-fit truncate`}
          >
            {game.flightName}
          </span>
        </div>

        {/* Conflict icon */}
        {hasConflict && (
          <AlertTriangle
            size={11}
            className={`absolute bottom-1 right-1 ${hasError ? 'text-red-400' : 'text-amber-400'}`}
          />
        )}
      </div>
    );
  }

  // ── Horizontal variant ────────────────────────────────────────────────────
  return (
    <div
      draggable
      data-game-id={game.id}
      onDragStart={(e) => onDragStart?.(game, e)}
      onDragEnd={onDragEnd}
      title={title}
      style={style}
      className={`
        group absolute top-0.5 bottom-0.5 cursor-grab active:cursor-grabbing
        rounded-md border-l-3 px-2 py-1 overflow-hidden
        ${flightColor.bg} ${flightColor.border}
        hover:brightness-125 hover:z-20 transition-all duration-150
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${isHighlighted ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30 animate-pulse z-30' : hasConflict ? 'ring-1 ring-offset-0' : ''}
        ${!isHighlighted && hasError ? 'ring-red-500/50' : !isHighlighted && hasConflict ? 'ring-amber-500/30' : ''}
        ${className}
      `}
    >
      <GripVertical
        size={10}
        className="absolute top-1 right-0.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="flex items-center gap-2 h-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold ${flightColor.text} truncate`}>
            {game.homeTeamName} vs {game.awayTeamName}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {timeStr && `${timeStr} – ${endTimeStr}`}
            {game.fieldName !== 'Unassigned' && ` · ${game.fieldName}`}
          </p>
        </div>

        <span
          className={`shrink-0 px-1 py-0 rounded text-[9px] font-medium text-white ${flightColor.badge}`}
        >
          {game.flightName}
        </span>

        {hasConflict && (
          <AlertTriangle
            size={11}
            className={`shrink-0 ${hasError ? 'text-red-400' : 'text-amber-400'}`}
          />
        )}
      </div>
    </div>
  );
}
