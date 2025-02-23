import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const accountingCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type AccountingCodeFormValues = z.infer<typeof accountingCodeSchema>;

interface AccountingCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeToEdit?: {
    id: number;
    code: string;
    name: string;
    description?: string;
  };
}

export function AccountingCodeModal({
  open,
  onOpenChange,
  codeToEdit,
}: AccountingCodeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountingCodeFormValues>({
    resolver: zodResolver(accountingCodeSchema),
    defaultValues: {
      code: codeToEdit?.code || "",
      name: codeToEdit?.name || "",
      description: codeToEdit?.description || "",
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: AccountingCodeFormValues) => {
      const response = await fetch("/api/admin/accounting-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create accounting code");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/admin/accounting-codes"]);
      toast({
        title: "Success",
        description: "Accounting code created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create accounting code",
        variant: "destructive",
      });
    },
  });

  const updateCodeMutation = useMutation({
    mutationFn: async (data: AccountingCodeFormValues) => {
      if (!codeToEdit) throw new Error("No code selected for editing");

      const response = await fetch(`/api/admin/accounting-codes/${codeToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update accounting code");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/admin/accounting-codes"]);
      toast({
        title: "Success",
        description: "Accounting code updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update accounting code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AccountingCodeFormValues) => {
    setIsSubmitting(true);
    try {
      if (codeToEdit) {
        await updateCodeMutation.mutateAsync(data);
      } else {
        await createCodeMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {codeToEdit ? "Edit Accounting Code" : "Add Accounting Code"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {codeToEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{codeToEdit ? "Update" : "Create"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
