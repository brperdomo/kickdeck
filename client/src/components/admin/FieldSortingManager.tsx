import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Save, RotateCcw, Settings, Clock, Power, PowerOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  sortOrder: number;
  hasLights: boolean;
  isOpen: boolean;
  isActive?: boolean;
  firstGameTime?: string;
  complexName?: string;
}

interface FieldSortingManagerProps {
  fields: Field[];
  onFieldsReordered: (fields: Field[]) => void;
  eventId?: string;
}

export default function FieldSortingManager({ fields, onFieldsReordered, eventId }: FieldSortingManagerProps) {
  const [sortableFields, setSortableFields] = useState<Field[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkTimeSettings, setBulkTimeSettings] = useState({
    '7v7': '',
    '9v9': '',
    '11v11': ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Sort fields by their current sortOrder, then by name
    const sorted = [...fields].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
    setSortableFields(sorted);
    setHasChanges(false);
  }, [fields]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedFields = Array.from(sortableFields);
    const [reorderedField] = reorderedFields.splice(sourceIndex, 1);
    reorderedFields.splice(destinationIndex, 0, reorderedField);

    // Update sort order for all fields
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      sortOrder: index
    }));

    setSortableFields(updatedFields);
    setHasChanges(true);
  };

  const resetOrder = () => {
    const sorted = [...fields].sort((a, b) => a.name.localeCompare(b.name));
    setSortableFields(sorted);
    setHasChanges(false);
  };

  const handleFieldSizeChange = async (fieldId: number, newSize: string) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/field-configurations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fieldId, 
          fieldSize: newSize 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update field size');
      }

      // Update local state
      const updatedFields = sortableFields.map(field => 
        field.id === fieldId ? { ...field, fieldSize: newSize } : field
      );
      setSortableFields(updatedFields);
      setHasChanges(true);

      toast({
        title: "Field Size Updated",
        description: `Field size changed to ${newSize}`,
      });
    } catch (error) {
      console.error('Error updating field size:', error);
      toast({
        title: "Error",
        description: "Failed to update field size. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFieldActiveChange = async (fieldId: number, isActive: boolean) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/field-configurations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fieldId, 
          isActive 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update field availability');
      }

      // Update local state
      const updatedFields = sortableFields.map(field => 
        field.id === fieldId ? { ...field, isActive } : field
      );
      setSortableFields(updatedFields);
      setHasChanges(true);

      toast({
        title: isActive ? "Field Enabled" : "Field Disabled",
        description: `Field ${isActive ? 'enabled for' : 'disabled from'} tournament use`,
      });
    } catch (error) {
      console.error('Error updating field availability:', error);
      toast({
        title: "Error",
        description: "Failed to update field availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFirstGameTimeChange = async (fieldId: number, time: string) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/field-configurations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fieldId, 
          firstGameTime: time 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update first game time');
      }

      // Update local state
      const updatedFields = sortableFields.map(field => 
        field.id === fieldId ? { ...field, firstGameTime: time } : field
      );
      setSortableFields(updatedFields);
      setHasChanges(true);

      toast({
        title: "First Game Time Updated",
        description: `First game time set to ${time}`,
      });
    } catch (error) {
      console.error('Error updating first game time:', error);
      toast({
        title: "Error",
        description: "Failed to update first game time. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkTimeAssignment = async () => {
    if (!eventId) return;
    
    const fieldsToUpdate = sortableFields.filter(field => 
      bulkTimeSettings[field.fieldSize as keyof typeof bulkTimeSettings]
    );

    if (fieldsToUpdate.length === 0) {
      toast({
        title: "No Fields to Update",
        description: "Please set times for at least one field size",
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = fieldsToUpdate.map(field => 
        fetch(`/api/admin/events/${eventId}/field-configurations`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            fieldId: field.id, 
            firstGameTime: bulkTimeSettings[field.fieldSize as keyof typeof bulkTimeSettings]
          }),
        })
      );

      await Promise.all(promises);

      // Update local state
      const updatedFields = sortableFields.map(field => ({
        ...field,
        firstGameTime: bulkTimeSettings[field.fieldSize as keyof typeof bulkTimeSettings] || field.firstGameTime
      }));
      setSortableFields(updatedFields);
      setHasChanges(true);

      toast({
        title: "Bulk Time Assignment Complete",
        description: `Updated ${fieldsToUpdate.length} fields with new start times`,
      });
    } catch (error) {
      console.error('Error updating bulk times:', error);
      toast({
        title: "Error",
        description: "Failed to update bulk times. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveOrder = async () => {
    setIsSaving(true);
    try {
      const fieldUpdates = sortableFields.map((field, index) => ({
        id: field.id,
        sortOrder: index,
        fieldSize: field.fieldSize
      }));

      const endpoint = eventId 
        ? `/api/admin/events/${eventId}/field-configurations/bulk` 
        : '/api/admin/fields/sort-order';

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldUpdates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save field order');
      }

      onFieldsReordered(sortableFields);
      setHasChanges(false);
      toast({
        title: "Field Configuration Saved",
        description: `Updated ${fieldUpdates.length} fields with order and sizes.`,
      });
    } catch (error) {
      console.error('Error saving field order:', error);
      toast({
        title: "Error",
        description: "Failed to save field configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Time Assignment Section */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Bulk First Game Time Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="time-7v7" className="text-slate-300">7v7 Fields Start Time</Label>
              <Input
                id="time-7v7"
                type="time"
                value={bulkTimeSettings['7v7']}
                onChange={(e) => setBulkTimeSettings(prev => ({ ...prev, '7v7': e.target.value }))}
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-9v9" className="text-slate-300">9v9 Fields Start Time</Label>
              <Input
                id="time-9v9"
                type="time"
                value={bulkTimeSettings['9v9']}
                onChange={(e) => setBulkTimeSettings(prev => ({ ...prev, '9v9': e.target.value }))}
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-11v11" className="text-slate-300">11v11 Fields Start Time</Label>
              <Input
                id="time-11v11"
                type="time"
                value={bulkTimeSettings['11v11']}
                onChange={(e) => setBulkTimeSettings(prev => ({ ...prev, '11v11': e.target.value }))}
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <Button
              onClick={handleBulkTimeAssignment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              Apply Bulk Times
            </Button>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Set start times for first games by field size. This will apply to all fields of the selected sizes.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Field Display Order & Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetOrder}
                disabled={!hasChanges}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                onClick={saveOrder}
                disabled={!hasChanges || isSaving}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Drag fields to reorder them and configure field sizes for this tournament. 
            This order and field sizes will be used in the Master Scheduler's Calendar Grid.
          </p>
        </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="field-list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg p-2' : ''}`}
              >
                {sortableFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${
                          snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                        } ${hasChanges ? 'border-orange-200 bg-orange-50/50' : ''}`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <div className="font-medium text-slate-200">
                                #{index + 1} {field.name}
                              </div>
                              {field.complexName && (
                                <div className="text-xs text-slate-400">{field.complexName}</div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Field Size Selection */}
                              {eventId && (
                                <div className="flex flex-col gap-1">
                                  <Label className="text-xs text-slate-400">Size</Label>
                                  <Select
                                    value={field.fieldSize}
                                    onValueChange={(value) => handleFieldSizeChange(field.id, value)}
                                  >
                                    <SelectTrigger className="w-20 h-7 text-xs bg-slate-700 border-slate-600">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                                        <SelectItem key={size} value={size} className="text-xs">
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* First Game Time */}
                              {eventId && (
                                <div className="flex flex-col gap-1">
                                  <Label className="text-xs text-slate-400">First Game</Label>
                                  <Input
                                    type="time"
                                    value={field.firstGameTime || ''}
                                    onChange={(e) => handleFirstGameTimeChange(field.id, e.target.value)}
                                    className="w-24 h-7 text-xs bg-slate-700 border-slate-600 text-slate-200"
                                  />
                                </div>
                              )}

                              {/* Field Availability Toggle */}
                              {eventId && (
                                <div className="flex flex-col gap-1 items-center">
                                  <Label className="text-xs text-slate-400">Available</Label>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={field.isActive !== false}
                                      onCheckedChange={(checked) => handleFieldActiveChange(field.id, checked)}
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    {field.isActive !== false ? (
                                      <Power className="h-3 w-3 text-green-400" />
                                    ) : (
                                      <PowerOff className="h-3 w-3 text-red-400" />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Badges */}
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  {!eventId && (
                                    <Badge variant="outline" className="text-xs">
                                      {field.fieldSize}
                                    </Badge>
                                  )}
                                  {field.hasLights && (
                                    <Badge variant="secondary" className="text-xs">
                                      Lights
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant={field.isOpen ? "default" : "secondary"} className="text-xs">
                                  {field.isOpen ? "Complex Open" : "Complex Closed"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Sort: {field.sortOrder}
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
        
        {hasChanges && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Unsaved Changes:</strong> Field order has been modified. Click "Save Order" to apply changes to the Calendar Grid.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
  );
}