// ─── Calendar Schedule View — Utilities ─────────────────────────────────────

import type { FlightColor, CalendarSlot, CalendarGame } from './calendarTypes';

// ─── Flight Color Palette ───────────────────────────────────────────────────
// 8 distinct colors for flight/bracket identification. Mapped by index.
export const FLIGHT_COLORS: FlightColor[] = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-300', badge: 'bg-blue-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-300', badge: 'bg-amber-500' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-300', badge: 'bg-violet-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-300', badge: 'bg-cyan-500' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-300', badge: 'bg-rose-500' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-300', badge: 'bg-indigo-500' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-300', badge: 'bg-teal-500' },
];

// Track flight→color assignment so the same flight always gets the same color
const flightColorMap = new Map<string, FlightColor>();
let nextColorIndex = 0;

export function getFlightColor(flightName: string): FlightColor {
  if (!flightName) return FLIGHT_COLORS[0];
  const existing = flightColorMap.get(flightName);
  if (existing) return existing;

  const color = FLIGHT_COLORS[nextColorIndex % FLIGHT_COLORS.length];
  flightColorMap.set(flightName, color);
  nextColorIndex++;
  return color;
}

export function resetFlightColors() {
  flightColorMap.clear();
  nextColorIndex = 0;
}

// ─── Time Utilities ─────────────────────────────────────────────────────────

/** Convert "HH:MM" or "HH:MM:SS" → total minutes from midnight */
export function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  // Handle ISO strings like "2026-04-02T08:00:00"
  const timePart = time.includes('T') ? time.split('T')[1] : time;
  const [h, m] = timePart.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convert total minutes from midnight → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Format "HH:MM" → "8:00 AM" display string */
export function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return minutes === 0
    ? `${displayHours} ${period}`
    : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/** Format time range "8:00 AM – 9:30 AM" */
export function formatTimeRange(startMinutes: number, endMinutes: number): string {
  return `${formatDisplayTime(minutesToTime(startMinutes))} – ${formatDisplayTime(minutesToTime(endMinutes))}`;
}

/** Extract date from ISO string or "YYYY-MM-DD" */
export function extractDate(startTime: string | null): string {
  if (!startTime) return 'TBD';
  return startTime.split('T')[0] || startTime.split(' ')[0] || 'TBD';
}

/** Extract time "HH:MM" from ISO string */
export function extractTime(startTime: string | null): string {
  if (!startTime) return 'TBD';
  const timePart = startTime.includes('T')
    ? startTime.split('T')[1]
    : startTime.includes(' ')
      ? startTime.split(' ')[1]
      : startTime;
  return timePart?.split(':').slice(0, 2).join(':') || 'TBD';
}

// ─── Smart Interval Computation ─────────────────────────────────────────────

/** Greatest common divisor */
function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Compute a sensible grid interval from actual game durations.
 * Uses GCD of durations clamped to [15, 60].
 * Falls back to 30 min if no scheduled games.
 */
export function computeSmartInterval(games: CalendarGame[]): number {
  const scheduledGames = games.filter((g) => g.startTime && g.date !== 'TBD');
  if (scheduledGames.length === 0) return 30;

  const durations = [...new Set(scheduledGames.map((g) => g.duration))];
  if (durations.length === 0) return 30;

  let result = durations[0];
  for (let i = 1; i < durations.length; i++) {
    result = gcd(result, durations[i]);
  }

  // Clamp to a usable range
  if (result < 15) result = 15;
  if (result > 60) result = 30;
  return result;
}

// ─── Time Slot Generation ───────────────────────────────────────────────────

/**
 * Generate time slots from `startHour` to `endHour` with `intervalMinutes` spacing.
 * Automatically determines range from scheduled games if provided.
 */
export function generateTimeSlots(
  intervalMinutes: number,
  date: string,
  games?: CalendarGame[],
): CalendarSlot[] {
  // Determine time range from actual games, or default to 7:00–21:00
  let startMinutes = 7 * 60; // 7:00 AM
  let endMinutes = 21 * 60; // 9:00 PM

  if (games && games.length > 0) {
    const scheduledOnDate = games.filter(
      (g) => g.startTime && extractDate(g.startTime) === date,
    );
    if (scheduledOnDate.length > 0) {
      const gameTimes = scheduledOnDate.map((g) => timeToMinutes(g.startTime));
      const gameEnds = scheduledOnDate.map(
        (g) => timeToMinutes(g.startTime) + g.duration,
      );
      const earliest = Math.min(...gameTimes);
      const latest = Math.max(...gameEnds);

      // Round down to nearest interval for start, round up for end
      startMinutes =
        Math.floor(earliest / intervalMinutes) * intervalMinutes -
        intervalMinutes;
      endMinutes =
        Math.ceil(latest / intervalMinutes) * intervalMinutes + intervalMinutes;

      // Clamp to reasonable bounds
      startMinutes = Math.max(startMinutes, 6 * 60); // no earlier than 6 AM
      endMinutes = Math.min(endMinutes, 23 * 60); // no later than 11 PM
    }
  }

  const slots: CalendarSlot[] = [];
  for (let m = startMinutes; m < endMinutes; m += intervalMinutes) {
    const start = minutesToTime(m);
    const end = minutesToTime(m + intervalMinutes);
    slots.push({
      id: `${date}-${start}`,
      startTime: start,
      endTime: end,
      displayTime: formatDisplayTime(start),
      minutes: m,
    });
  }
  return slots;
}

// ─── Winner Placeholder Detection ───────────────────────────────────────────

const WINNER_PLACEHOLDERS = new Set([
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
  '2nd Place',
]);

export function isWinnerPlaceholder(name: string): boolean {
  return !name || WINNER_PLACEHOLDERS.has(name);
}
