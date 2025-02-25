import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const feeFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Fee name is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  applyToAll: z.boolean().default(false),
  selectedAgeGroups: z.array(z.string()).optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

interface AgeGroup {
  id: string;
  divisionCode: string;
  ageGroup: string;
  gender: string;
}

export function FeeManagement() {
  const [location] = useLocation();
  const eventId = location.split('/')[3];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      selectedAgeGroups: [],
    },
  });

  const feesQuery = useQuery({
    queryKey: [`/api/admin/events/${eventId}/fees`],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await fetch(`/api/admin/events/${eventId}/fees`);
      if (!response.ok) {
        throw new Error("Failed to fetch fees");
      }
      return response.json();
    },
    enabled: !!eventId
  });

  const ageGroupsQuery = useQuery({
    queryKey: [`/api/admin/events/${eventId}/age-groups`],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) {
        throw new Error("Failed to fetch age groups");
      }
      return response.json();
    },
    enabled: !!eventId
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
          beginDate: values.beginDate ? new Date(values.beginDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          ageGroupIds: values.applyToAll ? [] : values.selectedAgeGroups,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create fee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}/fees`] });
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
    mutationFn: async (values: FeeFormValues & { id?: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
          beginDate: values.beginDate ? new Date(values.beginDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          ageGroupIds: values.applyToAll ? [] : values.selectedAgeGroups,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update fee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}/fees`] });
      setIsDialogOpen(false);
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

  const onSubmit = (values: FeeFormValues & { id?: number }) => {
    if (values.id) {
      updateFeeMutation.mutate(values);
    } else {
      createFeeMutation.mutate(values);
    }
  };

  const watchApplyToAll = form.watch("applyToAll");
  const watchSelectedAgeGroups = form.watch("selectedAgeGroups");

  const feeToEdit = form.watch("id");
  const isSubmitting = createFeeMutation.isLoading || updateFeeMutation.isLoading;

  if (feesQuery.isLoading || ageGroupsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (feesQuery.error || ageGroupsQuery.error) {
    return <div>Error loading data</div>;
  }

  const getAgeGroupLabel = (ageGroup: AgeGroup) =>
    `${ageGroup.ageGroup} ${ageGroup.gender} (${ageGroup.divisionCode})`;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <CardTitle>Event Fees</CardTitle>
              <CardDescription>
                Manage fees for this event. Fees can be applied to all registrants or specific age groups.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Fee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {feeToEdit ? "Update Fee" : "Create New Fee"}
                  </DialogTitle>
                  <DialogDescription>
                    {feeToEdit
                      ? "Update an existing fee for this event."
                      : "Add a new fee for this event. You can specify dates and whether it applies to all registrants or specific age groups."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              <Input type="date" {...field} />
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
                              <Input type="date" {...field} />
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
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue("selectedAgeGroups", []);
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Apply to All Registrants</FormLabel>
                            <FormDescription>
                              If checked, this fee will be applied to all registrations regardless of age group
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    {!watchApplyToAll && (
                      <FormField
                        control={form.control}
                        name="selectedAgeGroups"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Groups</FormLabel>
                            <FormDescription>
                              Select the age groups this fee applies to
                            </FormDescription>
                            <div className="space-y-2">
                              {ageGroupsQuery.data.map((ageGroup: AgeGroup) => (
                                <FormField
                                  key={ageGroup.id}
                                  control={form.control}
                                  name="selectedAgeGroups"
                                  render={({ field }) => (
                                    <FormItem
                                      key={ageGroup.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(ageGroup.id)}
                                          onCheckedChange={(checked) => {
                                            const updatedSelection = checked
                                              ? [...(field.value || []), ageGroup.id]
                                              : field.value?.filter((id) => id !== ageGroup.id) || [];
                                            form.setValue("selectedAgeGroups", updatedSelection);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {getAgeGroupLabel(ageGroup)}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? feeToEdit
                            ? "Updating..."
                            : "Creating..."
                          : feeToEdit
                            ? "Update Fee"
                            : "Create Fee"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border mt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="py-4">Name</TableHead>
                  <TableHead className="py-4">Amount</TableHead>
                  <TableHead>Begin Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Age Groups</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feesQuery.data?.map((fee: any) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.name}</TableCell>
                    <TableCell>${(fee.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      {fee.beginDate ? format(new Date(fee.beginDate), "PP") : "-"}
                    </TableCell>
                    <TableCell>
                      {fee.endDate ? format(new Date(fee.endDate), "PP") : "-"}
                    </TableCell>
                    <TableCell>
                      {fee.applyToAll ? (
                        <Badge variant="secondary">All Age Groups</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {fee.ageGroupIds?.map((agId: string) => {
                            const ageGroup = ageGroupsQuery.data?.find(
                              (ag: AgeGroup) => ag.id === agId
                            );
                            return ageGroup ? (
                              <Badge key={agId} variant="outline">
                                {getAgeGroupLabel(ageGroup)}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.reset({
                            id: fee.id,
                            name: fee.name,
                            amount: (fee.amount / 100).toString(),
                            beginDate: fee.beginDate ? new Date(fee.beginDate).toISOString().split('T')[0] : "",
                            endDate: fee.endDate ? new Date(fee.endDate).toISOString().split('T')[0] : "",
                            applyToAll: fee.applyToAll,
                            selectedAgeGroups: fee.ageGroupIds || [],
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}