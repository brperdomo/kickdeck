import { useState } from "react";
import { useParams } from "wouter";
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
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

export function FeeManagement() {
  // Get the ID directly from the route parameter
  const { id: eventId } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("FeeManagement mounted with eventId:", eventId);

  const feesQuery = useQuery({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      console.log("Fetching fees for event ID:", eventId);
      try {
        const response = await fetch(`/api/admin/events/${eventId}/fees`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch fees');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching fees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch fees. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!eventId,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      if (!eventId) throw new Error("Event ID is required");

      console.log("Creating fee for event:", eventId, "with values:", values);

      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(parseFloat(values.amount) * 100), // Convert to cents
          beginDate: values.beginDate ? new Date(values.beginDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Create fee error:", errorData);
        throw new Error(errorData.message || "Failed to create fee");
      }
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
    onError: (error: Error) => {
      console.error("Create fee mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create fee",
        variant: "destructive",
      });
    },
  });

  const updateFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues & { id?: number }) => {
      if (!eventId) throw new Error("Event ID is required");

      console.log("Updating fee:", values.id, "for event:", eventId);

      const response = await fetch(`/api/admin/events/${eventId}/fees/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
          beginDate: values.beginDate ? new Date(values.beginDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update fee error:", errorData);
        throw new Error(errorData.message || "Failed to update fee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Fee updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Update fee mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update fee",
        variant: "destructive",
      });
    },
  });

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      beginDate: "",
      endDate: "",
      applyToAll: false,
    },
  });

  const onSubmit = async (values: FeeFormValues & { id?: number }) => {
    try {
      if (values.id) {
        await updateFeeMutation.mutateAsync(values);
      } else {
        await createFeeMutation.mutateAsync(values);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to save fee. Please check all fields are valid.",
        variant: "destructive",
      });
    }
  };

  const feeToEdit = form.watch("id");
  const isSubmitting = createFeeMutation.isPending || updateFeeMutation.isPending;

  if (feesQuery.isLoading) {
    return <div>Loading fees...</div>;
  }

  if (feesQuery.error) {
    console.error("Fees query error:", feesQuery.error);
    return <div>Error loading fees: {(feesQuery.error as Error).message}</div>;
  }

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {feeToEdit ? "Update Fee" : "Create New Fee"}
                  </DialogTitle>
                  <DialogDescription>
                    {feeToEdit
                      ? "Update an existing fee for this event."
                      : "Add a new fee for this event. You can specify dates and whether it applies to all registrants."}
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
                    <FormField
                      control={form.control}
                      name="applyToAll"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Apply to All Registrants</FormLabel>
                            <FormDescription>
                              If checked, this fee will be applied to all registrations
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
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
                  <TableHead>Apply to All</TableHead>
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
                    <TableCell>{fee.applyToAll ? "Yes" : "No"}</TableCell>
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