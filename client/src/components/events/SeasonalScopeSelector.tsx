
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface SeasonalScope {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  ageGroups: any[];
}

interface SeasonalScopeSelectorProps {
  selectedScopeId: number | null;
  onScopeSelect: (scopeId: number) => void;
  scopes: SeasonalScope[];
}

export function SeasonalScopeSelector({ selectedScopeId, onScopeSelect, scopes }: SeasonalScopeSelectorProps) {
  // For debugging
  console.log('SeasonalScopeSelector - selectedScopeId:', selectedScopeId);
  console.log('SeasonalScopeSelector - available scopes:', scopes);
  
  // Convert selectedScopeId to string for the Select component
  const normalizedSelectedId = selectedScopeId;

  if (!scopes || scopes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Select Seasonal Scope</Label>
            <p className="text-sm text-red-500">
              No seasonal scopes available. Please create one in the admin settings first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label>Select Seasonal Scope</Label>
          <Select
            value={normalizedSelectedId?.toString() || ""}
            onValueChange={(value) => onScopeSelect(parseInt(value))}
            defaultValue={normalizedSelectedId?.toString()}
          >
            <SelectTrigger className="w-full">
              <SelectValue 
                placeholder="Choose a seasonal scope"
              />
            </SelectTrigger>
            <SelectContent>
              {scopes.map((scope) => (
                <SelectItem key={scope.id} value={scope.id.toString()}>
                  {scope.name} ({scope.startYear}-{scope.endYear})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
