/**
 * Represents a field within a complex
 */
export interface Field {
  id: number;
  complexId: number;
  name: string;
  fieldNumber?: string | null;
  fieldType: string;  // e.g. 'soccer', 'baseball', 'multi-purpose'
  surfaceType: string;  // e.g. 'grass', 'turf', 'dirt'
  length?: number | null;
  width?: number | null;
  isLighted: boolean;
  isIrrigated?: boolean | null;
  hasGoals?: boolean | null;
  hasNets?: boolean | null;
  hasBleachers?: boolean | null;
  hasScoreboard?: boolean | null;
  maintenanceNotes?: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

/**
 * Status options for a field
 */
export const FIELD_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Under Maintenance' }
];

/**
 * Field type options
 */
export const FIELD_TYPE_OPTIONS = [
  { value: 'soccer', label: 'Soccer' },
  { value: 'football', label: 'Football' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'softball', label: 'Softball' },
  { value: 'lacrosse', label: 'Lacrosse' },
  { value: 'multi-purpose', label: 'Multi-purpose' },
  { value: 'other', label: 'Other' }
];

/**
 * Surface type options
 */
export const SURFACE_TYPE_OPTIONS = [
  { value: 'grass', label: 'Natural Grass' },
  { value: 'turf', label: 'Artificial Turf' },
  { value: 'dirt', label: 'Dirt' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'mixed', label: 'Mixed Surface' }
];