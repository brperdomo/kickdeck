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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
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
  beginDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
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

      // Keep the original date format from the server
      return fees.map(fee => ({
        ...fee,
        beginDate: fee.beginDate || null,
        endDate: fee.endDate || null
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
      // Limit to 30 age groups as per seasonal scope requirements
      // Filter out duplicates by division code (unique identifier)
      const uniqueAgeGroups = Array.from(
        new Map(data.map(group => [group.divisionCode, group])).values()
      );
      console.log(`Found ${uniqueAgeGroups.length} unique age groups for event ${eventIdParam}`);
      return uniqueAgeGroups;
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
        // Handle both normal IDs and predefined IDs (which may be strings)
        const groupId = group.id || `predefined-${group.divisionCode}`;
        assignmentMap[groupId] = {};
        feesQuery.data?.forEach(fee => {
          const isAssigned = feeAssignmentsQuery.data.some(
            assignment => 
              // Check if the assignment matches either the ID or the division code
              (assignment.ageGroupId === group.id) || 
              (group.id?.toString().startsWith('predefined-') && 
               assignment.divisionCode === group.divisionCode)
          );
          assignmentMap[groupId][fee.id] = isAssigned;
        });
      });
      setSelectedAgeGroups(assignmentMap);
    }
  }, [feeAssignmentsQuery.data, ageGroupsQuery.data, feesQuery.data, location]);

  // Add fee mutation
  const addFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      // Format dates properly to avoid JSON parsing issues
      const cleanedData = {
        ...feeData,
        amount: Number(feeData.amount),
        beginDate: feeData.beginDate ? new Date(feeData.beginDate).toISOString().split('T')[0] : null,
        endDate: feeData.endDate ? new Date(feeData.endDate).toISOString().split('T')[0] : null,
        accountingCodeId: feeData.accountingCodeId || null
      };

      console.log("Sending new fee data:", JSON.stringify(cleanedData));

      try {
        const response = await fetch(`/api/admin/events/${eventIdParam}/fees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Failed to create fee: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Fee creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fees', eventIdParam]);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Fee created successfully',
      });
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
      toast({
        title: 'Error',
        description: `Failed to create fee: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      // Ensure we're sending valid JSON data
      const cleanedData = {
        ...feeData,
        amount: Number(feeData.amount),
        beginDate: feeData.beginDate ? new Date(feeData.beginDate).toISOString().split('T')[0] : null,
        endDate: feeData.endDate ? new Date(feeData.endDate).toISOString().split('T')[0] : null,
        accountingCodeId: feeData.accountingCodeId || null
      };

      try {
        const response = await fetch(`/api/admin/events/${eventIdParam}/fees/${feeData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Server error response:", errorData);
          throw new Error(`Failed to update fee: ${errorData}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Fee update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fees', eventIdParam]);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Fee updated successfully',
      });
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
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
    // Ensure proper date formatting
    const feeData = {
      ...newFee,
      amount: parseFloat(newFee.amount) * 100, // Convert to cents,
      beginDate: newFee.beginDate ? new Date(newFee.beginDate).toISOString().split('T')[0] : null,
      endDate: newFee.endDate ? new Date(newFee.endDate).toISOString().split('T')[0] : null
    };

    addFeeMutation.mutate(feeData);
  };

  const handleUpdateFee = () => {
    // Ensure proper date formatting
    const feeData = {
      ...editingFee,
      amount: parseFloat(editingFee.amount) * 100, // Convert to cents
      beginDate: editingFee.beginDate ? new Date(editingFee.beginDate).toISOString().split('T')[0] : null,
      endDate: editingFee.endDate ? new Date(editingFee.endDate).toISOString().split('T')[0] : null
    };

    updateFeeMutation.mutate(feeData);
  };

  const handleDeleteFee = (feeId) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  // Handle saving fee assignments
  const handleSaveAssignments = async () => {
    // Prepare assignments data
    const assignments = [];
    ageGroupsQuery.data?.forEach(ageGroup => {
      if (selectedAgeGroups[ageGroup.id] && selectedAgeGroups[ageGroup.id][selectedFeeId]) {
        assignments.push({
          ageGroupId: ageGroup.id,
          feeId: selectedFeeId
        });
      }
    });

    console.log("Saving fee assignments:", JSON.stringify({
      assignments,
      feeId: selectedFeeId
    }));

    try {
      // Call API to save assignments
      const response = await fetch(`/api/admin/events/${eventIdParam}/fee-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments,
          feeId: selectedFeeId
        }),
      });

      // First check for errors by examining the response
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error("Server returned an invalid response format");
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save assignments');
      }

      setIsAssignFeeOpen(false);
      toast({
        title: 'Success',
        description: 'Fee assignments updated',
      });
      // Refresh assignments data
      feeAssignmentsQuery.refetch();
    } catch (error) {
      console.error("Fee assignment error:", error);
      toast({
        title: 'Error',
        description: `Failed to save assignments: ${error.message}`,
        variant: 'destructive',
      });
    }
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
                        <TableCell>{fee.beginDate ? format(new Date(fee.beginDate), 'MMM d, yyyy') : null}</TableCell>
                        <TableCell>{fee.endDate ? format(new Date(fee.endDate), 'MMM d, yyyy') : null}</TableCell>
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
                                  beginDate: fee.beginDate ? fee.beginDate : "", 
                                  endDate: fee.endDate ? fee.endDate : "",
                                  accountingCodeId: fee.accountingCodeId || null,
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
                      <TableHead className="min-w-[200px]">Age Group / Division</TableHead>
                      {feesQuery.data?.map(fee => (
                        <TableHead key={fee.id} className="text-center">
                          <div className="flex flex-col items-center">
                            <span>{fee.name}</span>
                            <span className="text-xs font-normal">{formatCurrency(fee.amount)}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupsQuery.data?.map(ageGroup => (
                      <TableRow key={ageGroup.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{ageGroup.name}</span>
                            <span className="text-xs text-gray-500">
                              {ageGroup.gender} • {ageGroup.divisionCode} • {ageGroup.birthYear}
                            </span>
                          </div>
                        </TableCell>
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
                  onClick={handleSaveAssignments}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
            <DialogDescription>
              {editingFee ? 'Update the fee details below.' : 'Add a new fee for this event.'}
            </DialogDescription>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beginDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Begin Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Fee to Age Groups</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Select the age groups this fee should be assigned to. The fee will be applied to all participants in the selected age groups.
            </p>
          </DialogHeader>

          {/* Fee being assigned */}
          {selectedFeeId && feesQuery.data && (
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Selected Fee</h4>
              <p className="text-sm text-blue-900">
                {feesQuery.data.find(f => f.id === selectedFeeId)?.name} - 
                {formatCurrency(feesQuery.data.find(f => f.id === selectedFeeId)?.amount || 0)}
              </p>
            </div>
          )}

          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search age groups..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                // Implement search functionality if needed
              }}
            />
          </div>

          <div className="space-y-2 border rounded-md p-3 bg-gray-50">
            {ageGroupsQuery.data?.map(ageGroup => (
              <div 
                key={ageGroup.id} 
                className={`flex items-center p-2 hover:bg-gray-100 rounded-md ${
                  (selectedAgeGroups[ageGroup.id]?.[selectedFeeId] || 
                  feeAssignmentsQuery.data?.some(
                    a => a.ageGroupId === ageGroup.id && a.feeId === selectedFeeId
                  )) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <Checkbox
                  id={`age-group-${ageGroup.id || ageGroup.divisionCode}`}
                  className="h-5 w-5 border-2 rounded-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                  checked={
                    // Handle both normal IDs and predefined IDs
                    selectedAgeGroups[ageGroup.id || `predefined-${ageGroup.divisionCode}`]?.[selectedFeeId] || 
                    feeAssignmentsQuery.data?.some(
                      a => (a.ageGroupId === ageGroup.id) || 
                          (a.divisionCode === ageGroup.divisionCode && a.feeId === selectedFeeId)
                    ) || 
                    false
                  }
                  onCheckedChange={(checked) => {
                    const groupId = ageGroup.id || `predefined-${ageGroup.divisionCode}`;
                    setSelectedAgeGroups(prev => ({
                      ...prev,
                      [groupId]: {
                        ...(prev[groupId] || {}),
                        [selectedFeeId]: !!checked
                      }
                    }));
                  }}
                />
                <div className="ml-2 flex-1">
                  <Label htmlFor={`age-group-${ageGroup.id}`} className="font-medium">
                    {ageGroup.name}
                  </Label>
                  <div className="text-xs text-gray-500">
                    Gender: {ageGroup.gender} • Division: {ageGroup.divisionCode} • Birth Year: {ageGroup.birthYear}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Select all age groups
                  const newSelections = {...selectedAgeGroups};
                  ageGroupsQuery.data?.forEach(ageGroup => {
                    if (!newSelections[ageGroup.id]) {
                      newSelections[ageGroup.id] = {};
                    }
                    newSelections[ageGroup.id][selectedFeeId] = true;
                  });
                  setSelectedAgeGroups(newSelections);
                }}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Deselect all age groups
                  const newSelections = {...selectedAgeGroups};
                  ageGroupsQuery.data?.forEach(ageGroup => {
                    if (newSelections[ageGroup.id]) {
                      newSelections[ageGroup.id][selectedFeeId] = false;
                    }
                  });
                  setSelectedAgeGroups(newSelections);
                }}
              >
                Deselect All
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsAssignFeeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAssignments}>
                Save Assignments
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}