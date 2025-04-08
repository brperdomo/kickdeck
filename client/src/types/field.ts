/**
 * Represents a sports field within a complex
 */
export interface Field {
  id: number;
  name: string;
  complexId: number;
  fieldType: string;
  fieldSize: string;
  surfaceType: string;
  isLighted: boolean;
  isOpen: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}