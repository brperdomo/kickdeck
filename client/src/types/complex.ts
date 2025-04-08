/**
 * Represents a field complex (sports facility)
 */
export interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  isShared: boolean;
  shared_id?: string | null;
  directions?: string | null;
  rules?: string | null;
  createdAt: string;
  updatedAt: string;
}