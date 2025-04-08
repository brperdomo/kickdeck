/**
 * Visual card component for displaying complex details
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Globe, Info, LocateFixed, FileText, ArrowUpRight, Pencil } from 'lucide-react';
import { Complex } from '@/types/complex';
import { Field } from '@/types/field';
import { formatAddress, formatTimeRange, getGoogleMapsUrl, getDirectionsUrl } from '@/lib/format-address';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
  }
}

interface ComplexCardProps {
  complex: Complex;
  fields?: Field[];
  onEdit?: () => void;
  onViewDetails?: () => void;
  showMap?: boolean;
  mapSize?: { width: string; height: string };
}

/**
 * A card component to display field complex details with a more visual approach
 */
export function ComplexCard({ 
  complex, 
  fields = [], 
  onEdit, 
  onViewDetails,
  showMap = true,
  mapSize = { width: '100%', height: '200px' }
}: ComplexCardProps) {
  const { toast } = useToast();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  
  // Load Google Maps API if not already loaded
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      setMapApiLoaded(true);
      return;
    }
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    console.log(`Google Maps API key length: ${apiKey.length} characters`);
    
    if (!apiKey && showMap) {
      toast({
        title: 'Google Maps API Key Missing',
        description: 'A Google Maps API key is required to display maps.',
        variant: 'destructive',
      });
      return;
    }
    
    // Load the Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapApiLoaded(true);
    };
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [showMap, toast]);
  
  // Initialize map when API is loaded and container is available
  useEffect(() => {
    if (!mapApiLoaded || !showMap || mapInitialized) return;
    
    const mapContainer = document.getElementById(`map-${complex.id}`);
    if (!mapContainer) return;
    
    try {
      // Parse latitude and longitude
      const lat = parseFloat(complex.latitude);
      const lng = parseFloat(complex.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        toast({
          title: 'Invalid Coordinates',
          description: 'The complex coordinates are invalid.',
          variant: 'destructive',
        });
        return;
      }
      
      // Create map
      const googleMap = new window.google.maps.Map(mapContainer, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      // Add marker for the complex
      new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        title: complex.name,
      });
      
      setMap(googleMap);
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: 'Map Error',
        description: 'Failed to initialize the map.',
        variant: 'destructive',
      });
    }
  }, [complex, mapApiLoaded, showMap, mapInitialized, toast]);
  
  // Format the address
  const addressLines = formatAddress({
    address: complex.address,
    city: complex.city,
    state: complex.state,
    country: complex.country,
  });
  
  // Format time range
  const hours = formatTimeRange(complex.openTime, complex.closeTime);
  
  // Get number of open fields
  const openFields = fields.filter(field => field.isOpen).length;
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {showMap && (
        <div 
          id={`map-${complex.id}`} 
          className="w-full bg-muted" 
          style={{ 
            height: mapSize.height, 
            width: mapSize.width 
          }}
        />
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{complex.name}</CardTitle>
          <Badge variant={complex.isOpen ? 'default' : 'secondary'}>
            {complex.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-2 flex-grow">
        {/* Address */}
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          <div className="text-sm space-y-1">
            {addressLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
            <div className="flex gap-2 mt-1">
              <a 
                href={getGoogleMapsUrl({ latitude: complex.latitude, longitude: complex.longitude })} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center hover:underline"
              >
                <Globe className="h-3 w-3 mr-1" />
                View on Maps
              </a>
              <a 
                href={getDirectionsUrl({ latitude: complex.latitude, longitude: complex.longitude })} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center hover:underline"
              >
                <LocateFixed className="h-3 w-3 mr-1" />
                Directions
              </a>
            </div>
          </div>
        </div>
        
        {/* Hours */}
        <div className="flex items-start space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <div>Hours: {hours}</div>
          </div>
        </div>
        
        {/* Fields */}
        {fields.length > 0 && (
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <div>
                {fields.length} field{fields.length !== 1 ? 's' : ''} 
                {openFields !== fields.length && ` (${openFields} open)`}
              </div>
            </div>
          </div>
        )}
        
        {/* Shared status */}
        {complex.isShared && (
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">Shared</Badge>
                <span className="text-xs text-muted-foreground">Available across instances</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="ml-auto">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}