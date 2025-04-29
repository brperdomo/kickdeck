import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Clock } from "lucide-react";

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  hasLights: z.boolean().default(false),
  hasParking: z.boolean().default(false),
  isOpen: z.boolean().default(true),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

interface Field {
  id: number;
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  specialInstructions?: string;
  complexId: number;
}

interface FieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FieldFormValues) => Promise<void>;
  field?: Field | null;
  complexId: number;
}

export function FieldEditor({ open, onOpenChange, onSubmit, field, complexId }: FieldEditorProps) {
  const { toast } = useToast();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: '',
      hasLights: false,
      hasParking: false,
      isOpen: true,
      openTime: '08:00',
      closeTime: '22:00',
      specialInstructions: '',
    },
  });

  useEffect(() => {
    if (field) {
      form.reset({
        name: field.name,
        hasLights: field.hasLights,
        hasParking: field.hasParking,
        isOpen: field.isOpen,
        openTime: field.openTime || '08:00',
        closeTime: field.closeTime || '22:00',
        specialInstructions: field.specialInstructions || '',
      });
    } else {
      form.reset({
        name: '',
        hasLights: false,
        hasParking: false,
        isOpen: true,
        openTime: '08:00',
        closeTime: '22:00',
        specialInstructions: '',
      });
    }
  }, [field, form]);

  const handleSubmit = async (data: FieldFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add New Field'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter field name" {...formField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasLights"
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Has Lights</FormLabel>
                    <FormControl>
                      <Switch
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasParking"
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Has Parking</FormLabel>
                    <FormControl>
                      <Switch
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOpen"
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Field Status</FormLabel>
                    <FormControl>
                      <Switch
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openTime"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            className="pl-8"
                            {...formField}
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="closeTime"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            className="pl-8"
                            {...formField}
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any special instructions"
                      {...formField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {field ? 'Save Changes' : 'Create Field'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
