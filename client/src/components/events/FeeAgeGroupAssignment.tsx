import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface AgeGroup {
  id: string;
  divisionCode: string;
  ageGroup: string;
  gender: string;
  birthYear: number;
}

interface Fee {
  id: number;
  name: string;
  amount: number;
}

interface FeeAgeGroupAssignmentProps {
  fees: Fee[];
  ageGroups: AgeGroup[];
  assignments: Record<number, string[]>;
  onAssignmentsChange: (assignments: Record<number, string[]>) => void;
}

export function FeeAgeGroupAssignment({
  fees,
  ageGroups,
  assignments,
  onAssignmentsChange,
}: FeeAgeGroupAssignmentProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const feeId = parseInt(destination.droppableId.replace('fee-', ''));
    const groupId = draggableId;

    if (source.droppableId === 'available-groups') {
      // Add to fee
      const newAssignments = {
        ...assignments,
        [feeId]: [...(assignments[feeId] || []), groupId],
      };
      onAssignmentsChange(newAssignments);
    } else if (destination.droppableId === 'available-groups') {
      // Remove from fee
      const sourceFeeId = parseInt(source.droppableId.replace('fee-', ''));
      const newAssignments = {
        ...assignments,
        [sourceFeeId]: assignments[sourceFeeId].filter(id => id !== groupId),
      };
      onAssignmentsChange(newAssignments);
    } else {
      // Move between fees
      const sourceFeeId = parseInt(source.droppableId.replace('fee-', ''));
      const destFeeId = parseInt(destination.droppableId.replace('fee-', ''));

      const newAssignments = {
        ...assignments,
        [sourceFeeId]: assignments[sourceFeeId].filter(id => id !== groupId),
        [destFeeId]: [...(assignments[destFeeId] || []), groupId],
      };
      onAssignmentsChange(newAssignments);
    }
  };

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  return (
    <div className="grid grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Available Age Groups</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="available-groups">
            {(provided) => (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 p-2"
                >
                  {ageGroups
                    .filter(group => !Object.values(assignments).flat().includes(group.id))
                    .map((group, index) => (
                      <Draggable
                        key={group.id}
                        draggableId={group.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <CardContent className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{group.ageGroup}</span>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">{group.gender}</Badge>
                                  <Badge variant="outline">{group.birthYear}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </ScrollArea>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-lg">Fee Assignments</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4">
            {fees.map(fee => (
              <Card key={fee.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">{fee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(fee.amount)}
                      </p>
                    </div>
                  </div>
                  <Droppable droppableId={`fee-${fee.id}`}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {(assignments[fee.id] || []).map((groupId, index) => {
                          const group = ageGroups.find(g => g.id === groupId);
                          if (!group) return null;

                          return (
                            <Draggable
                              key={group.id}
                              draggableId={group.id}
                              index={index}
                            >
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="font-medium">{group.ageGroup}</span>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant="outline">{group.gender}</Badge>
                                          <Badge variant="outline">{group.birthYear}</Badge>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const newAssignments = {
                                            ...assignments,
                                            [fee.id]: assignments[fee.id].filter(
                                              id => id !== group.id
                                            ),
                                          };
                                          onAssignmentsChange(newAssignments);
                                        }}
                                        className="text-destructive hover:text-destructive/80"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}