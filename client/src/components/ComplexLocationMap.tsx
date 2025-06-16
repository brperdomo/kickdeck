import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Users, ExternalLink } from 'lucide-react';
import { mapboxApiKey } from '@/lib/env';
import { formatAddress } from '@/lib/format-address';

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: string | null;
  longitude?: string | null;
  openTime: string;
  closeTime: string;
  rules?: string | null;
  directions?: string | null;
  isOpen: boolean;
  fields?: any[];
}

interface ComplexLocationMapProps {
  complexes: Complex[];
  height?: string;
  showControls?: boolean;
  selectedComplexId?: number;
  onComplexSelect?: (complex: Complex) => void;
}

export function ComplexLocationMap({ 
  complexes, 
  height = '400px',
  showControls = true,
  selectedComplexId,
  onComplexSelect 
}: ComplexLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter complexes that have coordinates
  const complexesWithCoords = complexes.filter(complex => 
    complex.latitude && complex.longitude && 
    !isNaN(parseFloat(complex.latitude)) && !isNaN(parseFloat(complex.longitude))
  );

  useEffect(() => {
    if (!mapboxApiKey) {
      setLoadError('Mapbox API key not configured');
      return;
    }

    if (!mapContainerRef.current || complexesWithCoords.length === 0) return;

    const loadMapbox = async () => {
      try {
        // Load Mapbox GL JS if not already loaded
        if (!(window as any).mapboxgl) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          });
        }

        // Initialize map
        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = mapboxApiKey;

        // Calculate center point from all complexes
        const bounds = new mapboxgl.LngLatBounds();
        complexesWithCoords.forEach(complex => {
          if (complex.latitude && complex.longitude) {
            bounds.extend([parseFloat(complex.longitude), parseFloat(complex.latitude)]);
          }
        });

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: bounds.getCenter(),
          zoom: 10
        });

        mapRef.current = map;

        map.on('load', () => {
          setMapLoaded(true);
          
          // Fit map to show all complexes
          if (complexesWithCoords.length > 1) {
            map.fitBounds(bounds, { 
              padding: 50,
              maxZoom: 15 
            });
          }

          // Add markers for each complex
          complexesWithCoords.forEach(complex => {
            if (!complex.latitude || !complex.longitude) return;

            const lng = parseFloat(complex.longitude);
            const lat = parseFloat(complex.latitude);

            // Create custom marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'complex-marker';
            markerElement.style.cssText = `
              width: 32px;
              height: 32px;
              background: ${complex.isOpen ? '#10b981' : '#ef4444'};
              border: 3px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              color: white;
              transition: transform 0.2s;
            `;
            markerElement.innerHTML = '●';

            // Add hover effect
            markerElement.addEventListener('mouseenter', () => {
              markerElement.style.transform = 'scale(1.2)';
            });
            markerElement.addEventListener('mouseleave', () => {
              markerElement.style.transform = 'scale(1)';
            });

            // Create popup content
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <div class="p-3">
                <h3 class="font-bold text-lg mb-2">${complex.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${formatAddress(complex)}</p>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs px-2 py-1 rounded ${complex.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${complex.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <span class="text-xs text-gray-600">${complex.openTime} - ${complex.closeTime}</span>
                </div>
                ${complex.fields ? `<p class="text-xs text-gray-600">${complex.fields.length} fields</p>` : ''}
              </div>
            `;

            const popup = new mapboxgl.Popup({ 
              offset: 25,
              closeButton: true,
              closeOnClick: false
            }).setDOMContent(popupContent);

            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(map);

            // Handle marker click
            markerElement.addEventListener('click', () => {
              setSelectedComplex(complex);
              onComplexSelect?.(complex);
              popup.addTo(map);
            });

            markersRef.current.push(marker);
          });
        });

        map.on('error', (e: any) => {
          console.error('Mapbox error:', e);
          setLoadError('Failed to load map');
        });

      } catch (error) {
        console.error('Error loading Mapbox:', error);
        setLoadError('Failed to initialize map');
      }
    };

    loadMapbox();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [complexes, mapboxApiKey]);

  // Highlight selected complex
  useEffect(() => {
    if (selectedComplexId && mapRef.current) {
      const complex = complexesWithCoords.find(c => c.id === selectedComplexId);
      if (complex && complex.latitude && complex.longitude) {
        const lng = parseFloat(complex.longitude);
        const lat = parseFloat(complex.latitude);
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        });
        setSelectedComplex(complex);
      }
    }
  }, [selectedComplexId, complexesWithCoords]);

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Failed to load map</p>
            <p className="text-sm text-gray-600 mt-1">{loadError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (complexesWithCoords.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No complex locations available</p>
            <p className="text-sm mt-1">Complexes need coordinates to appear on the map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Complex Locations
            </CardTitle>
            <Badge variant="outline">
              {complexesWithCoords.length} location{complexesWithCoords.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapContainerRef}
            style={{ height }}
            className="w-full rounded-b-lg overflow-hidden"
          />
        </CardContent>
      </Card>

      {selectedComplex && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedComplex.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={selectedComplex.isOpen ? "default" : "destructive"}>
                  {selectedComplex.isOpen ? "Open" : "Closed"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const address = encodeURIComponent(formatAddress(selectedComplex));
                    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Directions
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                <span className="text-sm">{formatAddress(selectedComplex)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {selectedComplex.openTime} - {selectedComplex.closeTime}
                </span>
              </div>

              {selectedComplex.fields && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {selectedComplex.fields.length} field{selectedComplex.fields.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {selectedComplex.directions && (
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-1">Directions</h4>
                  <p className="text-sm text-gray-600">{selectedComplex.directions}</p>
                </div>
              )}

              {selectedComplex.rules && (
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-1">Rules</h4>
                  <p className="text-sm text-gray-600">{selectedComplex.rules}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}