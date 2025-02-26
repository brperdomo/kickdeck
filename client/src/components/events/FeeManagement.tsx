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
  const eventId = params.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // First check if we're authenticated
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Please login to continue');
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
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

  // Only fetch fees if we're authenticated
  const feesQuery = useQuery({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/fees`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Please login to continue');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch fees');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching fees:', error);
        throw error;
      }
    },
    enabled: !!eventId && !!userQuery.data,
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create fee');
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
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: FeeFormValues) => {
    createFeeMutation.mutate(values);
  };

  if (userQuery.isLoading || feesQuery.isLoading) {
    return <div>Loading fees...</div>;
  }

  if (userQuery.error || feesQuery.error) {
    return <div>Error loading fees: {(userQuery.error || feesQuery.error)?.message}</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Fees</CardTitle>
          <CardDescription>
            Manage fees for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Fee</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFee ? "Edit Fee" : "Create New Fee"}
                  </DialogTitle>
                  <DialogDescription>
                    Add a new fee to the event
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="beginDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Begin Date (Optional)</FormLabel>
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
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="applyToAll"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Apply to all registrations</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createFeeMutation.isPending}
                      >
                        {createFeeMutation.isPending
                          ? "Saving..."
                          : "Create Fee"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Begin Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Apply to All</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.reset({
                          name: fee.name,
                          amount: (fee.amount / 100).toString(),
                          beginDate: fee.beginDate ? new Date(fee.beginDate).toISOString().split('T')[0] : "",
                          endDate: fee.endDate ? new Date(fee.endDate).toISOString().split('T')[0] : "",
                          applyToAll: fee.applyToAll,
                        });
                        setEditingFee(fee);
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
        </CardContent>
      </Card>
    </div>
  );
}