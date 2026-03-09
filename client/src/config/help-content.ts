import type { View } from './admin-navigation';

export interface HelpTip {
  id: string;
  title: string;
  description: string;
  category?: 'getting-started' | 'key-actions' | 'workflow' | 'tips';
}

export interface ViewHelpContent {
  pageTitle: string;
  pageSummary: string;
  tips: HelpTip[];
}

/**
 * Contextual help content for every admin dashboard view.
 * Each entry maps to a View type from admin-navigation.ts.
 */
export const HELP_CONTENT: Partial<Record<View, ViewHelpContent>> = {

  /* ── TOURNAMENTS ─────────────────────────────────── */

  events: {
    pageTitle: 'Events Management',
    pageSummary: 'Create and manage tournament events. This is typically the first step in setting up a tournament.',
    tips: [
      {
        id: 'events-create',
        title: 'Create a New Event',
        description: 'Click "Create Event" to start a new tournament. Set the name, dates, venue, and registration window.',
        category: 'getting-started',
      },
      {
        id: 'events-age-groups',
        title: 'Configure Age Groups',
        description: 'After creating an event, click into it to add age groups (e.g., U10, U12) with gender divisions. These determine how teams are sorted into flights and brackets.',
        category: 'workflow',
      },
      {
        id: 'events-fees',
        title: 'Set Up Registration Fees',
        description: 'Inside the event detail page, configure fee structures for each age group. You can create required and optional fees with different amounts.',
        category: 'key-actions',
      },
      {
        id: 'events-workflow',
        title: 'Recommended Order of Operations',
        description: '1) Create event  2) Add age groups  3) Set fees  4) Configure venues/fields  5) Open registration  6) Build schedule after teams register.',
        category: 'workflow',
      },
      {
        id: 'events-actions',
        title: 'Event Action Pages',
        description: 'Click on an event row to access its detail page, where you can manage fees, coupons, application forms, scheduling, game cards, and more.',
        category: 'tips',
      },
    ],
  },

  teams: {
    pageTitle: 'Team Management',
    pageSummary: 'View all registered teams across events. Approve or reject registrations, manage rosters, and track payments.',
    tips: [
      {
        id: 'teams-view',
        title: 'View Registered Teams',
        description: 'Teams appear here after registering through your event form. Each row shows the team name, event, age group, payment status, and coach info.',
        category: 'getting-started',
      },
      {
        id: 'teams-approve',
        title: 'Approve or Reject Teams',
        description: 'Review pending team registrations and approve or reject them. Approved teams can then be assigned to flights and brackets for scheduling.',
        category: 'key-actions',
      },
      {
        id: 'teams-rosters',
        title: 'Manage Player Rosters',
        description: 'Click on a team to view and edit its player roster. You can also import players in bulk using CSV upload.',
        category: 'key-actions',
      },
      {
        id: 'teams-payments',
        title: 'Track Payments',
        description: 'The payment status column shows whether each team has paid their registration fees. You can view payment details and process fee adjustments.',
        category: 'tips',
      },
    ],
  },

  scheduling: {
    pageTitle: 'Schedule Builder',
    pageSummary: 'Build and manage tournament game schedules using a multi-step workflow. Select an event first, then configure flights, create brackets, and generate games.',
    tips: [
      {
        id: 'sched-select',
        title: 'Select an Event First',
        description: 'Choose which tournament event you want to schedule. The event must have registered teams and configured age groups before scheduling can begin.',
        category: 'getting-started',
      },
      {
        id: 'sched-flights',
        title: 'Step 1: Configure Flights',
        description: 'Set game lengths, rest periods, and buffer times for each age group flight. This controls the spacing of games on the schedule.',
        category: 'workflow',
      },
      {
        id: 'sched-brackets',
        title: 'Step 2: Create Brackets',
        description: 'Organize teams within each flight into brackets or groups. You can use round-robin, single elimination, or other tournament formats.',
        category: 'workflow',
      },
      {
        id: 'sched-generate',
        title: 'Step 3: Generate Games',
        description: 'Use auto-schedule to generate all the games for each bracket. The system handles matchups based on your chosen tournament format.',
        category: 'workflow',
      },
      {
        id: 'sched-fields',
        title: 'Step 4: Assign Fields & Times',
        description: 'Assign each game to a specific field and time slot. The system checks for conflicts like overlapping games or insufficient rest time.',
        category: 'workflow',
      },
    ],
  },

  /* ── ORGANIZATION ─────────────────────────────────── */

  complexes: {
    pageTitle: 'Venues Management',
    pageSummary: 'Manage sports venues (complexes) and their individual playing fields. Venues are where your tournament games are played.',
    tips: [
      {
        id: 'venues-add',
        title: 'Add a Venue',
        description: 'Click "Add Venue" to create a new sports complex. Enter the name, address, and any relevant details about the facility.',
        category: 'getting-started',
      },
      {
        id: 'venues-fields',
        title: 'Manage Fields',
        description: 'Each venue can have multiple fields. Click on a venue to add, edit, or remove fields. Set field sizes (e.g., 11v11, 7v7), lighting availability, and capacity.',
        category: 'key-actions',
      },
      {
        id: 'venues-events',
        title: 'Link Venues to Events',
        description: 'After creating venues and fields, you can assign them to specific events. This makes the fields available for scheduling during that tournament.',
        category: 'workflow',
      },
    ],
  },

  'complex-map': {
    pageTitle: 'Venue Map',
    pageSummary: 'View your venue locations on an interactive map. Useful for planning logistics and understanding the geographic layout of your tournament.',
    tips: [
      {
        id: 'map-view',
        title: 'Interactive Map View',
        description: 'Venues with addresses are plotted on the map. Click on a marker to see venue details and its fields.',
        category: 'getting-started',
      },
      {
        id: 'map-plan',
        title: 'Plan Travel Logistics',
        description: 'Use the map to understand distances between venues when scheduling. Try to minimize travel for teams with back-to-back games.',
        category: 'tips',
      },
    ],
  },

  households: {
    pageTitle: 'Client Management',
    pageSummary: 'Manage client (household) accounts. Clients are the parents, guardians, or organizations that register teams for your events.',
    tips: [
      {
        id: 'clients-view',
        title: 'View Client Accounts',
        description: 'Browse all client accounts with their contact information, associated teams, and payment history.',
        category: 'getting-started',
      },
      {
        id: 'clients-contact',
        title: 'Contact Information',
        description: 'Each client record includes email, phone, and address. You can use this for tournament communications.',
        category: 'key-actions',
      },
      {
        id: 'clients-payments',
        title: 'Payment History',
        description: 'View a client\'s complete payment history across all events, including successful payments, refunds, and outstanding balances.',
        category: 'tips',
      },
    ],
  },

  members: {
    pageTitle: 'Members Directory',
    pageSummary: 'Manage individual members of your organization. Members are distinct from team players  they represent people with accounts in your system.',
    tips: [
      {
        id: 'members-browse',
        title: 'Browse Members',
        description: 'View all organization members with their profiles and contact details. Use search and filters to find specific people.',
        category: 'getting-started',
      },
      {
        id: 'members-edit',
        title: 'Edit Member Profiles',
        description: 'Click on a member to view or edit their profile, including name, email, phone, and any custom fields.',
        category: 'key-actions',
      },
      {
        id: 'members-merge',
        title: 'Merge Duplicate Members',
        description: 'If the same person has multiple records, you can merge them from the Members page to keep your data clean.',
        category: 'tips',
      },
    ],
  },

  administrators: {
    pageTitle: 'Staff Management',
    pageSummary: 'Manage your organization\'s admin staff and their access levels. Add new administrators and assign them specific roles.',
    tips: [
      {
        id: 'staff-add',
        title: 'Add Admin Staff',
        description: 'Click "Add Staff" to invite a new administrator. Enter their email and assign them a role that determines what they can access.',
        category: 'getting-started',
      },
      {
        id: 'staff-roles',
        title: 'Role Types',
        description: 'Available roles include Super Admin (full access), Tournament Admin (event management), Score Admin (game scoring), and Finance Admin (payments and fees).',
        category: 'key-actions',
      },
      {
        id: 'staff-permissions',
        title: 'Fine-Grained Permissions',
        description: 'Each role has specific permissions. Go to Settings > Permissions to customize exactly what each role can view and manage.',
        category: 'tips',
      },
    ],
  },

  /* ── CONTENT ─────────────────────────────────── */

  formTemplates: {
    pageTitle: 'Form Builder',
    pageSummary: 'Create and manage custom form templates. Use these for team registration, waivers, surveys, and other data collection needs.',
    tips: [
      {
        id: 'forms-create',
        title: 'Create a Form Template',
        description: 'Click "Create Form" to build a new template. Add fields like text inputs, dropdowns, checkboxes, file uploads, and more.',
        category: 'getting-started',
      },
      {
        id: 'forms-fields',
        title: 'Custom Field Types',
        description: 'Supports text, number, date, dropdown, multi-select, checkbox, file upload, and signature fields. Each can be marked as required.',
        category: 'key-actions',
      },
      {
        id: 'forms-link',
        title: 'Link Forms to Events',
        description: 'Attach a form template to an event so it appears during team registration. Teams fill it out as part of the registration flow.',
        category: 'workflow',
      },
    ],
  },

  formSubmissions: {
    pageTitle: 'Form Submissions',
    pageSummary: 'View and manage submitted form responses. Review answers, export data, and track completion status.',
    tips: [
      {
        id: 'submissions-view',
        title: 'Review Submissions',
        description: 'All completed form submissions appear here. Click on a submission to see the full response with all field values.',
        category: 'getting-started',
      },
      {
        id: 'submissions-export',
        title: 'Export Data',
        description: 'Use the export feature to download submission data as a spreadsheet for further analysis or record keeping.',
        category: 'key-actions',
      },
    ],
  },

  reports: {
    pageTitle: 'Reports & Analytics',
    pageSummary: 'Access financial reports, registration analytics, and operational data. Export reports for offline analysis.',
    tips: [
      {
        id: 'reports-types',
        title: 'Available Report Types',
        description: 'Includes financial summaries, registration statistics, payment tracking, team counts by age group, and revenue breakdowns.',
        category: 'getting-started',
      },
      {
        id: 'reports-filter',
        title: 'Filter by Event',
        description: 'Most reports can be filtered by event, date range, or age group to focus on specific data.',
        category: 'key-actions',
      },
      {
        id: 'reports-export',
        title: 'Export Reports',
        description: 'Download reports as CSV or PDF for offline review, board presentations, or accounting purposes.',
        category: 'tips',
      },
    ],
  },

  files: {
    pageTitle: 'Media Manager',
    pageSummary: 'Upload and organize files, images, and documents. Manage tournament media assets like logos, photos, and documents.',
    tips: [
      {
        id: 'media-upload',
        title: 'Upload Files',
        description: 'Drag and drop or click to upload images, documents, and other files. Supported formats include images (PNG, JPG), PDFs, and spreadsheets.',
        category: 'getting-started',
      },
      {
        id: 'media-organize',
        title: 'Organize Files',
        description: 'Create folders to keep your media organized. Group files by event, season, or type for easy retrieval.',
        category: 'key-actions',
      },
      {
        id: 'media-use',
        title: 'Using Media',
        description: 'Uploaded images can be used for event branding, game cards, and public-facing tournament pages.',
        category: 'tips',
      },
    ],
  },

  /* ── SETTINGS ─────────────────────────────────── */

  settings: {
    pageTitle: 'General Settings',
    pageSummary: 'Configure your organization\'s profile, branding, email templates, and other system-wide settings.',
    tips: [
      {
        id: 'settings-org',
        title: 'Organization Profile',
        description: 'Set your organization\'s name, logo, contact information, and website URL. This appears on public-facing pages and emails.',
        category: 'getting-started',
      },
      {
        id: 'settings-branding',
        title: 'UI Styling & Branding',
        description: 'Customize your dashboard colors, themes, and branding to match your organization\'s identity.',
        category: 'key-actions',
      },
      {
        id: 'settings-email',
        title: 'Email Configuration',
        description: 'Configure email templates for registration confirmations, payment receipts, and tournament notifications. Set up your email provider (Brevo) in the Email tab.',
        category: 'workflow',
      },
    ],
  },

  roles: {
    pageTitle: 'Role Permissions',
    pageSummary: 'Create and manage custom roles with fine-grained permission controls. Define exactly what each staff member can see and do.',
    tips: [
      {
        id: 'roles-create',
        title: 'Create Custom Roles',
        description: 'Click "Create Role" to define a new permission set. Name the role and select which areas of the dashboard it can access.',
        category: 'getting-started',
      },
      {
        id: 'roles-permissions',
        title: 'Permission Categories',
        description: 'Permissions are grouped by area: Events, Teams, Scheduling, Venues, Members, Finance, Forms, Reports, Files, and Settings.',
        category: 'key-actions',
      },
      {
        id: 'roles-assign',
        title: 'Assign Roles to Staff',
        description: 'After creating a role, go to Staff management to assign it to team members. Each staff member can have one role.',
        category: 'workflow',
      },
    ],
  },
};
