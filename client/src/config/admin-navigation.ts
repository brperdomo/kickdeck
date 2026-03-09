import {
  Trophy, Calendar, Users, CalendarDays, Building2, MapPin,
  Home, Shield, FileText, ImageIcon, Settings, Mail, KeyRound,
  UserRound, ClipboardList, Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// View types — matches admin-dashboard.tsx
export type View =
  | 'events' | 'teams' | 'administrators' | 'settings'
  | 'households' | 'reports' | 'account' | 'complexes'
  | 'scheduling' | 'files' | 'formTemplates' | 'formSubmissions'
  | 'roles' | 'members' | 'complex-map';

export type SettingsView = 'general' | 'email';

export interface AdminNavItem {
  id: string;
  view: View | null;       // null for external routes (e.g. email config page)
  label: string;
  icon: LucideIcon;
  route: string;
  permission?: string;
}

export interface AdminSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: Trophy,
    items: [
      { id: 'events', view: 'events', label: 'Events', icon: Calendar, route: '/admin/events', permission: 'view_events' },
      { id: 'teams', view: 'teams', label: 'Teams', icon: Users, route: '/admin/teams', permission: 'view_teams' },
      { id: 'scheduling', view: 'scheduling', label: 'Schedule Builder', icon: CalendarDays, route: '/admin/scheduling', permission: 'view_scheduling' },
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Building2,
    items: [
      { id: 'complexes', view: 'complexes', label: 'Venues', icon: Building2, route: '/admin/complexes', permission: 'view_complexes' },
      { id: 'complex-map', view: 'complex-map', label: 'Venue Map', icon: MapPin, route: '/admin/complex-locations', permission: 'view_complexes' },
      { id: 'households', view: 'households', label: 'Clients', icon: Home, route: '/admin/households', permission: 'view_households' },
      { id: 'members', view: 'members', label: 'Members', icon: UserRound, route: '/admin/members', permission: 'view_members' },
      { id: 'administrators', view: 'administrators', label: 'Staff', icon: Shield, route: '/admin/administrators', permission: 'view_administrators' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: FileText,
    items: [
      { id: 'formTemplates', view: 'formTemplates', label: 'Forms', icon: ClipboardList, route: '/admin/form-templates', permission: 'view_form_templates' },
      { id: 'formSubmissions', view: 'formSubmissions', label: 'Submissions', icon: Send, route: '/admin/form-submissions', permission: 'view_form_templates' },
      { id: 'reports', view: 'reports', label: 'Reports', icon: FileText, route: '/admin/reports', permission: 'view_reports' },
      { id: 'files', view: 'files', label: 'Media', icon: ImageIcon, route: '/admin/file-manager', permission: 'view_files' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { id: 'settings-general', view: 'settings', label: 'General', icon: Settings, route: '/admin/settings', permission: 'view_organization_settings' },
      { id: 'settings-email', view: null, label: 'Email', icon: Mail, route: '/admin/brevo-setup' },
      { id: 'roles', view: 'roles', label: 'Permissions', icon: KeyRound, route: '/admin/roles', permission: 'view_role_permissions' },
    ],
  },
];

// Build a view → section-id lookup map
export const VIEW_TO_SECTION: Record<string, string> = {};
ADMIN_SECTIONS.forEach((section) => {
  section.items.forEach((item) => {
    if (item.view) {
      VIEW_TO_SECTION[item.view] = section.id;
    }
  });
});

// URL path segment → View mapping for URL sync
export const URL_TO_VIEW: Record<string, View> = {
  'events': 'events',
  'teams': 'teams',
  'administrators': 'administrators',
  'settings': 'settings',
  'households': 'households',
  'reports': 'reports',
  'account': 'account',
  'complexes': 'complexes',
  'complex-locations': 'complex-map',
  'scheduling': 'scheduling',
  'file-manager': 'files',
  'form-templates': 'formTemplates',
  'form-submissions': 'formSubmissions',
  'roles': 'roles',
  'members': 'members',
};

// Find a nav item by view
export function findNavItemByView(view: string): AdminNavItem | undefined {
  for (const section of ADMIN_SECTIONS) {
    const item = section.items.find((i) => i.view === view);
    if (item) return item;
  }
  return undefined;
}

// Get sections visible to a tournament director (non-super-admin)
export function getTournamentDirectorSections(): AdminSection[] {
  return [
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: Trophy,
      items: [
        { id: 'events', view: 'events', label: 'Events', icon: Calendar, route: '/admin/events', permission: 'view_events' },
      ],
    },
  ];
}
