import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useUser } from "../hooks/use-user";
import { 
  Loader2, 
  Save, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  BellRing,
  AlertTriangle,
  InfoIcon
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MemberLayout } from "../components/layouts/MemberLayout";
import { 
  Form, 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "../components/ui/form";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Form validation schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .regex(/^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Invalid phone number")
    .optional()
    .or(z.literal('')),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Communication preferences schema
const communicationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(true),
  eventUpdates: z.boolean().default(true),
  paymentReceipts: z.boolean().default(true),
  teamRegistrationAlerts: z.boolean().default(true),
  dataOptOut: z.boolean().default(false)
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;
type CommunicationValues = z.infer<typeof communicationSchema>;

// Phone number formatter
const formatPhoneNumber = (value: string) => {
  if (!value) return '';

  // Strip all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Format only if we have exactly 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return the cleaned number if not 10 digits
  return cleaned;
};

export default function MyAccount() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const queryClient = useQueryClient();

  const { register, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setValue } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  });

  // Custom phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setValue('phone', formattedValue);
  };

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema)
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/user/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Invalidate the user query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['user'] });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      resetPasswordForm();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Form for communication preferences
  const communicationForm = useForm<CommunicationValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: true,
      eventUpdates: true,
      paymentReceipts: true,
      teamRegistrationAlerts: true,
      dataOptOut: false,
    }
  });
  
  // Mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: CommunicationValues) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your communication preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update preferences",
        variant: "destructive",
      });
    },
  });
  
  // Handle communication preferences form submission
  const onCommunicationSubmit = (data: CommunicationValues) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <MemberLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-4xl mx-auto"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground">Manage your personal information and password</p>
          </div>
        </div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-medium">First Name *</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        className="pl-10"
                        {...register("firstName")}
                        aria-invalid={!!profileErrors.firstName}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    {profileErrors.firstName && (
                      <p className="text-sm text-destructive font-medium">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-medium">Last Name *</Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        className="pl-10"
                        {...register("lastName")}
                        aria-invalid={!!profileErrors.lastName}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    {profileErrors.lastName && (
                      <p className="text-sm text-destructive font-medium">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      {...register("email")}
                      aria-invalid={!!profileErrors.email}
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                  {profileErrors.email && (
                    <p className="text-sm text-destructive font-medium">{profileErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      {...register("phone")}
                      onChange={(e) => {
                        register("phone").onChange(e); // Keep react-hook-form updated
                        handlePhoneChange(e); // Apply formatting
                      }}
                      aria-invalid={!!profileErrors.phone}
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  {profileErrors.phone && (
                    <p className="text-sm text-destructive font-medium">{profileErrors.phone.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="px-6"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="font-medium">Current Password *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("currentPassword")}
                        aria-invalid={!!passwordErrors.currentPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="font-medium">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("newPassword")}
                        aria-invalid={!!passwordErrors.newPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-medium">Confirm New Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("confirmPassword")}
                        aria-invalid={!!passwordErrors.confirmPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="px-6"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Communication Preferences */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <BellRing className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription>Manage how we contact you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...communicationForm}>
                <form onSubmit={communicationForm.handleSubmit(onCommunicationSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-base mb-3">Notification Settings</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          control={communicationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Email Notifications
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive notifications via email
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
                          control={communicationForm.control}
                          name="smsNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  SMS Notifications
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive notifications via text message
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
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-base mb-3">Email Preferences</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          control={communicationForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Marketing Emails
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive news, offers, and updates
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
                          control={communicationForm.control}
                          name="eventUpdates"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Event Updates
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive information about upcoming events
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
                          control={communicationForm.control}
                          name="paymentReceipts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Payment Receipts
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive digital copies of your payment receipts
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
                          control={communicationForm.control}
                          name="teamRegistrationAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Team Registration Alerts
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Receive notifications about team registration status
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
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-base mb-3">Privacy Settings</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          control={communicationForm.control}
                          name="dataOptOut"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-base font-medium">
                                  Data Analysis Opt-Out
                                </FormLabel>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Opt out of having your data used for performance analytics and AI-driven insights. 
                                  Note that this may limit some features of the platform that rely on this data.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updatePreferencesMutation.isPending}
                      className="px-6"
                    >
                      {updatePreferencesMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Preferences...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MemberLayout>
  );
}