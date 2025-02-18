import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const couponFormSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(["fixed", "percentage"]),
  amount: z.number().min(0, "Amount must be positive"),
  hasExpiration: z.boolean(),
  expirationDate: z.string().optional(),
  description: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  couponToEdit?: any;
}

export function CouponModal({ open, onOpenChange, eventId, couponToEdit }: CouponModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasExpiration, setHasExpiration] = useState(couponToEdit?.expirationDate ? true : false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: couponToEdit?.code || "",
      discountType: couponToEdit?.discountType || "fixed",
      amount: couponToEdit?.amount || 0,
      hasExpiration: !!couponToEdit?.expirationDate,
      expirationDate: couponToEdit?.expirationDate || "",
      description: couponToEdit?.description || "",
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormValues) => {
      try {
        const response = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...data,
            eventId,
            expirationDate: data.hasExpiration ? data.expirationDate : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to create coupon");
        }

        const responseData = await response.json();
        return responseData;
      } catch (error) {
        console.error('Error creating coupon:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async (data: CouponFormValues) => {
      try {
        const response = await fetch(`/api/admin/coupons/${couponToEdit.id}`, {
          method: "PATCH",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...data,
            eventId,
            expirationDate: data.hasExpiration ? data.expirationDate : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to update coupon");
        }

        const responseData = await response.json();
        return responseData;
      } catch (error) {
        console.error('Error updating coupon:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CouponFormValues) => {
    try {
      if (couponToEdit) {
        await updateCouponMutation.mutateAsync(data);
      } else {
        await createCouponMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-xl shadow-lg">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {couponToEdit ? "Edit Coupon" : "Create New Coupon"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SUMMER2024" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch("discountType") === "fixed" ? "Amount ($)" : "Percentage (%)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasExpiration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Set Expiration Date</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setHasExpiration(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasExpiration && (
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
              >
                {(createCouponMutation.isPending || updateCouponMutation.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {couponToEdit ? "Update" : "Create"} Coupon
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}