import { z } from "zod";

export interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: File;
}

export const PREDEFINED_AGE_GROUPS = [
  { ageGroup: 'U4', birthYear: 2021, gender: 'Boys', divisionCode: 'B2021' },
  { ageGroup: 'U4', birthYear: 2021, gender: 'Girls', divisionCode: 'G2021' },
  { ageGroup: 'U5', birthYear: 2020, gender: 'Boys', divisionCode: 'B2020' },
  { ageGroup: 'U5', birthYear: 2020, gender: 'Girls', divisionCode: 'G2020' },
  { ageGroup: 'U6', birthYear: 2019, gender: 'Boys', divisionCode: 'B2019' },
  { ageGroup: 'U6', birthYear: 2019, gender: 'Girls', divisionCode: 'G2019' },
  { ageGroup: 'U7', birthYear: 2018, gender: 'Boys', divisionCode: 'B2018' },
  { ageGroup: 'U7', birthYear: 2018, gender: 'Girls', divisionCode: 'G2018' },
  { ageGroup: 'U8', birthYear: 2017, gender: 'Boys', divisionCode: 'B2017' },
  { ageGroup: 'U8', birthYear: 2017, gender: 'Girls', divisionCode: 'G2017' },
  { ageGroup: 'U9', birthYear: 2016, gender: 'Boys', divisionCode: 'B2016' },
  { ageGroup: 'U9', birthYear: 2016, gender: 'Girls', divisionCode: 'G2016' },
  { ageGroup: 'U10', birthYear: 2015, gender: 'Boys', divisionCode: 'B2015' },
  { ageGroup: 'U10', birthYear: 2015, gender: 'Girls', divisionCode: 'G2015' },
  { ageGroup: 'U11', birthYear: 2014, gender: 'Boys', divisionCode: 'B2014' },
  { ageGroup: 'U11', birthYear: 2014, gender: 'Girls', divisionCode: 'G2014' },
  { ageGroup: 'U12', birthYear: 2013, gender: 'Boys', divisionCode: 'B2013' },
  { ageGroup: 'U12', birthYear: 2013, gender: 'Girls', divisionCode: 'G2013' },
  { ageGroup: 'U13', birthYear: 2012, gender: 'Boys', divisionCode: 'B2012' },
  { ageGroup: 'U13', birthYear: 2012, gender: 'Girls', divisionCode: 'G2012' },
  { ageGroup: 'U14', birthYear: 2011, gender: 'Boys', divisionCode: 'B2011' },
  { ageGroup: 'U14', birthYear: 2011, gender: 'Girls', divisionCode: 'G2011' },
  { ageGroup: 'U15', birthYear: 2010, gender: 'Boys', divisionCode: 'B2010' },
  { ageGroup: 'U15', birthYear: 2010, gender: 'Girls', divisionCode: 'G2010' },
  { ageGroup: 'U16', birthYear: 2009, gender: 'Boys', divisionCode: 'B2009' },
  { ageGroup: 'U16', birthYear: 2009, gender: 'Girls', divisionCode: 'G2009' },
  { ageGroup: 'U17', birthYear: 2008, gender: 'Boys', divisionCode: 'B2008' },
  { ageGroup: 'U17', birthYear: 2008, gender: 'Girls', divisionCode: 'G2008' },
  { ageGroup: 'U18', birthYear: 2007, gender: 'Boys', divisionCode: 'B2007' },
  { ageGroup: 'U18', birthYear: 2007, gender: 'Girls', divisionCode: 'G2007' },
] as const;

export interface AgeGroup {
  id: string;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
  projectedTeams: number;
  fieldSize: FieldSize;
  amountDue?: number | null;
  selected?: boolean;
}

export interface Complex {
  id: number;
  name: string;
  fields: Field[];
}

export interface Field {
  id: number;
  name: string;
  complexId: number;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
}

export interface EventSetting {
  id: string;
  key: string;
  value: string;
}

export type FieldSize = '3v3' | '4v4' | '5v5' | '6v6' | '7v7' | '8v8' | '9v9' | '10v10' | '11v11' | 'N/A';
export type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

export interface EventData {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  applicationDeadline: string;
  details?: string;
  agreement?: string;
  refundPolicy?: string;
  ageGroups: AgeGroup[];
  complexFieldSizes: Record<number, FieldSize>;
  selectedComplexIds: number[];
  scoringRules: ScoringRule[];
  settings: EventSetting[];
  administrators: EventAdministrator[];
  branding?: EventBranding;
}

export interface ScoringRule {
  id: string;
  title: string;
  win: number;
  loss: number;
  tie: number;
  goalCapped: number;
  shutout: number;
  redCard: number;
  tieBreaker: string;
}

export const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

export const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

// Form schemas
export const eventInformationSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Timezone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

export const scoringRuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  goalCapped: z.number().min(0, "Goal cap must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  redCard: z.number().min(-10, "Red card points must be greater than -10"),
  tieBreaker: z.string().min(1, "Tie breaker is required"),
});

export const eventSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export type EventInformationValues = z.infer<typeof eventInformationSchema>;
export type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;
export type EventSettingValues = z.infer<typeof eventSettingSchema>;

export interface EventFormProps {
  initialData?: EventData;
  onSubmit: (data: EventData) => Promise<void>;
  isEdit?: boolean;
}

export interface EventAdministrator {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null;
}