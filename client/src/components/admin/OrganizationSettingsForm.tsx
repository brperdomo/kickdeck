import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { useOrganizationSettings } from "../../hooks/use-organization-settings";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Upload, Building, Phone, MapPin, Mail } from "lucide-react";
import { useState, useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function OrganizationSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useOrganizationSettings();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      logoUrl: "",
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        logoUrl: settings.logoUrl || "",
      });

      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings, form]);

  // Update logo preview when logoUrl changes
  useEffect(() => {
    const logoUrl = form.watch('logoUrl');
    if (logoUrl && logoUrl !== logoPreview) {
      setLogoPreview(logoUrl);
    }
  }, [form.watch('logoUrl')]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateSettings(data);
      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input {...field} placeholder="Enter organization name" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input {...field} type="email" placeholder="contact@example.com" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input {...field} type="tel" placeholder="+1 (555) 000-0000" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input {...field} placeholder="123 Main St, City, State, ZIP" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input {...field} placeholder="/uploads/your-logo.png" className="pl-9" />
                      </div>
                      
                      {logoPreview ? (
                        <div className="mt-2 border rounded-md p-4 bg-muted/30 flex flex-col items-center justify-center">
                          <img 
                            src={logoPreview} 
                            alt="Organization Logo" 
                            className="max-h-48 object-contain"
                            onError={() => setLogoPreview(null)}
                          />
                          <span className="text-xs text-muted-foreground mt-2">Logo Preview</span>
                        </div>
                      ) : (
                        <div className="mt-2 border rounded-md p-4 bg-muted/30 flex flex-col items-center justify-center h-48">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">No logo preview available</span>
                          <span className="text-xs text-muted-foreground">Enter a valid URL to see a preview</span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the full URL path to your organization's logo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isUpdating} className="w-auto">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}