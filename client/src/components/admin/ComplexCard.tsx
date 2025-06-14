import React, { useState } from "react";
import { MapPin, Clock, Users, Loader2, MoreHorizontal, Edit, Eye, MapIcon, ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react";
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
import { motion } from "framer-motion";

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
  onDeleteComplex?: (complexId: number) => void;
  onViewFields: (complexId: number) => void;
  isExpanded?: boolean;
  isViewingFields?: boolean;
  onAddField?: () => void;
  fields?: any[];
  fieldsLoading?: boolean;
  onEditField?: (field: any) => void;
  onDeleteField?: (fieldId: number) => void;
}

export function ComplexCard({ 
  complex, 
  onEditComplex, 
  onDeleteComplex,
  onViewFields, 
  isExpanded = false,
  isViewingFields = false,
  onAddField,
  fields = [],
  fieldsLoading = false,
  onEditField,
  onDeleteField
}: ComplexCardProps) {
  const [showMap, setShowMap] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const hasCoordinates = complex.latitude && complex.longitude;
  const fieldCount = complex.fields?.length || 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:bg-gray-900/60 border-l-4 border-l-primary relative">
      {/* Enhanced gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800/80 pointer-events-none rounded-r-lg"></div>
      
      <CardHeader className="p-4 pb-3 relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900/90">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <motion.h3 
                className="text-xl font-bold text-white px-2 py-0.5 rounded bg-primary/30 shadow-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {complex.name}
              </motion.h3>
              <Badge 
                variant={complex.isOpen ? "outline" : "destructive"}
                className={cn("ml-3", complex.isOpen 
                  ? "bg-green-950/40 text-green-400 hover:bg-green-950/60 border-green-800" 
                  : "bg-red-950/40 border-red-800")}
              >
                {complex.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex items-center text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-indigo-400" />
              <span className="truncate text-gray-200">{formatAddress(complex)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-muted-foreground hover:text-foreground hover:bg-gray-800/50"
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
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800/50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => onEditComplex(complex)}>
                  <Edit className="mr-2 h-4 w-4 text-indigo-400" />
                  Edit Complex
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewFields(complex.id)}>
                  <Eye className="mr-2 h-4 w-4 text-indigo-400" />
                  {isViewingFields ? 'Hide Fields' : 'View Fields'}
                </DropdownMenuItem>
                {hasCoordinates && (
                  <DropdownMenuItem onClick={() => setShowMap(!showMap)}>
                    <MapIcon className="mr-2 h-4 w-4 text-indigo-400" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </DropdownMenuItem>
                )}
                {onDeleteComplex && (
                  <DropdownMenuItem 
                    onClick={() => onDeleteComplex(complex.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Complex
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 relative z-10">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <motion.div 
            className="flex items-center p-3 rounded-md bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-md"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Clock className="h-5 w-5 mr-2 text-indigo-400" />
            <div>
              <span className="text-sm font-medium text-gray-100">Operating Hours</span>
              <p className="text-sm text-gray-300">{complex.openTime} - {complex.closeTime}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center p-3 rounded-md bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-md"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Users className="h-5 w-5 mr-2 text-indigo-400" />
            <div>
              <span className="text-sm font-medium text-gray-100">Fields Available</span>
              <p className="text-sm text-gray-300">{fieldCount} total fields</p>
            </div>
          </motion.div>
        </div>
        
        {/* Expanded details section */}
        <motion.div 
          className="mt-4 space-y-4"
          initial={false}
          animate={{ 
            height: showDetails ? 'auto' : 0,
            opacity: showDetails ? 1 : 0,
            marginTop: showDetails ? 16 : 0
          }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {/* Conditionally rendered map */}
          {hasCoordinates && (
            <motion.div 
              className="bg-gray-800 rounded-md overflow-hidden shadow-lg border border-gray-700/50"
              initial={false}
              animate={{ 
                height: showMap ? 240 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {showMap && (
                <iframe
                  title={`Map for ${complex.name}`}
                  className="w-full h-full rounded-md"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY || ''}&q=${complex.latitude},${complex.longitude}&zoom=15`}
                  allowFullScreen
                />
              )}
            </motion.div>
          )}
          
          {/* Directions section */}
          {complex.directions && (
            <div className="p-4 border border-gray-700/50 rounded-md bg-gray-800/80">
              <h4 className="text-sm font-semibold mb-2 flex items-center text-indigo-300">
                <MapPin className="h-4 w-4 mr-1 text-indigo-400" />
                Directions
              </h4>
              <p className="text-sm text-gray-300">{complex.directions}</p>
            </div>
          )}
          
          {/* Rules section */}
          {complex.rules && (
            <div className="p-4 border border-gray-700/50 rounded-md bg-gray-800/80">
              <h4 className="text-sm font-semibold mb-2 flex items-center text-indigo-300">
                <MapPin className="h-4 w-4 mr-1 text-indigo-400" />
                Complex Rules
              </h4>
              <p className="text-sm text-gray-300">{complex.rules}</p>
            </div>
          )}
        </motion.div>
        
        {/* Fields section */}
        {isViewingFields && (
          <div className="mt-4 border-t border-gray-700/50 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-white bg-gray-800 px-2 py-1 rounded inline-flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-indigo-400" />
                Fields <span className="ml-1 bg-primary/30 text-white text-xs px-1.5 py-0.5 rounded-full">{fields.length}</span>
              </h3>
              {onAddField && (
                <Button 
                  onClick={onAddField} 
                  size="sm" 
                  variant="outline"
                  className="h-8 border-indigo-500/50 hover:border-indigo-400 bg-gray-800/80 hover:bg-gray-700/80"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                  Add Field
                </Button>
              )}
            </div>
            
            {fieldsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-6 bg-gray-800/50 rounded-md border border-gray-700/50">
                <p className="text-sm text-gray-200">No fields available for this complex</p>
                {onAddField && (
                  <Button 
                    onClick={onAddField} 
                    size="sm" 
                    variant="link"
                    className="mt-1 h-auto p-0 text-indigo-400 hover:text-indigo-300"
                  >
                    Add your first field
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                {fields.map((field) => (
                  <motion.div 
                    key={field.id} 
                    className="flex justify-between items-center p-3 border border-gray-700/50 rounded-md bg-gray-800/60 hover:bg-gray-800/90 hover:border-indigo-500/30 transition-colors"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-white px-1.5 py-0.5 rounded bg-primary/20 inline-block">{field.name}</p>
                        <Badge 
                          variant={field.isOpen ? "outline" : "destructive"} 
                          className={cn("ml-2", field.isOpen 
                            ? "bg-green-950/40 text-green-400 hover:bg-green-950/60 border-green-800" 
                            : "bg-red-950/40 border-red-800")}
                        >
                          {field.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-300 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-indigo-400" />
                          {field.openTime && field.closeTime 
                            ? `${field.openTime} - ${field.closeTime}`
                            : "No hours set"
                          }
                        </span>
                        <span className="flex items-center">
                          {field.hasLights 
                            ? <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                Has lights
                              </span>
                            : <span className="flex items-center">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 mr-1"></span>
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
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 mr-1"></span>
                                No parking
                              </span>
                          }
                        </span>
                      </div>
                      {field.specialInstructions && (
                        <p className="text-xs text-gray-300 mt-1.5 italic">
                          <span className="font-medium not-italic text-indigo-400">Note:</span> {field.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {onEditField && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditField(field)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                          Edit
                        </Button>
                      )}
                      {onDeleteField && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteField(field.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {!isViewingFields && (
        <CardFooter className="p-4 pt-0 flex justify-end relative z-10">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEditComplex(complex)}
              className="h-9 border-gray-700 hover:border-gray-600 bg-gray-800/60 hover:bg-gray-800/90"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
              Edit
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onViewFields(complex.id)}
              className="h-9 bg-indigo-600/80 hover:bg-indigo-600"
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