/**
 * Represents a sports field complex
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
  shared: boolean;      // Whether the complex is shared across instances
  sharedId?: string;    // Unique identifier for cross-instance sharing
  createdAt: string;
  updatedAt: string;
  directions?: string | null; // Additional directions to find the complex
}