// ─── Calendar Schedule View — Shared Types ─────────────────────────────────

export type LayoutMode = 'vertical' | 'horizontal';

export interface FlightColor {
  bg: string;
  border: string;
  text: string;
  badge: string;
}

export interface CalendarGame {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  ageGroup: string;
  fieldId: number | null;
  fieldName: string;
  startTime: string | null; // ISO "YYYY-MM-DDTHH:mm:ss" or null
  endTime: string | null;
  date: string; // "YYYY-MM-DD" or "TBD"
  time: string; // "HH:MM" or "TBD"
  duration: number; // minutes
  status: string;
  homeTeamCoach: string;
  awayTeamCoach: string;
  bracketName: string;
  bracketId: number | null;
  flightName: string;
  round: number | null;
  flightColor: FlightColor;
}

export interface CalendarField {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  isOpen: boolean;
}

export interface CalendarSlot {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  displayTime: string;
  minutes: number; // minutes from midnight
}

export interface DragState {
  game: CalendarGame | null;
  originFieldId: number | null;
  originSlot: string | null;
}

export interface DropTarget {
  fieldId: number;
  startTime: string; // "HH:MM"
  date: string; // "YYYY-MM-DD"
}

export interface ConflictInfo {
  type:
    | 'team_conflict'
    | 'rest_period'
    | 'field_conflict'
    | 'games_per_day'
    | 'coach_conflict'
    | 'travel_conflict';
  severity: 'warning' | 'error';
  message: string;
  gameIds: number[];
}

export interface FlightFilter {
  flightName: string;
  color: FlightColor;
  visible: boolean;
}

export interface CalendarToolbarProps {
  selectedDate: string;
  availableDates: { value: string; label: string }[];
  onDateChange: (date: string) => void;
  layout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  interval: number;
  onIntervalChange: (interval: number) => void;
  flightFilters: FlightFilter[];
  onFlightFilterToggle: (flightName: string) => void;
}

export interface ScheduleAPIResponse {
  games: any[];
  fields: any[];
  ageGroups: string[];
  dates: string[];
  totalGames: number;
  eventDetails: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface FlightConfig {
  id: number;
  bracketId: number;
  flightName: string;
  ageGroup: string;
  restPeriod: number;
  maxGamesPerDay: number;
  gameLength: number;
  bufferTime: number;
}
