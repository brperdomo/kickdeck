import React, { useState } from "react";
import { MapPin, Clock, Users, Loader2, MoreHorizontal, Edit, Eye, MapIcon, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatAddress } from "@/lib/format-address";
import { cn } from "@/lib/utils";

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

interface ComplexCardProps {
  complex: Complex;
  onEditComplex: (complex: Complex) => void;
  onViewFields: (complexId: number) => void;
  isExpanded?: boolean;
  isViewingFields?: boolean;
  onAddField?: () => void;
  fields?: any[];
  fieldsLoading?: boolean;
  onEditField?: (field: any) => void;
}

export function ComplexCard({ 
  complex, 
  onEditComplex, 
  onViewFields, 
  isExpanded = false,
  isViewingFields = false,
  onAddField,
  fields = [],
  fieldsLoading = false,
  onEditField
}: ComplexCardProps) {
  const [showMap, setShowMap] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const hasCoordinates = complex.latitude && complex.longitude;
  const fieldCount = complex.fields?.length || 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 border-l-primary">
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-xl font-bold">{complex.name}</h3>
              <Badge 
                variant={complex.isOpen ? "default" : "destructive"}
                className={cn("ml-3", complex.isOpen ? "bg-green-100 text-green-800 hover:bg-green-100" : "")}
              >
                {complex.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{formatAddress(complex)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-muted-foreground hover:text-foreground"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  More
                </>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditComplex(complex)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Complex
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewFields(complex.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {isViewingFields ? 'Hide Fields' : 'View Fields'}
                </DropdownMenuItem>
                {hasCoordinates && (
                  <DropdownMenuItem onClick={() => setShowMap(!showMap)}>
                    <MapIcon className="mr-2 h-4 w-4" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex items-center p-2 bg-muted/50 rounded-md">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            <div>
              <span className="text-sm font-medium">Operating Hours</span>
              <p className="text-sm text-muted-foreground">{complex.openTime} - {complex.closeTime}</p>
            </div>
          </div>
          
          <div className="flex items-center p-2 bg-muted/50 rounded-md">
            <Users className="h-5 w-5 mr-2 text-primary" />
            <div>
              <span className="text-sm font-medium">Fields Available</span>
              <p className="text-sm text-muted-foreground">{fieldCount} total fields</p>
            </div>
          </div>
        </div>
        
        {/* Expanded details section */}
        {showDetails && (
          <div className={cn("mt-4 space-y-4 transition-all", 
            showDetails ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            {/* Conditionally rendered map */}
            {hasCoordinates && (
              <div className={cn("bg-muted rounded-md overflow-hidden transition-all duration-300",
                showMap ? "h-60" : "h-0"
              )}>
                {showMap && (
                  <iframe
                    title={`Map for ${complex.name}`}
                    className="w-full h-full rounded-md"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY || ''}&q=${complex.latitude},${complex.longitude}&zoom=15`}
                    allowFullScreen
                  />
                )}
              </div>
            )}
            
            {/* Directions section */}
            {complex.directions && (
              <div className="p-3 border rounded-md">
                <h4 className="text-sm font-medium mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  Directions
                </h4>
                <p className="text-sm text-muted-foreground">{complex.directions}</p>
              </div>
            )}
            
            {/* Rules section */}
            {complex.rules && (
              <div className="p-3 border rounded-md">
                <h4 className="text-sm font-medium mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  Complex Rules
                </h4>
                <p className="text-sm text-muted-foreground">{complex.rules}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Fields section */}
        {isViewingFields && (
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium">Fields ({fields.length})</h3>
              {onAddField && (
                <Button 
                  onClick={onAddField} 
                  size="sm" 
                  variant="outline"
                  className="h-8"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Add Field
                </Button>
              )}
            </div>
            
            {fieldsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-6 bg-muted/30 rounded-md">
                <p className="text-sm text-muted-foreground">No fields available for this complex</p>
                {onAddField && (
                  <Button 
                    onClick={onAddField} 
                    size="sm" 
                    variant="link"
                    className="mt-1 h-auto p-0"
                  >
                    Add your first field
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                {fields.map((field) => (
                  <div 
                    key={field.id} 
                    className="flex justify-between items-center p-3 border rounded-md hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">{field.name}</p>
                        <Badge 
                          variant={field.isOpen ? "default" : "destructive"} 
                          className={cn("ml-2", field.isOpen ? "bg-green-100 text-green-800 hover:bg-green-100" : "")}
                        >
                          {field.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          {field.hasLights 
                            ? <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                Has lights
                              </span>
                            : <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 mr-1"></span>
                                No lights
                              </span>
                          }
                        </span>
                        <span className="flex items-center">
                          {field.hasParking 
                            ? <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                Parking available
                              </span>
                            : <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 mr-1"></span>
                                No parking
                              </span>
                          }
                        </span>
                      </div>
                      {field.specialInstructions && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">
                          <span className="font-medium not-italic">Note:</span> {field.specialInstructions}
                        </p>
                      )}
                    </div>
                    {onEditField && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditField(field)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {!isViewingFields && (
        <CardFooter className="p-4 pt-0 flex justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEditComplex(complex)}
              className="h-9"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onViewFields(complex.id)}
              className="h-9"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Fields
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}