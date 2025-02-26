import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const feeFormSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  applyToAll: z.boolean().default(false),
  ageGroups: z.array(z.number()).default([]),
  accountingCodeId: z.number().nullable().optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;
type SortField = 'name' | 'amount' | 'beginDate';
type SortDirection = 'asc' | 'desc';

export function FeeManagement() {
  const params = useParams();
  const eventId = params.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      beginDate: "",
      endDate: "",
      applyToAll: false,
      ageGroups: [],
      accountingCodeId: null,
    }
  });

  // Reset form when editing fee changes
  useEffect(() => {
    if (editingFee) {
      console.log("Setting form values for editing fee:", editingFee);
      form.reset({
        name: editingFee.name,
        amount: (editingFee.amount / 100).toString(),
        beginDate: editingFee.beginDate || "",
        endDate: editingFee.endDate || "",
        applyToAll: editingFee.applyToAll || false,
        ageGroups: editingFee.ageGroups || [],
        accountingCodeId: editingFee.accountingCodeId || null,
      });
    }
  }, [editingFee, form]);

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event details');
      return response.json();
    },
  });

  const ageGroupsQuery = useQuery({
    queryKey: ['ageGroups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
  });

  const feesQuery = useQuery({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`);
      if (!response.ok) throw new Error('Failed to fetch fees');
      return response.json();
    },
  });

  const accountingCodesQuery = useQuery({
    queryKey: ['accountingCodes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    },
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
          ageGroups: values.applyToAll ? [] : values.ageGroups,
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
      console.log("Updating fee with values:", values);
      const response = await fetch(`/api/admin/events/${eventId}/fees/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
          ageGroups: values.applyToAll ? [] : values.ageGroups,
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

  const handleSubmit = (values: FeeFormValues) => {
    console.log("Submitting form with values:", values);
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

  const renderAgeGroupList = (fee: any) => {
    if (fee.applyToAll) return 'All';

    const selectedGroups = (fee.ageGroups || [])
      .map((agId: number) => {
        const group = ageGroupsQuery.data?.find((g: any) => g.id === agId);
        return group ? `${group.ageGroup} ${group.gender}` : null;
      })
      .filter(Boolean);

    return selectedGroups.length ? selectedGroups.join(', ') : '-';
  };

  if (feesQuery.isLoading || ageGroupsQuery.isLoading || accountingCodesQuery.isLoading || eventQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (feesQuery.error || ageGroupsQuery.error || accountingCodesQuery.error || eventQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="text-red-500 font-semibold">Failed to load fee management data</div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Events
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Manage Fees for {eventQuery.data?.name}
          </h1>
        </div>
        <Button onClick={() => {
          setEditingFee(null);
          form.reset();
          setIsDialogOpen(true);
        }}>
          Add New Fee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  Fee Name <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>Age Groups</TableHead>
                <TableHead>Accounting Code</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('beginDate')}>
                  Begin Date <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFees.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.name}</TableCell>
                  <TableCell>{formatCurrency(fee.amount)}</TableCell>
                  <TableCell>{renderAgeGroupList(fee)}</TableCell>
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
                          console.log("Setting editing fee:", fee);
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
                name="applyToAll"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Apply to All Age Groups</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!form.watch("applyToAll") && ageGroupsQuery.data && (
                <FormField
                  control={form.control}
                  name="ageGroups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Age Groups</FormLabel>
                      <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                        {ageGroupsQuery.data.map((group: any) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value.includes(group.id)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, group.id]
                                  : field.value.filter((id: number) => id !== group.id);
                                field.onChange(newValue);
                              }}
                            />
                            <span>{group.ageGroup} - {group.gender}</span>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                            {code.code} - {code.name}
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

async function createFee(eventId: string, data: any) {
  const response = await fetch(`/api/admin/events/${eventId}/fees`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create fee');
  return response.json();
}

async function updateFee(eventId: string, feeId: number, data: any) {
  const response = await fetch(`/api/admin/events/${eventId}/fees/${feeId}`, {
    method: "PATCH",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update fee');
  return response.json();
}