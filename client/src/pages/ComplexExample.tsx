import { useState } from 'react';
import { ComplexCard } from '@/components/admin/ComplexCard';
import { Complex } from '@/types/complex';
import { Field } from '@/types/field';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Example complex data
const exampleComplex: Complex = {
  id: 1,
  name: "Main Soccer Complex",
  address: "123 Sports Way",
  city: "Soccer City",
  state: "SC",
  country: "USA",
  latitude: "37.7749",
  longitude: "-122.4194",
  openTime: "08:00",
  closeTime: "20:00",
  isOpen: true,
  isShared: true,
  shared_id: "complex-abc-123",
  directions: "Enter through the main gates, parking available on the east side.",
  rules: "No pets allowed. Please clean up after your games.",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Example field data
const exampleFields: Field[] = [
  {
    id: 1,
    name: "Field A",
    complexId: 1,
    fieldType: "Soccer",
    fieldSize: "Full",
    surfaceType: "Grass",
    isLighted: true,
    isOpen: true,
    notes: "Premier field with seating for 200 spectators",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Field B",
    complexId: 1,
    fieldType: "Soccer",
    fieldSize: "Full",
    surfaceType: "Turf",
    isLighted: true,
    isOpen: true,
    notes: "All-weather turf field",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Field C",
    complexId: 1,
    fieldType: "Soccer",
    fieldSize: "7v7",
    surfaceType: "Grass",
    isLighted: false,
    isOpen: false,
    notes: "Closed for maintenance",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function ComplexExample() {
  const { toast } = useToast();
  const [showMap, setShowMap] = useState(true);
  
  const handleEdit = () => {
    toast({
      title: "Edit Complex",
      description: "Would open the complex editor",
    });
  };
  
  const handleViewDetails = () => {
    toast({
      title: "View Details",
      description: "Would navigate to complex details page",
    });
  };
  
  return (
    <div className="container py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Field Complex Visual Display <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-muted-foreground mb-2">
              This example demonstrates the visual approach to displaying field complex information. 
              The card shows key details like location, opening hours, and field counts, with optional 
              Google Maps integration.
            </p>
            
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant={showMap ? "default" : "outline"}
                onClick={() => setShowMap(true)}
                size="sm"
              >
                Show with Map
              </Button>
              <Button
                variant={!showMap ? "default" : "outline"}
                onClick={() => setShowMap(false)}
                size="sm"
              >
                Hide Map
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComplexCard 
              complex={exampleComplex}
              fields={exampleFields}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              showMap={showMap}
            />
            
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Feature Highlights</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Visual representation of complex details</li>
                    <li>Google Maps integration (when API key is provided)</li>
                    <li>Direct links to map view and directions</li>
                    <li>Field count with open/closed status</li>
                    <li>Shared status indicator for cross-instance complexes</li>
                    <li>Responsive design that works on mobile and desktop</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    The complex card component is designed to work with the field complex data structure, 
                    which now includes sharing capabilities through the <code>isShared</code> and <code>shared_id</code> fields.
                  </p>
                  <p>
                    To enable Google Maps integration, provide a valid Google Maps API key in your environment 
                    variables as <code>VITE_GOOGLE_MAPS_API_KEY</code>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}