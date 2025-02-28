import { useState } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeAgeGroupAssignment } from "./FeeAgeGroupAssignment";

interface Fee {
  id: number;
  name: string;
  amount: number;
  beginDate?: string;
  endDate?: string;
  accountingCodeId?: number;
}

interface AgeGroup {
  id: string;
  eventId: string;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
}

interface FeeAssignment {
  ageGroupId: string;
  feeId: number;
}

const feeFormSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  accountingCodeId: z.number().nullable().optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;
type SortField = 'name' | 'amount' | 'beginDate';
type SortDirection = 'asc' | 'desc';

export function FeeManagement() {
  const { id: eventId } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeTab, setActiveTab] = useState<"fees" | "assignments">("fees");
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const feesQuery = useQuery<Fee[]>({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/fees`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch fees: ${response.status} ${response.statusText} ${errorData.error || ''}`);
        }
        return response.json();
      } catch (error) {
        console.error("Fees fetch error:", error);
        throw error;
      }
    },
  });

  const accountingCodesQuery = useQuery({
    queryKey: ['accountingCodes'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/accounting-codes');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch accounting codes: ${response.status} ${response.statusText} ${errorData.error || ''}`);
        }
        return response.json();
      } catch (error) {
        console.error("Accounting codes fetch error:", error);
        throw error;
      }
    },
  });

  const ageGroupsQuery = useQuery<AgeGroup[]>({
    queryKey: ['ageGroups', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch age groups: ${response.status} ${response.statusText} ${errorData.error || ''}`);
        }
        return response.json();
      } catch (error) {
        console.error("Age groups fetch error:", error);
        throw error;
      }
    },
  });

  const assignmentsQuery = useQuery<Record<number, string[]>>({
    queryKey: ['fee-assignments', eventId],
    queryFn: async () => {
      try {
        if (!eventId) throw new Error("Event ID is required");

        const response = await fetch(`/api/admin/events/${eventId}/fees/assignments`);
        if (!response.ok) {
          throw new Error(`Failed to fetch fee assignments: ${response.status} ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Fee assignments fetch error:", error);
        throw error;
      }
    },
    enabled: !!eventId,
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
        }),
      });
      if (!response.ok) throw new Error('Failed to create fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Fee created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues & { id: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
        }),
      });
      if (!response.ok) throw new Error('Failed to update fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      setIsDialogOpen(false);
      setEditingFee(null);
      form.reset();
      toast({
        title: "Success",
        description: "Fee updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${feeId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      toast({
        title: "Success",
        description: "Fee deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAssignmentsMutation = useMutation({
    mutationFn: async (newAssignments: Record<number, string[]>) => {
      const response = await fetch(`/api/admin/events/${eventId}/fee-assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: newAssignments }),
      });
      if (!response.ok) throw new Error('Failed to update assignments');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeAssignments', eventId] });
      toast({
        title: "Success",
        description: "Fee assignments updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: FeeFormValues) => {
    if (editingFee) {
      updateFeeMutation.mutate({ ...values, id: editingFee.id });
    } else {
      createFeeMutation.mutate(values);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFees = feesQuery.data ? [...feesQuery.data].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'amount') {
      return (a.amount - b.amount) * modifier;
    }
    if (sortField === 'beginDate') {
      return (new Date(a.beginDate || 0).getTime() - new Date(b.beginDate || 0).getTime()) * modifier;
    }
    return a[sortField].localeCompare(b[sortField]) * modifier;
  }) : [];

  const handleAssignmentsChange = (newAssignments: Record<number, string[]>) => {
    setAssignments(newAssignments);
    updateAssignmentsMutation.mutate(newAssignments);
  };

  if (feesQuery.isLoading || accountingCodesQuery.isLoading || ageGroupsQuery.isLoading || assignmentsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (feesQuery.error || accountingCodesQuery.error || ageGroupsQuery.error || assignmentsQuery.error) {
    console.error("Fees Query Error:", feesQuery.error);
    console.error("Accounting Codes Query Error:", accountingCodesQuery.error);
    console.error("Age Groups Query Error:", ageGroupsQuery.error);
    console.error("Assignments Query Error:", assignmentsQuery.error);

    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="text-red-500 font-semibold">Failed to load fee management data</div>
        <div className="text-sm text-gray-500 max-w-md text-center">
          {feesQuery.error ? `Fees error: ${feesQuery.error.message}` : ''}
          {accountingCodesQuery.error ? `Accounting codes error: ${accountingCodesQuery.error.message}` : ''}
          {ageGroupsQuery.error ? `Age groups error: ${ageGroupsQuery.error.message}` : ''}
          {assignmentsQuery.error ? `Assignments error: ${assignmentsQuery.error.message}` : ''}
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Events
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Fee Management</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fees" | "assignments")}>
        <TabsList className="mb-6">
          <TabsTrigger value="fees">Fee List</TabsTrigger>
          <TabsTrigger value="assignments">Age Group Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="fees">
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditingFee(null);
              form.reset();
              setIsDialogOpen(true);
            }}>
              Add New Fee
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      Fee Name <ArrowUpDown className="inline h-4 w-4" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                      Amount <ArrowUpDown className="inline h-4 w-4" />
                    </TableHead>
                    <TableHead>Accounting Code</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('beginDate')}>
                      Begin Date <ArrowUpDown className="inline h-4 w-4" />
                    </TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell>{formatCurrency(fee.amount)}</TableCell>
                      <TableCell>{accountingCodesQuery.data?.find(code => code.id === fee.accountingCodeId)?.name || '-'}</TableCell>
                      <TableCell>
                        {fee.beginDate ? format(new Date(fee.beginDate), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {fee.endDate ? format(new Date(fee.endDate), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              form.reset({
                                name: fee.name,
                                amount: (fee.amount / 100).toString(),
                                beginDate: fee.beginDate || "",
                                endDate: fee.endDate || "",
                                accountingCodeId: fee.accountingCodeId || null,
                              });
                              setEditingFee(fee);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this fee?')) {
                                deleteFeeMutation.mutate(fee.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardContent className="p-6">
              <FeeAgeGroupAssignment
                fees={feesQuery.data || []}
                ageGroups={ageGroupsQuery.data || []}
                assignments={assignments}
                onAssignmentsChange={handleAssignmentsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee" : "Add New Fee"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter fee name" />
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
                      <Input {...field} type="number" step="0.01" placeholder="0.00" />
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
                      <FormLabel>Begin Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
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
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
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
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select accounting code" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountingCodesQuery.data?.map((code: any) => (
                          <SelectItem key={code.id} value={code.id.toString()}>
                            {code.name}
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
    </div>
  );
}