import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export function SeasonalScopeSelector({ selectedScopeId, onScopeSelect }: SeasonalScopeSelectorProps) {
  const { data: scopes, isLoading } = useQuery<SeasonalScope[]>({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    },
  });

  // Assuming normalizedSelectedId is derived from selectedScopeId to handle potential type differences
  const normalizedSelectedId = selectedScopeId;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Select Seasonal Scope</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a seasonal scope" />
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