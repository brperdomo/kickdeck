import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { type FieldSize } from "@/components/forms/event-form-types";


interface Complex {
  id: number;
  name: string;
  fields: {
    id: number;
    name: string;
    hasLights: boolean;
    hasParking: boolean;
    isOpen: boolean;
  }[];
}

interface ComplexSelectorProps {
  selectedComplexIds: number[];
  complexFieldSizes: Record<number, FieldSize>;
  onComplexSelect: (complexId: number) => void;
  onFieldSizeChange: (complexId: number, size: FieldSize) => void;
}

export function ComplexSelector({ 
  selectedComplexIds = [], 
  complexFieldSizes = {}, 
  onComplexSelect, 
  onFieldSizeChange 
}: ComplexSelectorProps) {
  const { data: complexes = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Failed to load complexes. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {complexes.map((complex: Complex) => (
          <Card key={complex.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={Array.isArray(selectedComplexIds) && selectedComplexIds.includes(complex.id)}
                  onCheckedChange={() => onComplexSelect(complex.id)}
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{complex.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {complex.fields.length} fields available
                  </p>
                </div>
                {Array.isArray(selectedComplexIds) && selectedComplexIds.includes(complex.id) && (
                  <Select
                    value={complexFieldSizes[complex.id] || '11v11'}
                    onValueChange={(size) =>
                      onFieldSizeChange(complex.id, size as FieldSize)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        {complexFieldSizes[complex.id] || "11v11"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}