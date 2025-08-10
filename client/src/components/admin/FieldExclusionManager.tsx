import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  hasLights: boolean;
  isActive: boolean;
  complexName: string;
}

interface ExcludedField {
  fieldId: number;
  fieldName: string;
  excludedAt: string;
}

interface FieldExclusionManagerProps {
  eventId: string;
}

export function FieldExclusionManager({ eventId }: FieldExclusionManagerProps) {
  const [excludingFieldId, setExcludingFieldId] = useState<number | null>(null);
  const [restoringFieldId, setRestoringFieldId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all fields for the event
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/public/events', eventId, 'fields'],
    queryFn: async () => {
      const response = await fetch(`/api/public/events/${eventId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
  });

  // Fetch excluded fields
  const { data: excludedData, isLoading: excludedLoading } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'fields', 'excluded'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields/excluded`);
      if (!response.ok) throw new Error('Failed to fetch excluded fields');
      return response.json();
    },
  });

  // Exclude field mutation
  const excludeFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/fields/${fieldId}/exclude`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exclude field');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Field Removed Successfully",
        description: `Field has been completely removed from tournament usage. All games and time slots have been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/events', eventId, 'fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'fields', 'excluded'] });
      setExcludingFieldId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Field Removal Failed",
        description: error.message,
        variant: "destructive",
      });
      setExcludingFieldId(null);
    },
  });

  // Restore field mutation
  const restoreFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/fields/${fieldId}/restore`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to restore field');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Field Restored Successfully",
        description: `Field has been restored and is available for tournament usage.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/events', eventId, 'fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'fields', 'excluded'] });
      setRestoringFieldId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Field Restoration Failed",
        description: error.message,
        variant: "destructive",
      });
      setRestoringFieldId(null);
    },
  });

  const handleExcludeField = (fieldId: number) => {
    setExcludingFieldId(fieldId);
    excludeFieldMutation.mutate(fieldId);
  };

  const handleRestoreField = (fieldId: number) => {
    setRestoringFieldId(fieldId);
    restoreFieldMutation.mutate(fieldId);
  };

  if (fieldsLoading || excludedLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeFields = fieldsData?.fields?.filter((field: Field) => field.isActive) || [];
  const excludedFields = excludedData?.excludedFields || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Field Management</h2>
        <p className="text-slate-600 mt-1">
          Completely remove fields from tournament usage or restore previously excluded fields.
        </p>
      </div>

      {/* Warning Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Warning:</strong> Removing a field will permanently delete all scheduled games and time slots on that field. This action cannot be undone.
        </AlertDescription>
      </Alert>

      {/* Active Fields */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Fields</h3>
        {activeFields.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              No active fields found for this tournament.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeFields.map((field: Field) => (
              <Card key={field.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{field.name}</CardTitle>
                    <Badge variant="secondary">{field.fieldSize}</Badge>
                  </div>
                  <CardDescription>
                    {field.complexName}
                    {field.hasLights && " • Lights Available"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        disabled={excludingFieldId === field.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {excludingFieldId === field.id ? 'Removing...' : 'Remove from Tournament'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Field from Tournament</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to completely remove <strong>{field.name}</strong> from this tournament?
                          
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800 font-medium">This will permanently:</p>
                            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                              <li>Delete all scheduled games on this field</li>
                              <li>Remove all time slot configurations</li>
                              <li>Exclude the field from future scheduling</li>
                            </ul>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleExcludeField(field.id)}
                          disabled={excludingFieldId === field.id}
                        >
                          {excludingFieldId === field.id ? 'Removing...' : 'Remove Field'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Excluded Fields */}
      {excludedFields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Excluded Fields ({excludedFields.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {excludedFields.map((excludedField: ExcludedField) => (
              <Card key={excludedField.fieldId} className="border-slate-300 bg-slate-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-slate-700">
                      {excludedField.fieldName}
                    </CardTitle>
                    <Badge variant="outline" className="text-slate-600">
                      Excluded
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-500">
                    Removed: {new Date(excludedField.excludedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleRestoreField(excludedField.fieldId)}
                    disabled={restoringFieldId === excludedField.fieldId}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {restoringFieldId === excludedField.fieldId ? 'Restoring...' : 'Restore Field'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Success Info */}
      {activeFields.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Field exclusion system is working properly. You can safely remove fields that are not needed for this tournament.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}