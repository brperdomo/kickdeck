// ─── Conflict Banner — slim collapsible conflict summary ────────────────────

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ConflictInfo } from './calendarTypes';

interface ConflictBannerProps {
  conflicts: ConflictInfo[];
  onHighlightGames?: (gameIds: number[]) => void;
}

export function ConflictBanner({ conflicts, onHighlightGames }: ConflictBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (conflicts.length === 0) return null;

  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  // Group by type for the expanded view
  const grouped = new Map<string, ConflictInfo[]>();
  for (const c of conflicts) {
    const label = CONFLICT_LABELS[c.type] || c.type;
    const list = grouped.get(label) || [];
    list.push(c);
    grouped.set(label, list);
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      {/* Summary bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/30 transition-colors"
      >
        <AlertTriangle size={14} className={errors.length > 0 ? 'text-red-400' : 'text-amber-400'} />
        <span className="text-xs text-slate-300">
          {errors.length > 0 && (
            <span className="text-red-400 font-medium">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
          )}
          {errors.length > 0 && warnings.length > 0 && ' · '}
          {warnings.length > 0 && (
            <span className="text-amber-400 font-medium">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
          )}
        </span>
        <span className="ml-auto">
          {isExpanded ? (
            <ChevronUp size={12} className="text-slate-500" />
          ) : (
            <ChevronDown size={12} className="text-slate-500" />
          )}
        </span>
      </button>

      {/* Expanded detail list */}
      {isExpanded && (
        <div className="border-t border-slate-700 max-h-48 overflow-y-auto">
          {[...grouped.entries()].map(([label, items]) => (
            <div key={label} className="px-3 py-1.5 border-b border-slate-700/50 last:border-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {label} ({items.length})
              </p>
              {items.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onHighlightGames?.(c.gameIds)}
                  className="block w-full text-left text-xs text-slate-300 hover:text-white py-0.5 truncate transition-colors"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                      c.severity === 'error' ? 'bg-red-400' : 'bg-amber-400'
                    }`}
                  />
                  {c.message}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CONFLICT_LABELS: Record<string, string> = {
  team_conflict: 'Team Overlaps',
  rest_period: 'Rest Period',
  field_conflict: 'Field Double-Booking',
  games_per_day: 'Games Per Day Limit',
  coach_conflict: 'Coach Conflicts',
  travel_conflict: 'Travel Conflicts',
};
