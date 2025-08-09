import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Save, RotateCcw, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  sortOrder: number;
  hasLights: boolean;
  isOpen: boolean;
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Field Display Order</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetOrder}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={saveOrder}
              disabled={!hasChanges || isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
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
                        
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="font-medium">
                              #{index + 1} {field.name}
                            </div>
                            {field.complexName && (
                              <div className="text-xs text-muted-foreground">{field.complexName}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            {eventId && (
                              <Select
                                value={field.fieldSize}
                                onValueChange={(value) => handleFieldSizeChange(field.id, value)}
                              >
                                <SelectTrigger className="w-20 h-7 text-xs">
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
                            )}
                            {!eventId && (
                              <Badge variant="outline">
                                {field.fieldSize}
                              </Badge>
                            )}
                            {field.hasLights && (
                              <Badge variant="secondary" className="text-xs">
                                Lights
                              </Badge>
                            )}
                            <Badge variant={field.isOpen ? "default" : "secondary"} className="text-xs">
                              {field.isOpen ? "Open" : "Closed"}
                            </Badge>
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
  );
}