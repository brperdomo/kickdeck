import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const feeFormSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  applyToAll: z.boolean().default(false),
  accountingCodeId: z.number().optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

interface FeeFormProps {
  initialData?: FeeFormValues;
  onCancel: () => void;
  onSuccess: () => void;
  accountingCodes: Array<{ id: number; name: string; code: string }>;
}

export function FeeForm({ initialData, onCancel, onSuccess, accountingCodes }: FeeFormProps) {
  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: initialData || {
      name: "",
      amount: 0,
      applyToAll: false,
    },
  });

  const onSubmit = async (data: FeeFormValues) => {
    try {
      const response = await fetch("/api/admin/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create fee");
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating fee:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="beginDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Begin Date</FormLabel>
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
                <FormLabel>End Date</FormLabel>
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
          name="accountingCodeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accounting Code</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an accounting code" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accountingCodes.map((code) => (
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

        <FormField
          control={form.control}
          name="applyToAll"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Apply to All Age Groups</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-[#2196F3] hover:bg-[#1976D2]">
            Save Fee
          </Button>
        </div>
      </form>
    </Form>
  );
}
