// ─── Calendar Toolbar — day tabs, layout toggle, interval, flight filter ────

import React from 'react';
import { Rows3, Columns3, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CalendarToolbarProps } from './calendarTypes';

export function CalendarToolbar({
  selectedDate,
  availableDates,
  onDateChange,
  layout,
  onLayoutChange,
  interval,
  onIntervalChange,
  flightFilters,
  onFlightFilterToggle,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Day tabs (scrollable) */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700 overflow-x-auto">
        {availableDates.map((d) => (
          <button
            key={d.value}
            onClick={() => onDateChange(d.value)}
            className={`
              shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${
                d.value === selectedDate
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }
            `}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Row 2: Controls — all inline */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Layout toggle */}
        <div className="shrink-0 flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => onLayoutChange('vertical')}
            className={`p-1.5 rounded-md transition-colors ${
              layout === 'vertical'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Vertical layout (Google Calendar style)"
          >
            <Columns3 size={14} />
          </button>
          <button
            onClick={() => onLayoutChange('horizontal')}
            className={`p-1.5 rounded-md transition-colors ${
              layout === 'horizontal'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Horizontal layout"
          >
            <Rows3 size={14} />
          </button>
        </div>

        {/* Interval selector */}
        <div className="shrink-0 w-[100px]">
        <Select value={String(interval)} onValueChange={(v) => onIntervalChange(Number(v))}>
          <SelectTrigger className="h-8 text-xs border-slate-700 bg-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="15" className="text-xs">15 min</SelectItem>
            <SelectItem value="30" className="text-xs">30 min</SelectItem>
            <SelectItem value="45" className="text-xs">45 min</SelectItem>
            <SelectItem value="60" className="text-xs">60 min</SelectItem>
          </SelectContent>
        </Select>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Flight filter */}
        {flightFilters.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-slate-700 bg-slate-800">
                <Filter size={12} />
                Flights
                {flightFilters.some((f) => !f.visible) && (
                  <span className="bg-blue-500/20 text-blue-300 rounded-full px-1 text-[10px]">
                    {flightFilters.filter((f) => f.visible).length}/{flightFilters.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              {flightFilters.map((f) => (
                <DropdownMenuCheckboxItem
                  key={f.flightName}
                  checked={f.visible}
                  onCheckedChange={() => onFlightFilterToggle(f.flightName)}
                  className="text-xs"
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${f.color.badge}`} />
                  {f.flightName}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
