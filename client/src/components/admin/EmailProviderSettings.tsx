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
import { Loader2, Eye, Pencil } from "lucide-react";

const providerSchema = z.object({
  id: z.number().optional(),
  providerType: z.enum(["smtp", "brevo", "mailgun"]),
  providerName: z.string().min(1, "Provider name is required"),
  settings: z.object({
    host: z.string().optional(),
    port: z.coerce.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    domain: z.string().optional(),
  }),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

const testConnection = async (values: ProviderFormValues) => {
  const response = await fetch("/api/admin/email-providers/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      throw new Error(errorText || 'Failed to test connection');
    }
    throw new Error(errorData.error || 'Failed to test connection');
  }

  return response.json();
};

export function EmailProviderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ["email-providers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-providers");
      if (!response.ok) throw new Error("Failed to fetch providers");
      const data = await response.json();
      return data;
    },
  });

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      providerType: "smtp",
      providerName: "",
      settings: {},
      isActive: true,
      isDefault: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProviderFormValues) => {
      try {
        const url = values.id 
          ? `/api/admin/email-providers/${values.id}`
          : "/api/admin/email-providers";

        const method = values.id ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Server response:', text);
            throw new Error(text || 'Failed to parse server response');
          }
          throw new Error(data.error || 'Failed to save provider settings');
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('Error saving provider settings:', error);
        throw new Error(error.message || 'Failed to save provider settings');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-providers"] });
      toast({
        title: "Success",
        description: "Email provider settings saved successfully",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email provider settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProviderFormValues) => {
    mutation.mutate(values);
  };

  const editProvider = (provider: any) => {
    form.reset({
      id: provider.id,
      providerType: provider.providerType,
      providerName: provider.providerName,
      settings: provider.settings,
      isActive: provider.isActive,
      isDefault: provider.isDefault,
    });
  };

  const viewSettings = (provider: any) => {
    toast({
      title: "Provider Settings",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(provider.settings, null, 2)}</code>
        </pre>
      ),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/email-providers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete provider");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-providers"] });
      toast({
        title: "Success",
        description: "Email provider deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email provider",
        variant: "destructive",
      });
    },
  });


  if (isLoading) {
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
            {form.watch("id") ? "Edit Email Provider" : "Add Email Provider"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="providerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="brevo">Brevo</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My SMTP Server" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("providerType") === "smtp" && (
                <>
                  <FormField
                    control={form.control}
                    name="settings.host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input placeholder="587" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch("providerType") === "brevo" && (
                <FormField
                  control={form.control}
                  name="settings.apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brevo API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="xkeysib-..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("providerType") === "mailgun" && (
                <>
                  <FormField
                    control={form.control}
                    name="settings.apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailgun API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="key-..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailgun Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="mg.yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable or disable this email provider
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

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Default Provider
                      </FormLabel>
                      <FormDescription>
                        Set as the default email provider
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
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const values = form.getValues();
                      await testConnection(values);
                      toast({
                        title: "Success",
                        description: "Email provider connection test successful",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to test connection",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Test Connection
                </Button>
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
                  ) : (
                    form.watch("id") ? 'Update Provider' : 'Save Provider'
                  )}
                </Button>
                {form.watch("id") && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.reset({
                        providerType: "smtp",
                        providerName: "",
                        settings: {},
                        isActive: true,
                        isDefault: false,
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

      {providers && providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider: any) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{provider.providerName}</h3>
                    <p className="text-sm text-gray-500">
                      Type: {provider.providerType}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {provider.isDefault && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Default
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        provider.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {provider.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewSettings(provider)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editProvider(provider)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this provider?')) {
                          deleteMutation.mutate(provider.id);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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