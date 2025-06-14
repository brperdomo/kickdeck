/**
 * Mapbox Service for Complex Address Verification
 * 
 * Handles geocoding, reverse geocoding, and global complex ID management
 * to prevent scheduling conflicts across multiple client instances.
 */

import { mapboxApiKey } from './env';

export interface MapboxPlace {
  id: string;
  type: string;
  place_name: string;
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    landmark?: boolean;
  };
  text: string;
  place_type: string[];
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface ComplexVerificationResult {
  verified: boolean;
  globalComplexId: string;
  mapboxPlaceId: string;
  confidence: number;
  conflictRisk: 'low' | 'medium' | 'high';
  existingComplexes?: Array<{
    id: number;
    name: string;
    organizationId: number;
    distance: number;
  }>;
}

export interface GlobalComplexRegistry {
  globalComplexId: string;
  canonicalName: string;
  canonicalAddress: string;
  mapboxPlaceId: string;
  latitude: number;
  longitude: number;
  country: string;
  stateProvince: string;
  city: string;
  usageCount: number;
  verifiedAt: string;
}

class MapboxService {
  private readonly baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = mapboxApiKey;
    if (!this.apiKey) {
      console.warn('Mapbox API key not provided. Address verification will be disabled.');
    }
  }

  /**
   * Search for places using Mapbox Geocoding API
   */
  async searchPlaces(
    query: string,
    options: {
      types?: string[];
      country?: string[];
      proximity?: [number, number];
      bbox?: [number, number, number, number];
      limit?: number;
    } = {}
  ): Promise<MapboxPlace[]> {
    if (!this.apiKey) {
      throw new Error('Mapbox API key is required for address verification');
    }

    const params = new URLSearchParams({
      access_token: this.apiKey,
      limit: (options.limit || 5).toString(),
      autocomplete: 'true',
    });

    if (options.types?.length) {
      params.append('types', options.types.join(','));
    }
    if (options.country?.length) {
      params.append('country', options.country.join(','));
    }
    if (options.proximity) {
      params.append('proximity', `${options.proximity[0]},${options.proximity[1]}`);
    }
    if (options.bbox) {
      params.append('bbox', options.bbox.join(','));
    }

    const response = await fetch(
      `${this.baseUrl}/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  }

  /**
   * Reverse geocode coordinates to get place information
   */
  async reverseGeocode(
    longitude: number,
    latitude: number,
    options: {
      types?: string[];
      limit?: number;
    } = {}
  ): Promise<MapboxPlace[]> {
    if (!this.apiKey) {
      throw new Error('Mapbox API key is required for reverse geocoding');
    }

    const params = new URLSearchParams({
      access_token: this.apiKey,
      limit: (options.limit || 1).toString(),
    });

    if (options.types?.length) {
      params.append('types', options.types.join(','));
    }

    const response = await fetch(
      `${this.baseUrl}/${longitude},${latitude}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  }

  /**
   * Verify a complex address and check for conflicts across organizations
   */
  async verifyComplexAddress(
    name: string,
    address: string,
    organizationId: number
  ): Promise<ComplexVerificationResult> {
    try {
      // Search for the address using Mapbox
      const places = await this.searchPlaces(address, {
        types: ['address', 'poi'],
        limit: 1
      });

      if (places.length === 0) {
        return {
          verified: false,
          globalComplexId: '',
          mapboxPlaceId: '',
          confidence: 0,
          conflictRisk: 'high'
        };
      }

      const place = places[0];
      
      // Generate global complex ID
      const globalComplexId = this.generateGlobalComplexId(place, name);

      // Check for existing complexes with the same global ID
      const existingComplexes = await this.checkExistingComplexes(globalComplexId, organizationId);

      return {
        verified: true,
        globalComplexId,
        mapboxPlaceId: place.id,
        confidence: place.relevance,
        conflictRisk: existingComplexes.length > 0 ? 'high' : 'low',
        existingComplexes
      };

    } catch (error) {
      console.error('Error verifying complex address:', error);
      return {
        verified: false,
        globalComplexId: '',
        mapboxPlaceId: '',
        confidence: 0,
        conflictRisk: 'high'
      };
    }
  }

  /**
   * Generate a globally unique ID for a complex based on location
   */
  private generateGlobalComplexId(place: MapboxPlace, name: string): string {
    const [longitude, latitude] = place.center;
    
    // Extract location components from context
    let city = '';
    let state = '';
    let country = '';

    if (place.context) {
      place.context.forEach(context => {
        if (context.id.includes('place')) {
          city = context.text;
        } else if (context.id.includes('region')) {
          state = context.short_code || context.text;
        } else if (context.id.includes('country')) {
          country = context.text;
        }
      });
    }

    // Create normalized components
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const normalizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedState = state.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCountry = country.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Round coordinates to reduce precision for grouping nearby locations
    const roundedLat = Math.round(latitude * 1000) / 1000;
    const roundedLng = Math.round(longitude * 1000) / 1000;

    return `${normalizedCountry}_${normalizedState}_${normalizedCity}_${normalizedName}_${roundedLat}_${roundedLng}`;
  }

  /**
   * Check for existing complexes with the same global ID
   */
  private async checkExistingComplexes(
    globalComplexId: string,
    organizationId: number
  ): Promise<Array<{
    id: number;
    name: string;
    organizationId: number;
    distance: number;
  }>> {
    try {
      const response = await fetch(`/api/admin/complexes/check-conflicts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalComplexId,
          organizationId
        })
      });

      if (!response.ok) {
        console.warn('Failed to check for complex conflicts');
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking existing complexes:', error);
      return [];
    }
  }

  /**
   * Register a complex in the global registry
   */
  async registerComplexGlobally(
    globalComplexId: string,
    name: string,
    address: string,
    mapboxPlace: MapboxPlace
  ): Promise<boolean> {
    try {
      const [longitude, latitude] = mapboxPlace.center;
      
      // Extract location components
      let city = '';
      let state = '';
      let country = '';

      if (mapboxPlace.context) {
        mapboxPlace.context.forEach(context => {
          if (context.id.includes('place')) {
            city = context.text;
          } else if (context.id.includes('region')) {
            state = context.short_code || context.text;
          } else if (context.id.includes('country')) {
            country = context.text;
          }
        });
      }

      const response = await fetch('/api/admin/complexes/register-global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalComplexId,
          canonicalName: name,
          canonicalAddress: address,
          mapboxPlaceId: mapboxPlace.id,
          latitude,
          longitude,
          country,
          stateProvince: state,
          city
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error registering complex globally:', error);
      return false;
    }
  }

  /**
   * Get global registry information for a complex
   */
  async getGlobalRegistryInfo(globalComplexId: string): Promise<GlobalComplexRegistry | null> {
    try {
      const response = await fetch(`/api/admin/complexes/global-registry/${encodeURIComponent(globalComplexId)}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching global registry info:', error);
      return null;
    }
  }

  /**
   * Check if Mapbox service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const mapboxService = new MapboxService();