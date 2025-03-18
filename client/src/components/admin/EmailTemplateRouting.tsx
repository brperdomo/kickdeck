import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Trash } from "lucide-react";

const templateRoutingSchema = z.object({
  id: z.number().optional(),
  templateType: z.string().min(1, "Template type is required"),
  providerId: z.string().min(1, "Provider is required"),
  fromEmail: z.string().email("Valid email address is required"),
  fromName: z.string().min(1, "From name is required"),
  isActive: z.boolean().default(true),
});

type TemplateRoutingFormValues = z.infer<typeof templateRoutingSchema>;

const TEMPLATE_TYPES = [
  { value: "password_reset", label: "Password Reset" },
  { value: "registration", label: "Registration" },
  { value: "payment_confirmation", label: "Payment Confirmation" },
  { value: "general_notification", label: "General Notification" },
] as const;

export function EmailTemplateRouting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["email-providers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-providers");
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
  });

  const { data: routings, isLoading: isLoadingRoutings } = useQuery({
    queryKey: ["email-template-routings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-template-routings");
      if (!response.ok) throw new Error("Failed to fetch template routings");
      return response.json();
    },
  });

  const form = useForm<TemplateRoutingFormValues>({
    resolver: zodResolver(templateRoutingSchema),
    defaultValues: {
      templateType: "",
      providerId: "",
      fromEmail: "",
      fromName: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: TemplateRoutingFormValues) => {
      const url = values.id
        ? `/api/admin/email-template-routings/${values.id}`
        : "/api/admin/email-template-routings";

      const method = values.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save template routing");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-template-routings"] });
      toast({
        title: "Success",
        description: "Email template routing saved successfully",
      });
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

  const onSubmit = (values: TemplateRoutingFormValues) => {
    mutation.mutate(values);
  };

  const editRouting = (routing: any) => {
    form.reset({
      id: routing.id,
      templateType: routing.templateType,
      providerId: routing.providerId.toString(),
      fromEmail: routing.fromEmail,
      fromName: routing.fromName,
      isActive: routing.isActive,
    });
  };

  if (isLoadingProviders || isLoadingRoutings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {form.watch("id") ? "Edit Template Routing" : "Add Template Routing"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an email provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers?.map((provider: any) => (
                          <SelectItem
                            key={provider.id}
                            value={provider.id.toString()}
                          >
                            {provider.providerName}
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
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="noreply@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Company Support"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable or disable this routing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-between space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : form.watch("id") ? (
                    "Update Routing"
                  ) : (
                    "Save Routing"
                  )}
                </Button>
                {form.watch("id") && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.reset({
                        templateType: "",
                        providerId: "",
                        fromEmail: "",
                        fromName: "",
                        isActive: true,
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {routings && routings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Template Routings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routings.map((routing: any) => (
                <div
                  key={routing.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">
                      {TEMPLATE_TYPES.find(t => t.value === routing.templateType)?.label || routing.templateType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      From: {routing.fromName} &lt;{routing.fromEmail}&gt;
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        routing.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {routing.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editRouting(routing)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
