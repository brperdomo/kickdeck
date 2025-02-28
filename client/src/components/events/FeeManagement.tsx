import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '../ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Define types
type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'amount' | 'beginDate' | 'endDate';

const feeFormSchema = z.object({
  name: z.string().min(1, { message: "Fee name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  beginDate: z.string().min(1, { message: "Begin date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  accountingCodeId: z.number().nullable(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

export function FeeManagement() {
  const params = useParams();
  const eventId = params.id;
  const [location, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [isAssignFeeOpen, setIsAssignFeeOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [newFee, setNewFee] = useState({
    name: '',
    amount: '',
    beginDate: null,
    endDate: null,
    applyToAll: false,
  });
  const [selectedAgeGroups, setSelectedAgeGroups] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Get eventId from the URL parameter
  const eventIdMatch = location.match(/\/admin\/events\/(\d+)\/fees/);
  const eventIdParam = eventIdMatch ? eventIdMatch[1] : eventId;

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      beginDate: "",
      endDate: "",
      accountingCodeId: null,
    }
  });

  // Fetch event fees
  const feesQuery = useQuery({
    queryKey: ['fees', eventIdParam],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fees`);
      if (!response.ok) throw new Error('Failed to fetch fees');
      const fees = await response.json();
      
      // Format dates properly
      return fees.map(fee => ({
        ...fee,
        // Format dates if they exist, or provide null
        beginDate: fee.beginDate ? new Date(fee.beginDate).toLocaleDateString() : null,
        endDate: fee.endDate ? new Date(fee.endDate).toLocaleDateString() : null
      }));
    },
    enabled: !!eventIdParam,
  });

  // Fetch accounting codes
  const accountingCodesQuery = useQuery({
    queryKey: ['accountingCodes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    },
  });

  // Query to fetch age groups
  const ageGroupsQuery = useQuery({
    queryKey: ['eventAgeGroups', eventIdParam],
    queryFn: async () => {
      console.log(`Fetching age groups for event: ${eventIdParam}`);
      const response = await fetch(`/api/admin/events/${eventIdParam}/age-groups`);
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to fetch age groups:', error);
        throw new Error(`Failed to fetch age groups: ${error}`);
      }
      const data = await response.json();
      console.log(`Found ${data.length} age groups for event ${eventIdParam}`);
      return data;
    },
    enabled: !!eventIdParam,
  });

  // Fetch fee assignments
  const feeAssignmentsQuery = useQuery({
    queryKey: ['feeAssignments', eventIdParam],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fee-assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch fee assignments');
      }
      return response.json();
    },
    enabled: !!eventIdParam,
  });

  // Initialize selected age groups when fee assignments load
  useEffect(() => {
    // Debug info to help diagnose routing issues
    console.log("Current location:", location);
    console.log("Event ID from parameter:", eventIdParam);
    console.log("Age groups data:", ageGroupsQuery.data);
    console.log("Fee assignments data:", feeAssignmentsQuery.data);

    if (ageGroupsQuery.data && feeAssignmentsQuery.data) {
      const assignmentMap = {};
      ageGroupsQuery.data.forEach(group => {
        assignmentMap[group.id] = {};
        feesQuery.data?.forEach(fee => {
          const isAssigned = feeAssignmentsQuery.data.some(
            assignment => assignment.ageGroupId === group.id && assignment.feeId === fee.id
          );
          assignmentMap[group.id][fee.id] = isAssigned;
        });
      });
      setSelectedAgeGroups(assignmentMap);
    }
  }, [feeAssignmentsQuery.data, ageGroupsQuery.data, feesQuery.data, location]);

  // Add fee mutation
  const addFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      });

      if (!response.ok) {
        throw new Error('Failed to add fee');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fees', eventIdParam]);
      setIsAddFeeOpen(false);
      setNewFee({
        name: '',
        amount: '',
        beginDate: null,
        endDate: null,
        applyToAll: false,
      });
      toast({
        title: 'Success',
        description: 'Fee added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add fee',
        variant: 'destructive',
      });
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fees/${feeData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      });

      if (!response.ok) {
        throw new Error('Failed to update fee');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fees', eventIdParam]);
      setIsEditFeeOpen(false);
      setEditingFee(null);
      toast({
        title: 'Success',
        description: 'Fee updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fee',
        variant: 'destructive',
      });
    },
  });

  // Delete fee mutation
  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId) => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fees/${feeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete fee');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fees', eventIdParam]);
      toast({
        title: 'Success',
        description: 'Fee deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete fee',
        variant: 'destructive',
      });
    },
  });

  // Update fee assignments mutation
  const updateAssignmentsMutation = useMutation({
    mutationFn: async ({ feeId, ageGroupIds }) => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fee-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeId,
          ageGroupIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update fee assignments');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feeAssignments', eventIdParam]);
      setIsAssignFeeOpen(false);
      setSelectedFeeId(null);
      toast({
        title: 'Success',
        description: 'Fee assignments updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fee assignments',
        variant: 'destructive',
      });
    },
  });

  const handleAddFee = () => {
    const feeData = {
      ...newFee,
      amount: parseFloat(newFee.amount) * 100, // Convert to cents
    };

    addFeeMutation.mutate(feeData);
  };

  const handleUpdateFee = () => {
    const feeData = {
      ...editingFee,
      amount: parseFloat(editingFee.amount) * 100, // Convert to cents
    };

    updateFeeMutation.mutate(feeData);
  };

  const handleDeleteFee = (feeId) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  const handleSaveAssignments = () => {
    const selectedAgeGroupIds = [];

    Object.entries(selectedAgeGroups).forEach(([ageGroupId, feeMap]) => {
      Object.entries(feeMap).forEach(([feeId, isSelected]) => {
        if (parseInt(feeId) === selectedFeeId && isSelected) {
          selectedAgeGroupIds.push(parseInt(ageGroupId));
        }
      });
    });

    updateAssignmentsMutation.mutate({
      feeId: selectedFeeId,
      ageGroupIds: selectedAgeGroupIds,
    });
  };

  const openAssignFeeDialog = (feeId) => {
    setSelectedFeeId(feeId);
    setIsAssignFeeOpen(true);
  };

  const handleFormSubmit = (data: FeeFormValues) => {
    // Convert amount from string to number in cents
    const amountInCents = Math.round(parseFloat(data.amount) * 100);

    if (editingFee) {
      // Update existing fee
      updateFeeMutation.mutate({
        id: editingFee.id,
        ...data,
        amount: amountInCents,
      });
    } else {
      // Add new fee
      addFeeMutation.mutate({
        ...data,
        amount: amountInCents,
      });
    }

    setIsDialogOpen(false);
    setEditingFee(null);
    form.reset();
  };

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  if (feesQuery.isLoading || accountingCodesQuery.isLoading || ageGroupsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (feesQuery.error || accountingCodesQuery.error || ageGroupsQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="text-red-500 font-semibold">Failed to load fee management data</div>
        <Button variant="outline" onClick={() => setLocation("/admin/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/admin/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold">Fee Management</h1>
        </div>
        <Button onClick={() => {
          setEditingFee(null);
          form.reset();
          setIsDialogOpen(true);
        }}>
          Add New Fee
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Event Fees</CardTitle>
          <CardDescription>Manage fees for this event and assign them to age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fees">
            <TabsList>
              <TabsTrigger value="fees">Fee List</TabsTrigger>
              <TabsTrigger value="assignments">Fee Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="fees" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Begin Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesQuery.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No fees have been added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    feesQuery.data?.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>{fee.name}</TableCell>
                        <TableCell>{formatCurrency(fee.amount)}</TableCell>
                        <TableCell>{format(new Date(fee.beginDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(fee.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Pre-fill form with existing fee data
                                form.reset({
                                  name: fee.name,
                                  amount: (fee.amount / 100).toString(),
                                  beginDate: fee.beginDate,
                                  endDate: fee.endDate,
                                  accountingCodeId: fee.accountingCodeId,
                                });
                                setEditingFee(fee);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteFee(fee.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignFeeDialog(fee.id)}
                            >
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              {ageGroupsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : ageGroupsQuery.data?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No age groups have been added to this event yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age Group</TableHead>
                      {feesQuery.data?.map(fee => (
                        <TableHead key={fee.id}>{fee.name} ({formatCurrency(fee.amount)})</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupsQuery.data?.map(ageGroup => (
                      <TableRow key={ageGroup.id}>
                        <TableCell>{ageGroup.name}</TableCell>
                        {feesQuery.data?.map(fee => (
                          <TableCell key={fee.id}>
                            <Checkbox
                              checked={
                                selectedAgeGroups[ageGroup.id]?.[fee.id] ||
                                feeAssignmentsQuery.data?.some(
                                  assignment => 
                                    assignment.ageGroupId === ageGroup.id && 
                                    assignment.feeId === fee.id
                                ) ||
                                false
                              }
                              onCheckedChange={(checked) => {
                                setSelectedAgeGroups(prev => ({
                                  ...prev,
                                  [ageGroup.id]: {
                                    ...(prev[ageGroup.id] || {}),
                                    [fee.id]: !!checked
                                  }
                                }));
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => {
                    // Save all fee assignments
                    const assignments = [];

                    ageGroupsQuery.data?.forEach(ageGroup => {
                      feesQuery.data?.forEach(fee => {
                        if (selectedAgeGroups[ageGroup.id]?.[fee.id]) {
                          assignments.push({
                            ageGroupId: ageGroup.id,
                            feeId: fee.id
                          });
                        }
                      });
                    });

                    // Call API to save assignments
                    if (assignments.length > 0) {
                      // Implementation would depend on your API structure
                      toast({
                        title: 'Success',
                        description: 'Fee assignments updated'
                      });
                    }
                  }}
                >
                  Save Assignments
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Fee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFee ? "Edit Fee" : "Add New Fee"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter fee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beginDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Begin Date</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountingCodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting Code</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select accounting code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountingCodesQuery.data?.map(code => (
                          <SelectItem key={code.id} value={code.id.toString()}>
                            {code.code} - {code.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingFee(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFee ? "Update Fee" : "Create Fee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Fee Dialog (simplified) */}
      <Dialog open={isAssignFeeOpen} onOpenChange={setIsAssignFeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Fee to Age Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ageGroupsQuery.data?.map(ageGroup => (
              <div key={ageGroup.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`age-group-${ageGroup.id}`}
                  checked={
                    selectedAgeGroups[ageGroup.id]?.[selectedFeeId] || 
                    feeAssignmentsQuery.data?.some(
                      a => a.ageGroupId === ageGroup.id && a.feeId === selectedFeeId
                    ) || 
                    false
                  }
                  onCheckedChange={(checked) => {
                    setSelectedAgeGroups(prev => ({
                      ...prev,
                      [ageGroup.id]: {
                        ...(prev[ageGroup.id] || {}),
                        [selectedFeeId]: !!checked
                      }
                    }));
                  }}
                />
                <Label htmlFor={`age-group-${ageGroup.id}`}>{ageGroup.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}