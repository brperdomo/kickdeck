
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgeGroup {
  birthYear: number;
  ageGroup: string;
  gender: string;
  divisionCode: string;
}

interface SeasonalScope {
  name: string;
  startYear: number;
  endYear: number;
  ageGroups: AgeGroup[];
}

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStartYear, setSelectedStartYear] = useState<string>("");
  const [selectedEndYear, setSelectedEndYear] = useState<string>("");
  const [scopeName, setScopeName] = useState<string>("");
  const [ageGroupMappings, setAgeGroupMappings] = useState<AgeGroup[]>([]);

  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data: SeasonalScope) => {
      const response = await fetch('/api/admin/seasonal-scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create seasonal scope');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/seasonal-scopes']);
      toast({ title: "Success", description: "Seasonal scope created successfully" });
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedStartYear("");
    setSelectedEndYear("");
    setScopeName("");
    setAgeGroupMappings([]);
  };

  const calculateAgeGroup = (birthYear: number, endYear: number) => {
    const age = endYear - birthYear;
    return `U${age}`;
  };

  const handleEndYearChange = (endYear: string) => {
    setSelectedEndYear(endYear);
    if (endYear) {
      const year = parseInt(endYear);
      const initialMappings: AgeGroup[] = [];
      
      // Generate 15 years of age groups (U4 to U19)
      for (let i = 0; i < 15; i++) {
        const birthYear = year - (4 + i);
        const ageGroup = calculateAgeGroup(birthYear, year);
        
        // Add both boys and girls divisions
        initialMappings.push({
          birthYear,
          ageGroup,
          gender: 'Boys',
          divisionCode: `B${birthYear}`
        });
        initialMappings.push({
          birthYear,
          ageGroup,
          gender: 'Girls',
          divisionCode: `G${birthYear}`
        });
      }
      setAgeGroupMappings(initialMappings);
    }
  };

  const handleSubmit = async () => {
    if (!scopeName || !selectedStartYear || !selectedEndYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createScopeMutation.mutateAsync({
        name: scopeName,
        startYear: parseInt(selectedStartYear),
        endYear: parseInt(selectedEndYear),
        ageGroups: ageGroupMappings
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create seasonal scope",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Scope Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={scopeName}
                onChange={(e) => setScopeName(e.target.value)}
                placeholder="2024-2025 Season"
              />
            </div>
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={selectedStartYear}
                onChange={(e) => setSelectedStartYear(e.target.value)}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={selectedEndYear}
                onChange={(e) => handleEndYearChange(e.target.value)}
                placeholder="2025"
              />
            </div>
          </div>

          {selectedEndYear && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Division Code</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Gender</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupMappings.map((mapping) => (
                      <TableRow key={`${mapping.gender}-${mapping.birthYear}`}>
                        <TableCell>{mapping.birthYear}</TableCell>
                        <TableCell>{mapping.divisionCode}</TableCell>
                        <TableCell>{mapping.ageGroup}</TableCell>
                        <TableCell>{mapping.gender}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleSubmit}
            className="w-full mt-4"
            disabled={createScopeMutation.isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createScopeMutation.isLoading ? "Adding..." : "Add Scope"}
          </Button>

          {scopesQuery.data?.map((scope: any) => (
            <Card key={scope.id} className="mt-4">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">{scope.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Division Code</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Gender</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scope.ageGroups?.map((group: AgeGroup) => (
                      <TableRow key={`${group.gender}-${group.birthYear}`}>
                        <TableCell>{group.birthYear}</TableCell>
                        <TableCell>{group.divisionCode}</TableCell>
                        <TableCell>{group.ageGroup}</TableCell>
                        <TableCell>{group.gender}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
