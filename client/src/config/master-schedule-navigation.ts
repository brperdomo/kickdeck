import {
  Trophy, Plane, GitBranch, Cog, Eye, Calendar, FileText,
  Upload, Users, Settings, Calculator, Globe, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MasterScheduleView =
  | 'overview' | 'flights' | 'brackets' | 'format-settings' | 'field-settings'
  | 'schedule-viewer' | 'calendar' | 'game-management' | 'import'
  | 'score-entry' | 'scoring-rules' | 'game-cards' | 'teams'
  | 'publish' | 'field-order';

export interface ScheduleNavItem {
  id: string;
  view: MasterScheduleView;
  label: string;
  icon: LucideIcon;
}

export interface ScheduleSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: ScheduleNavItem[];
}

export const SCHEDULE_SECTIONS: ScheduleSection[] = [
  {
    id: 'setup',
    label: 'Setup',
    icon: Settings,
    items: [
      { id: 'overview', view: 'overview', label: 'Overview', icon: Trophy },
      { id: 'flights', view: 'flights', label: 'Flight Assignment', icon: Plane },
      { id: 'brackets', view: 'brackets', label: 'Bracket Management', icon: GitBranch },
      { id: 'format-settings', view: 'format-settings', label: 'Format Settings', icon: Cog },
      { id: 'field-settings', view: 'field-settings', label: 'Field Settings', icon: MapPin },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    items: [
      { id: 'schedule-viewer', view: 'schedule-viewer', label: 'Schedule Viewer', icon: Eye },
      { id: 'calendar', view: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'game-management', view: 'game-management', label: 'Manage Games', icon: Users },
      { id: 'import', view: 'import', label: 'Import Schedule', icon: Upload },
    ],
  },
  {
    id: 'game-day',
    label: 'Game Day',
    icon: Trophy,
    items: [
      { id: 'score-entry', view: 'score-entry', label: 'Enter Scores', icon: Calculator },
      { id: 'scoring-rules', view: 'scoring-rules', label: 'Scoring Rules', icon: Trophy },
      { id: 'game-cards', view: 'game-cards', label: 'Game Cards', icon: FileText },
      { id: 'teams', view: 'teams', label: 'Teams', icon: Users },
    ],
  },
  {
    id: 'publish',
    label: 'Publish',
    icon: Globe,
    items: [
      { id: 'publish-schedules', view: 'publish', label: 'Post Schedules', icon: Globe },
      { id: 'field-order', view: 'field-order', label: 'Field Order', icon: MapPin },
    ],
  },
];

// Build view → section-id lookup map
export const SCHEDULE_VIEW_TO_SECTION: Record<string, string> = {};
SCHEDULE_SECTIONS.forEach((section) => {
  section.items.forEach((item) => {
    SCHEDULE_VIEW_TO_SECTION[item.view] = section.id;
  });
});
