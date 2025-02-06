
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Save } from "lucide-react";

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingScope, setEditingScope] = useState(null);
  const [newScope, setNewScope] = useState({ name: "", startYear: "", endYear: "" });

  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data) => {
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
      setNewScope({ name: "", startYear: "", endYear: "" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Scope Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newScope.name}
                onChange={(e) => setNewScope({ ...newScope, name: e.target.value })}
                placeholder="2024-2025 Season"
              />
            </div>
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={newScope.startYear}
                onChange={(e) => setNewScope({ ...newScope, startYear: e.target.value })}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={newScope.endYear}
                onChange={(e) => setNewScope({ ...newScope, endYear: e.target.value })}
                placeholder="2025"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => createScopeMutation.mutate(newScope)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Scope
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Years</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopesQuery.data?.map((scope) => (
                <TableRow key={scope.id}>
                  <TableCell>{scope.name}</TableCell>
                  <TableCell>{scope.startYear}-{scope.endYear}</TableCell>
                  <TableCell>{scope.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SeasonalScope {
  id: string;
  name: string;
  ageGroups: Record<string, number>;
}

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scopes, setScopes] = useState<SeasonalScope[]>([]);
  const [newScope, setNewScope] = useState({ name: "", ageGroups: {} });

  const updateScopeMutation = useMutation({
    mutationFn: async (data: SeasonalScope) => {
      const response = await fetch('/api/admin/seasonal-scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update scope');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seasonal-scopes']);
      toast({
        title: "Success",
        description: "Seasonal scope updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update scope",
        variant: "destructive",
      });
    },
  });

  const handleAddScope = () => {
    if (!newScope.name) return;
    
    const ageGroups = {};
    for (let i = 4; i <= 21; i++) {
      ageGroups[`U${i}`] = i;
    }
    
    const scope = {
      id: Date.now().toString(),
      name: newScope.name,
      ageGroups,
    };
    
    updateScopeMutation.mutate(scope);
    setScopes([...scopes, scope]);
    setNewScope({ name: "", ageGroups: {} });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="scopeName">New Seasonal Scope</Label>
              <Input
                id="scopeName"
                placeholder="e.g., 2024-2025"
                value={newScope.name}
                onChange={(e) => setNewScope({ ...newScope, name: e.target.value })}
              />
            </div>
            <Button onClick={handleAddScope}>Add Scope</Button>
          </div>

          <div className="space-y-4">
            {scopes.map((scope) => (
              <Card key={scope.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{scope.name}</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(scope.ageGroups).map(([group, age]) => (
                      <div key={group}>
                        <Label>{group}</Label>
                        <Input
                          type="number"
                          value={age}
                          onChange={(e) => {
                            const updatedScope = {
                              ...scope,
                              ageGroups: {
                                ...scope.ageGroups,
                                [group]: parseInt(e.target.value),
                              },
                            };
                            updateScopeMutation.mutate(updatedScope);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
