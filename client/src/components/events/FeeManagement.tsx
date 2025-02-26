import { useState, useEffect } from "react";
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
import { useLocation } from "@/hooks/use-location";

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
  const params = useParams();
  const eventId = params.eventId;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('FeeManagement mounted with eventId:', eventId);
  }, [eventId]);

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

  const feesQuery = useQuery({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      if (!eventId) {
        console.error('No eventId provided to feesQuery');
        throw new Error("Event ID is required");
      }
      console.log('Fetching fees for event:', eventId);

      try {
        const response = await fetch(`/api/admin/events/${eventId}/fees`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch fees. Status:', response.status, 'Error:', errorText);
          throw new Error(errorText || "Failed to fetch fees");
        }

        const data = await response.json();
        console.log('Received fees data:', JSON.stringify(data, null, 2));

        // Transform BigInt eventId to string to avoid JSON serialization issues
        return Array.isArray(data) ? data.map(fee => ({
          ...fee,
          eventId: fee.eventId.toString(),
          amount: Number(fee.amount) / 100 // Convert cents to dollars
        })) : [];
      } catch (error) {
        console.error('Error in fees query:', error);
        throw error;
      }
    },
    enabled: !!eventId,
    retry: 2,
    refetchOnWindowFocus: false
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100), // Convert to cents
          beginDate: values.beginDate ? new Date(values.beginDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create fee");
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      await queryClient.refetchQueries({ queryKey: ['fees', eventId] });
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
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update fee");
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

  const feeToEdit = form.watch("id"); // Track if an id is set for editing

  const isSubmitting = createFeeMutation.isLoading || updateFeeMutation.isLoading;

  if (feesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (feesQuery.error) {
    return <div>Error loading fees</div>;
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
                    <TableCell>${fee.amount.toFixed(2)}</TableCell>
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
                            name: fee.name,
                            amount: fee.amount.toString(),
                            beginDate: fee.beginDate ? new Date(fee.beginDate).toISOString().split('T')[0] : "",
                            endDate: fee.endDate ? new Date(fee.endDate).toISOString().split('T')[0] : "",
                            applyToAll: fee.applyToAll,
                          });
                          form.setValue("id", fee.id);
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