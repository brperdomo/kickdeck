/**
 * Represents a sports complex or facility
 */
export interface Complex {
  id: number;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  openTime?: string | null;
  closeTime?: string | null;
  shared: boolean;      // Flag to indicate if this complex can be shared across event instances
  sharedId?: string | null; // UUID used to identify the same physical complex across system instances
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  directions?: string | null; // Custom directions to the complex
}