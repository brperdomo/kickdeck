import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  GripVertical, 
  MapPin, 
  Clock, 
  Lightbulb, 
  Save, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  sortOrder: number;
  hasLights: boolean;
  isOpen: boolean;
  isActive?: boolean;
  firstGameTime?: string;
  lastGameTime?: string;
  complexName?: string;
}

interface FieldSortingManagerProps {
  fields: Field[];
  onFieldsReordered: (fields: Field[]) => void;
  eventId: string;
}

const FIELD_SIZE_OPTIONS = [
  { value: '4v4', label: '4v4 (Mini Field)' },
  { value: '7v7', label: '7v7 (Small Field)' },
  { value: '9v9', label: '9v9 (Medium Field)' },
  { value: '11v11', label: '11v11 (Full Field)' }
];

export default function FieldSortingManager({ 
  fields: initialFields, 
  onFieldsReordered, 
  eventId 
}: FieldSortingManagerProps) {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFieldSizeWarning, setShowFieldSizeWarning] = useState(false);

  // Track original field sizes to detect changes
  const originalFieldSizesRef = useRef<Map<number, string>>(
    new Map(initialFields.map(f => [f.id, f.fieldSize]))
  );

  // Update original sizes when parent re-fetches after a save
  useEffect(() => {
    originalFieldSizesRef.current = new Map(initialFields.map(f => [f.id, f.fieldSize]));
  }, [initialFields]);

  // Bulk update field configurations
  const updateFieldsMutation = useMutation({
    mutationFn: async (updatedFields: Field[]) => {
      console.log('🔄 FIELD UPDATE: Submitting field changes to API');
      
      // Update field sizes, active status, and time controls
      const fieldUpdates = updatedFields.map(field => ({
        id: field.id,
        fieldSize: field.fieldSize,
        isActive: field.isActive ?? field.isOpen,
        sortOrder: field.sortOrder,
        firstGameTime: field.firstGameTime,
        lastGameTime: field.lastGameTime
      }));

      // First update individual field properties
      const updatePromises = fieldUpdates.map(async (fieldUpdate) => {
        const response = await fetch(`/api/admin/field-config/events/${eventId}/fields/${fieldUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fieldSize: fieldUpdate.fieldSize,
            isActive: fieldUpdate.isActive,
            sortOrder: fieldUpdate.sortOrder,
            firstGameTime: fieldUpdate.firstGameTime,
            lastGameTime: fieldUpdate.lastGameTime
          })
        });
        
        if (!response.ok) {
          // Fallback to global fields API if event-specific fails
          const globalResponse = await fetch(`/api/admin/fields/sort-order`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              fieldUpdates: [{ id: fieldUpdate.id, sortOrder: fieldUpdate.sortOrder }]
            })
          });
          
          if (!globalResponse.ok) {
            throw new Error(`Failed to update field ${fieldUpdate.id}`);
          }
          return globalResponse.json();
        }
        return response.json();
      });

      await Promise.all(updatePromises);
      return { success: true };
    },
    onSuccess: () => {
      // Check if field sizes actually changed in this save
      const hadSizeChanges = fields.some(f => {
        const original = originalFieldSizesRef.current.get(f.id);
        return original && original !== f.fieldSize;
      });

      // Update ref with new sizes
      originalFieldSizesRef.current = new Map(fields.map(f => [f.id, f.fieldSize]));

      if (hadSizeChanges) {
        toast({
          title: "Field Sizes Updated — Schedule Cleared",
          description: "Field sizes were changed. All scheduled games have been cleared. Please regenerate the schedule from the Setup tab.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Field Configuration Updated",
          description: "Field sizes, order, and availability have been saved successfully."
        });
      }
      setHasChanges(false);
      onFieldsReordered(fields);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update field configuration",
        variant: "destructive"
      });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newFields = Array.from(fields);
    const [reorderedField] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, reorderedField);

    // Update sort orders based on new positions
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      sortOrder: index
    }));

    setFields(updatedFields);
    setHasChanges(true);
  };

  const handleFieldSizeChange = (fieldId: number, newFieldSize: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, fieldSize: newFieldSize } : field
    );
    setFields(updatedFields);
    setHasChanges(true);
  };

  const handleFieldActiveChange = (fieldId: number, isActive: boolean) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, isActive, isOpen: isActive } : field
    );
    setFields(updatedFields);
    setHasChanges(true);
  };

  const handleTimeChange = (fieldId: number, timeType: 'firstGameTime' | 'lastGameTime', value: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId 
        ? { ...field, [timeType]: value }
        : field
    );
    setFields(updatedFields);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // Check if any field sizes actually changed
    const sizeChanges = fields.filter(f => {
      const original = originalFieldSizesRef.current.get(f.id);
      return original && original !== f.fieldSize;
    });

    if (sizeChanges.length > 0) {
      // Show confirmation dialog before saving
      setShowFieldSizeWarning(true);
      return;
    }

    updateFieldsMutation.mutate(fields);
  };

  const handleConfirmSaveWithSizeChange = () => {
    setShowFieldSizeWarning(false);
    updateFieldsMutation.mutate(fields);
  };

  const handleResetChanges = () => {
    setFields(initialFields);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {hasChanges && (
        <Alert className="border-yellow-600 bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-yellow-200">
              You have unsaved changes to field configuration.
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleResetChanges}
                className="border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveChanges}
                disabled={updateFieldsMutation.isPending}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                {updateFieldsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Field Order Management */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            Field Order & Configuration
          </CardTitle>
          <p className="text-slate-300 text-sm">
            Drag fields to reorder them for the Master Scheduler. Configure field sizes and availability for this tournament.
          </p>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {fields.map((field, index) => (
                    <Draggable
                      key={field.id}
                      draggableId={field.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg p-4 transition-colors ${
                            snapshot.isDragging
                              ? 'bg-slate-700 border-blue-500 shadow-lg'
                              : 'bg-slate-750 border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-5 w-5 text-slate-400" />
                            </div>

                            {/* Field Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {field.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-slate-600 text-slate-300"
                                >
                                  Position {index + 1}
                                </Badge>
                                {field.hasLights && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs border-yellow-600 text-yellow-300"
                                  >
                                    <Lightbulb className="h-3 w-3 mr-1" />
                                    Lights
                                  </Badge>
                                )}
                              </div>
                              {field.complexName && (
                                <p className="text-xs text-slate-400">
                                  {field.complexName}
                                </p>
                              )}
                            </div>

                            {/* Field Size Selector */}
                            <div className="w-40">
                              <Select
                                value={field.fieldSize}
                                onValueChange={(value) => handleFieldSizeChange(field.id, value)}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                  {FIELD_SIZE_OPTIONS.map((option) => (
                                    <SelectItem 
                                      key={option.value} 
                                      value={option.value}
                                      className="text-slate-200 focus:bg-slate-600"
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Time Controls */}
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <Label className="text-xs text-slate-400">OPEN</Label>
                                <Input
                                  type="time"
                                  value={field.firstGameTime || ''}
                                  onChange={(e) => handleTimeChange(field.id, 'firstGameTime', e.target.value)}
                                  className="w-20 h-8 bg-slate-700 border-slate-600 text-slate-200 text-xs"
                                  placeholder="08:00"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Label className="text-xs text-slate-400">LAST GAME</Label>
                                <Input
                                  type="time"
                                  value={field.lastGameTime || ''}
                                  onChange={(e) => handleTimeChange(field.id, 'lastGameTime', e.target.value)}
                                  className="w-20 h-8 bg-slate-700 border-slate-600 text-slate-200 text-xs"
                                  placeholder="20:00"
                                />
                              </div>
                            </div>

                            {/* Active/Inactive Toggle */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.isActive ?? field.isOpen}
                                onCheckedChange={(checked) => handleFieldActiveChange(field.id, checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <span className="text-xs text-slate-300 w-12">
                                {field.isActive ?? field.isOpen ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            {/* Status Indicator */}
                            <div className="w-6 flex justify-center">
                              {field.isActive ?? field.isOpen ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {fields.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No fields configured for this event.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300 text-sm">Total Fields</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{fields.length}</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-slate-300 text-sm">Active Fields</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {fields.filter(f => f.isActive ?? f.isOpen).length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <span className="text-slate-300 text-sm">Lighted Fields</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {fields.filter(f => f.hasLights).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Field Size Change Warning Dialog */}
      <AlertDialog open={showFieldSizeWarning} onOpenChange={setShowFieldSizeWarning}>
        <AlertDialogContent className="bg-slate-800 border-slate-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Field Size Changes Will Clear Schedule
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 space-y-2">
              <p>
                You are changing field sizes for this event. This will <strong className="text-red-400">clear all currently scheduled games</strong> because
                game-to-field assignments depend on field sizes matching age group requirements.
              </p>
              <p>
                After saving, you will need to <strong className="text-white">regenerate the schedule</strong> from the Setup tab.
              </p>
              <div className="mt-3 rounded-md bg-slate-700/50 border border-slate-600 p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fields being changed:</p>
                {fields
                  .filter(f => {
                    const original = originalFieldSizesRef.current.get(f.id);
                    return original && original !== f.fieldSize;
                  })
                  .map(f => (
                    <p key={f.id} className="text-sm text-slate-200">
                      {f.name}: <span className="text-red-400 line-through">{originalFieldSizesRef.current.get(f.id)}</span>
                      {' '}<span className="text-green-400">{f.fieldSize}</span>
                    </p>
                  ))
                }
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-200 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSaveWithSizeChange}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Clear Games & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}