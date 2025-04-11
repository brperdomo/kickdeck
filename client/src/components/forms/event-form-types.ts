import { z } from "zod";

// Define types for the event form
export type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

export const TAB_ORDER: EventTab[] = [
  'information',
  'age-groups',
  'scoring',
  'complexes',
  'settings',
  'administrators'
];

export const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
];

export type FieldSize = 'small' | 'medium' | 'large' | 'full' | '4v4' | '7v7' | '9v9' | '11v11';

export interface AgeGroup {
  id?: number;
  name: string;
  birthYearStart: number;
  birthYearEnd: number;
  fieldSize: FieldSize;
  maxTeams?: number;
}

export const PREDEFINED_AGE_GROUPS: AgeGroup[] = [
  { name: 'U8 Boys', birthYearStart: 2017, birthYearEnd: 2017, fieldSize: '4v4' },
  { name: 'U8 Girls', birthYearStart: 2017, birthYearEnd: 2017, fieldSize: '4v4' },
  { name: 'U9 Boys', birthYearStart: 2016, birthYearEnd: 2016, fieldSize: '7v7' },
  { name: 'U9 Girls', birthYearStart: 2016, birthYearEnd: 2016, fieldSize: '7v7' },
  { name: 'U10 Boys', birthYearStart: 2015, birthYearEnd: 2015, fieldSize: '7v7' },
  { name: 'U10 Girls', birthYearStart: 2015, birthYearEnd: 2015, fieldSize: '7v7' },
  { name: 'U11 Boys', birthYearStart: 2014, birthYearEnd: 2014, fieldSize: '9v9' },
  { name: 'U11 Girls', birthYearStart: 2014, birthYearEnd: 2014, fieldSize: '9v9' },
  { name: 'U12 Boys', birthYearStart: 2013, birthYearEnd: 2013, fieldSize: '9v9' },
  { name: 'U12 Girls', birthYearStart: 2013, birthYearEnd: 2013, fieldSize: '9v9' },
  { name: 'U13 Boys', birthYearStart: 2012, birthYearEnd: 2012, fieldSize: '11v11' },
  { name: 'U13 Girls', birthYearStart: 2012, birthYearEnd: 2012, fieldSize: '11v11' },
  { name: 'U14 Boys', birthYearStart: 2011, birthYearEnd: 2011, fieldSize: '11v11' },
  { name: 'U14 Girls', birthYearStart: 2011, birthYearEnd: 2011, fieldSize: '11v11' },
  { name: 'U15 Boys', birthYearStart: 2010, birthYearEnd: 2010, fieldSize: '11v11' },
  { name: 'U15 Girls', birthYearStart: 2010, birthYearEnd: 2010, fieldSize: '11v11' },
  { name: 'U16 Boys', birthYearStart: 2009, birthYearEnd: 2009, fieldSize: '11v11' },
  { name: 'U16 Girls', birthYearStart: 2009, birthYearEnd: 2009, fieldSize: '11v11' },
  { name: 'U17 Boys', birthYearStart: 2008, birthYearEnd: 2008, fieldSize: '11v11' },
  { name: 'U17 Girls', birthYearStart: 2008, birthYearEnd: 2008, fieldSize: '11v11' },
  { name: 'U18 Boys', birthYearStart: 2007, birthYearEnd: 2007, fieldSize: '11v11' },
  { name: 'U18 Girls', birthYearStart: 2007, birthYearEnd: 2007, fieldSize: '11v11' },
  { name: 'U19 Boys', birthYearStart: 2006, birthYearEnd: 2006, fieldSize: '11v11' },
  { name: 'U19 Girls', birthYearStart: 2006, birthYearEnd: 2006, fieldSize: '11v11' },
];

export interface EventBranding {
  logo: File | null;
  logoPreview?: string;
  sponsors: {
    name: string;
    url?: string;
    logo: File | null;
    logoPreview?: string;
  }[];
  primaryColor: string;
  secondaryColor: string;
}

export interface ScoringRule {
  name: string;
  points: number;
  description: string;
  index?: number;
}

export interface EventSetting {
  name: string;
  value: string;
  index?: number;
}

export interface EventAdministrator {
  id?: number;
  userId: number;
  eventId: number;
  name: string;
  email: string;
  role: string;
}

export interface EventInformationValues {
  id?: number;
  name: string;
  description: string;
  location: string;
  timezone: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  registrationEnabled: boolean;
  allowTeamRegistration: boolean;
}

export const eventInformationSchema = z.object({
  name: z.string().min(1, { message: "Event name is required" }),
  description: z.string(),
  location: z.string().min(1, { message: "Location is required" }),
  timezone: z.string().min(1, { message: "Timezone is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  applicationDeadline: z.string().min(1, { message: "Application deadline is required" }),
  registrationEnabled: z.boolean(),
  allowTeamRegistration: z.boolean(),
  ageGroups: z.array(z.any()).optional(),
  selectedComplexIds: z.array(z.number()).optional(),
  complexFieldSizes: z.record(z.string(), z.string()).optional(),
  scoringRules: z.array(z.any()).optional(),
  settings: z.array(z.any()).optional(),
  administrators: z.array(z.any()).optional(),
  branding: z.any().optional(),
  seasonalScopeId: z.number().optional(),
});

export const scoringRuleSchema = z.object({
  name: z.string().min(1, { message: "Rule name is required" }),
  points: z.number().int(),
  description: z.string().optional(),
});

export const eventSettingSchema = z.object({
  name: z.string().min(1, { message: "Setting name is required" }),
  value: z.string().min(1, { message: "Value is required" }),
});

export interface Field {
  id: number;
  complexId: number;
  name: string;
  size: FieldSize;
}

export interface Complex {
  id: number;
  name: string;
  address: string;
  fields: Field[];
  fieldCount: number;
}

export interface EventData extends EventInformationValues {
  id: number;
  ageGroups: AgeGroup[];
  settings: EventSetting[];
  administrators: EventAdministrator[];
  branding: EventBranding;
  scoringRules: ScoringRule[];
  selectedComplexIds: number[];
  complexFieldSizes: Record<number, FieldSize>;
  seasonalScopeId?: number;
}