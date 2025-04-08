/**
 * Represents a sports field within a complex
 */
export interface Field {
  id: number;
  name: string;
  complexId: number;
  fieldType: string;      // E.g., "Soccer", "Football", "Baseball", etc.
  fieldSize: string;      // E.g., "Full", "Half", "Quarter", "Custom"
  surfaceType: string;    // E.g., "Grass", "Turf", "Indoor", etc.
  length?: number | null; // Length in yards/meters
  width?: number | null;  // Width in yards/meters
  lighting: boolean;      // Whether the field has lighting for night games
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;      // Whether the field is currently available for scheduling
}