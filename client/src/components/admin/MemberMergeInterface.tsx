import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Users, Merge, CheckCircle, XCircle, Eye, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DuplicateCandidate {
  users: Array<{
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
    lastLogin?: Date;
    householdId?: number;
    isAdmin: boolean;
    isParent: boolean;
  }>;
  matchReason: 'email' | 'name_phone' | 'similar_name' | 'same_household';
  confidence: number;
  suggestedPrimary?: number;
}

interface MergeConflict {
  field: string;
  userValues: Array<{
    userId: number;
    value: any;
    lastModified?: Date;
    recordCount?: number;
  }>;
  recommendation: 'keep_newest' | 'keep_most_complete' | 'keep_most_active' | 'manual_review';
  reason: string;
}

interface MergePreview {
  primaryUser: any;
  secondaryUsers: any[];
  conflicts: MergeConflict[];
  relatedData: {
    teams: number;
    players: number;
    eventAdministrations: number;
    adminRoles: number;
    households: number;
  };
  recommendations: string[];
}

export default function MemberMergeInterface() {
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [fieldResolutions, setFieldResolutions] = useState<Record<string, any>>({});
  const [mergeOptions, setMergeOptions] = useState({
    preserveHistory: true,
    deleteSecondaryAccounts: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for duplicate candidates
  const { data: duplicatesData, isLoading: isLoadingDuplicates } = useQuery({
    queryKey: ['member-duplicates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/member-merge/duplicates');
      if (!response.ok) throw new Error('Failed to fetch duplicates');
      return response.json();
    }
  });

  // Query for merge statistics
  const { data: statsData } = useQuery({
    queryKey: ['member-merge-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/member-merge/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Query for merge preview when candidate is selected
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['merge-preview', selectedCandidate?.users.map(u => u.id)],
    queryFn: async () => {
      if (!selectedCandidate) return null;
      const userIds = selectedCandidate.users.map(u => u.id);
      const response = await fetch('/api/admin/member-merge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      if (!response.ok) throw new Error('Failed to fetch merge preview');
      return response.json();
    },
    enabled: !!selectedCandidate
  });

  // Mutation for executing merge
  const executeMergeMutation = useMutation({
    mutationFn: async (mergeRequest: any) => {
      const response = await fetch('/api/admin/member-merge/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergeRequest)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute merge');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Merge Completed",
        description: `Successfully merged ${data.result.transferredRecords.teams + data.result.transferredRecords.players + data.result.transferredRecords.eventAdministrations} records`,
      });
      queryClient.invalidateQueries({ queryKey: ['member-duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['member-merge-stats'] });
      setShowMergeDialog(false);
      setSelectedCandidate(null);
      setFieldResolutions({});
    },
    onError: (error: Error) => {
      toast({
        title: "Merge Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="destructive">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="secondary">Medium ({confidence}%)</Badge>;
    return <Badge variant="outline">Low ({confidence}%)</Badge>;
  };

  const getMatchReasonLabel = (reason: string) => {
    const labels = {
      email: 'Email Match',
      name_phone: 'Name + Phone',
      similar_name: 'Similar Name',
      same_household: 'Same Household'
    };
    return labels[reason] || reason;
  };

  const handleFieldResolution = (field: string, action: string, value?: any, sourceUserId?: number) => {
    setFieldResolutions(prev => ({
      ...prev,
      [field]: { action, value, sourceUserId }
    }));
  };

  const executeMerge = () => {
    if (!selectedCandidate || !previewData?.preview) return;

    const primaryUserId = previewData.preview.primaryUser.id;
    const secondaryUserIds = previewData.preview.secondaryUsers.map((u: any) => u.id);

    const mergeRequest = {
      primaryUserId,
      secondaryUserIds,
      fieldResolutions,
      preserveHistory: mergeOptions.preserveHistory,
      deleteSecondaryAccounts: mergeOptions.deleteSecondaryAccounts
    };

    executeMergeMutation.mutate(mergeRequest);
  };

  if (isLoadingDuplicates) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const duplicates = duplicatesData?.duplicates || [];
  const stats = statsData?.dataIntegrity || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Deduplication</h1>
          <p className="text-muted-foreground">
            Identify and merge duplicate member profiles to maintain data integrity
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicates.length}</div>
            <p className="text-xs text-muted-foreground">
              Potential duplicate profiles found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRiskDuplicates || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumRiskDuplicates || 0}</div>
            <p className="text-xs text-muted-foreground">
              Should be reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.lowRiskDuplicates || 0}</div>
            <p className="text-xs text-muted-foreground">
              Optional merges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {statsData?.recommendations && statsData.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommendations:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {statsData.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Candidates</CardTitle>
          <CardDescription>
            Review potential duplicate profiles and merge them to maintain data integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
              <p className="text-muted-foreground">
                Your member database appears to be clean with no duplicate profiles detected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((candidate: DuplicateCandidate, index: number) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getConfidenceBadge(candidate.confidence)}
                        <Badge variant="outline">{getMatchReasonLabel(candidate.matchReason)}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {candidate.users.map((user, userIndex) => (
                        <div 
                          key={user.id} 
                          className={`p-3 border rounded ${candidate.suggestedPrimary === user.id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{user.firstName} {user.lastName}</span>
                            {candidate.suggestedPrimary === user.id && (
                              <Badge variant="secondary" className="text-xs">Suggested Primary</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Email: {user.email}</div>
                            <div>Username: {user.username}</div>
                            {user.phone && <div>Phone: {user.phone}</div>}
                            <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                            {user.isAdmin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Preview Dialog */}
      {selectedCandidate && (
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Merge Preview</DialogTitle>
              <DialogDescription>
                Review the merge details and resolve any conflicts before proceeding
              </DialogDescription>
            </DialogHeader>

            {isLoadingPreview ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : previewData?.preview ? (
              <div className="space-y-6">
                {/* Warnings */}
                {previewData.warnings && previewData.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {previewData.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="conflicts">Conflicts ({previewData.preview.conflicts?.length || 0})</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Primary Account (Will Survive)</h4>
                      <Card className="border-green-500">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>{previewData.preview.primaryUser.firstName} {previewData.preview.primaryUser.lastName}</strong>
                              <div className="text-sm text-muted-foreground">
                                <div>Email: {previewData.preview.primaryUser.email}</div>
                                <div>Username: {previewData.preview.primaryUser.username}</div>
                                {previewData.preview.primaryUser.phone && <div>Phone: {previewData.preview.primaryUser.phone}</div>}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">
                                <div>Created: {new Date(previewData.preview.primaryUser.createdAt).toLocaleDateString()}</div>
                                {previewData.preview.primaryUser.lastLogin && (
                                  <div>Last Login: {new Date(previewData.preview.primaryUser.lastLogin).toLocaleDateString()}</div>
                                )}
                                {previewData.preview.primaryUser.isAdmin && <Badge variant="destructive" className="text-xs mt-1">Admin</Badge>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Secondary Accounts (Will be Merged)</h4>
                      <div className="space-y-2">
                        {previewData.preview.secondaryUsers.map((user: any, index: number) => (
                          <Card key={user.id} className="border-red-300">
                            <CardContent className="pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>{user.firstName} {user.lastName}</strong>
                                  <div className="text-sm text-muted-foreground">
                                    <div>Email: {user.email}</div>
                                    <div>Username: {user.username}</div>
                                    {user.phone && <div>Phone: {user.phone}</div>}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">
                                    <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                                    {user.lastLogin && (
                                      <div>Last Login: {new Date(user.lastLogin).toLocaleDateString()}</div>
                                    )}
                                    {user.isAdmin && <Badge variant="destructive" className="text-xs mt-1">Admin</Badge>}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Related Data Summary */}
                    <div>
                      <h4 className="font-semibold mb-2">Data Transfer Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <div className="text-2xl font-bold">{previewData.preview.relatedData.teams}</div>
                            <div className="text-sm text-muted-foreground">Teams</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <div className="text-2xl font-bold">{previewData.preview.relatedData.players}</div>
                            <div className="text-sm text-muted-foreground">Players</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <div className="text-2xl font-bold">{previewData.preview.relatedData.eventAdministrations}</div>
                            <div className="text-sm text-muted-foreground">Admin Roles</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <div className="text-2xl font-bold">{previewData.preview.relatedData.adminRoles}</div>
                            <div className="text-sm text-muted-foreground">System Roles</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="conflicts" className="space-y-4">
                    {previewData.preview.conflicts && previewData.preview.conflicts.length > 0 ? (
                      <div className="space-y-4">
                        {previewData.preview.conflicts.map((conflict: MergeConflict, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg">Field: {conflict.field}</CardTitle>
                              <CardDescription>{conflict.reason}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <RadioGroup
                                  value={fieldResolutions[conflict.field]?.action || ''}
                                  onValueChange={(value) => {
                                    if (value === 'keep_primary') {
                                      handleFieldResolution(conflict.field, 'keep_primary');
                                    } else if (value === 'keep_secondary') {
                                      handleFieldResolution(conflict.field, 'keep_secondary');
                                    } else if (value === 'use_value') {
                                      handleFieldResolution(conflict.field, 'use_value', '');
                                    }
                                  }}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="keep_primary" id={`${conflict.field}-primary`} />
                                      <Label htmlFor={`${conflict.field}-primary`}>
                                        Keep Primary: {String(conflict.userValues[0]?.value)}
                                      </Label>
                                    </div>
                                    {conflict.userValues.slice(1).map((userValue, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <RadioGroupItem 
                                          value="keep_secondary" 
                                          id={`${conflict.field}-secondary-${idx}`}
                                          onClick={() => handleFieldResolution(conflict.field, 'keep_secondary', userValue.value, userValue.userId)}
                                        />
                                        <Label htmlFor={`${conflict.field}-secondary-${idx}`}>
                                          Keep Secondary: {String(userValue.value)}
                                        </Label>
                                      </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="use_value" id={`${conflict.field}-custom`} />
                                      <Label htmlFor={`${conflict.field}-custom`}>Use custom value:</Label>
                                      <Input
                                        placeholder="Enter custom value"
                                        onChange={(e) => handleFieldResolution(conflict.field, 'use_value', e.target.value)}
                                        disabled={fieldResolutions[conflict.field]?.action !== 'use_value'}
                                      />
                                    </div>
                                  </div>
                                </RadioGroup>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Conflicts</h3>
                        <p className="text-muted-foreground">
                          All fields can be merged automatically without conflicts.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="options" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="preserve-history"
                          checked={mergeOptions.preserveHistory}
                          onCheckedChange={(checked) => 
                            setMergeOptions(prev => ({ ...prev, preserveHistory: !!checked }))
                          }
                        />
                        <Label htmlFor="preserve-history">
                          Preserve merge history for audit purposes
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delete-secondary"
                          checked={mergeOptions.deleteSecondaryAccounts}
                          onCheckedChange={(checked) => 
                            setMergeOptions(prev => ({ ...prev, deleteSecondaryAccounts: !!checked }))
                          }
                        />
                        <Label htmlFor="delete-secondary">
                          Delete secondary accounts (recommended)
                        </Label>
                      </div>
                      
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warning:</strong> This action cannot be undone. Please review all settings carefully before proceeding.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCandidate(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={executeMerge}
                    disabled={executeMergeMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    {executeMergeMutation.isPending ? 'Merging...' : 'Execute Merge'}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}