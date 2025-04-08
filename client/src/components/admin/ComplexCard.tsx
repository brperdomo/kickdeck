import React, { useState } from 'react';
import { Complex, Field } from '@/types/index';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatHours, getGoogleMapsUrl, getDirectionsUrl, hasValidCoordinates } from '@/lib/format-address';
import { useGoogleMapsScript } from '@/hooks/use-google-maps-script';
import { MapPin, Clock, Globe, Mail, Phone, Edit, Trash, ChevronDown, ChevronUp, Map, Navigation } from 'lucide-react';

interface ComplexCardProps {
  complex: Complex;
  fields?: Field[];
  onEdit?: (complex: Complex) => void;
  onDelete?: (complex: Complex) => void;
  showActions?: boolean;
  expandedByDefault?: boolean;
  showMap?: boolean;
}

export default function ComplexCard({
  complex,
  fields = [],
  onEdit,
  onDelete,
  showActions = true,
  expandedByDefault = false,
  showMap = true
}: ComplexCardProps) {
  const [expanded, setExpanded] = useState(expandedByDefault);
  const { loaded: mapsLoaded } = useGoogleMapsScript({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const handleEdit = () => {
    if (onEdit) onEdit(complex);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(complex);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const renderContactInfo = () => (
    <div className="mt-4 space-y-2 text-sm">
      {complex.phoneNumber && (
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
          <a href={`tel:${complex.phoneNumber}`} className="hover:underline">
            {complex.phoneNumber}
          </a>
        </div>
      )}
      {complex.email && (
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <a href={`mailto:${complex.email}`} className="hover:underline">
            {complex.email}
          </a>
        </div>
      )}
      {complex.website && (
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
          <a 
            href={complex.website.startsWith('http') ? complex.website : `https://${complex.website}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {complex.website}
          </a>
        </div>
      )}
    </div>
  );

  const renderFieldList = () => {
    if (fields.length === 0) return null;
    
    return (
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="fields">
          <AccordionTrigger>
            <span className="text-sm font-medium">Fields ({fields.length})</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.id} className="p-3 bg-muted rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{field.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {field.fieldType} • {field.fieldSize} • {field.surfaceType}
                      </div>
                      {(field.length || field.width) && (
                        <div className="text-sm mt-1">
                          Dimensions: {field.length || '?'} x {field.width || '?'}
                        </div>
                      )}
                      {field.notes && <div className="text-sm mt-1">{field.notes}</div>}
                    </div>
                    <div>
                      <Badge variant={field.isActive ? "default" : "outline"}>
                        {field.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {field.lighting && (
                        <Badge variant="outline" className="ml-2">
                          Lighting
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  const renderMap = () => {
    if (!showMap || !hasValidCoordinates(complex)) return null;

    // Static map fallback if Google Maps API is not loaded
    return (
      <div className="mt-4 rounded-md overflow-hidden h-48 relative border">
        {mapsLoaded ? (
          <iframe
            title={`Map of ${complex.name}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            src={`https://www.google.com/maps/embed/v1/place?key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            }&q=${complex.latitude},${complex.longitude}&zoom=14`}
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center p-4">
              <Map className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Map loading...</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <a
            href={getGoogleMapsUrl(complex)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90"
            title="View on Google Maps"
          >
            <Map className="h-4 w-4" />
          </a>
          <a
            href={getDirectionsUrl(complex)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90"
            title="Get Directions"
          >
            <Navigation className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{complex.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{formatAddress(complex)}</span>
              </div>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{formatHours(complex)}</span>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {complex.shared && (
              <Badge variant="secondary" className="ml-auto">
                Shared
              </Badge>
            )}
            {showActions && (
              <>
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={handleEdit} title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete">
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Show basic info */}
        {complex.description && <p className="text-sm mb-4">{complex.description}</p>}
        
        {/* Display directions if available */}
        {complex.directions && (
          <div className="mt-2 mb-4">
            <h4 className="text-sm font-medium mb-1">Directions:</h4>
            <p className="text-sm">{complex.directions}</p>
          </div>
        )}
        
        {/* Show map only if expanded or expandedByDefault */}
        {expanded && (
          <>
            {renderContactInfo()}
            {renderMap()}
            {renderFieldList()}
          </>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-center text-sm" 
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> Show More
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}