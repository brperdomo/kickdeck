import React, { useState, useEffect } from "react";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { motion } from "framer-motion";
import { 
  User, 
  BellRing, 
  Mail, 
  Phone, 
  Save, 
  ShieldCheck,
  AlertTriangle,
  InfoIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for communication preferences
const communicationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(true),
  eventUpdates: z.boolean().default(true),
  paymentReceipts: z.boolean().default(true),
  teamRegistrationAlerts: z.boolean().default(true),
  dataOptOut: z.boolean().default(false)
});

type CommunicationValues = z.infer<typeof communicationSchema>;

// Schema for personal information
const personalInfoSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional()
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type PasswordValues = z.infer<typeof passwordSchema>;

export default function AccountSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<string>("personal");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Personal information form
  const personalInfoForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  // Communication preferences form
  const communicationForm = useForm<CommunicationValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      emailNotifications: user?.preferences?.emailNotifications ?? true,
      smsNotifications: user?.preferences?.smsNotifications ?? true,
      marketingEmails: user?.preferences?.marketingEmails ?? true,
      eventUpdates: user?.preferences?.eventUpdates ?? true,
      paymentReceipts: user?.preferences?.paymentReceipts ?? true,
      teamRegistrationAlerts: user?.preferences?.teamRegistrationAlerts ?? true,
      dataOptOut: user?.preferences?.dataOptOut ?? false
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update personal information when user data changes
  useEffect(() => {
    if (user) {
      personalInfoForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
      
      // Update communication preferences from user data
      communicationForm.reset({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? true,
        marketingEmails: user.preferences?.marketingEmails ?? true,
        eventUpdates: user.preferences?.eventUpdates ?? true,
        paymentReceipts: user.preferences?.paymentReceipts ?? true,
        teamRegistrationAlerts: user.preferences?.teamRegistrationAlerts ?? true,
        dataOptOut: user.preferences?.dataOptOut ?? false
      });
    }
  }, [user, personalInfoForm, communicationForm]);

  // Mutation for updating personal information
  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoValues) => {
      const response = await fetch("/api/user/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update personal information");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Your personal information has been updated",
      });
    },
  });

  // Mutation for updating communication preferences
  const updateCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationValues) => {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update communication preferences");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Your communication preferences have been updated",
      });
    },
  });

  // Mutation for updating password
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordValues) => {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update password");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
  });

  // Handle form submissions
  const onPersonalInfoSubmit = (data: PersonalInfoValues) => {
    updatePersonalInfoMutation.mutate(data);
  };

  const onCommunicationSubmit = (data: CommunicationValues) => {
    updateCommunicationMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordValues) => {
    updatePasswordMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-8 space-y-6 max-w-4xl"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and data privacy options</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Communication</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...personalInfoForm}>
                  <form 
                    onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} 
                    className="space-y-6"
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={personalInfoForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={personalInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for important notifications related to your account
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={updatePersonalInfoMutation.isPending}
                    >
                      {updatePersonalInfoMutation.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card className="member-card shadow-md">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center px-4 py-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email Address</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Verified
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center px-4 py-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <InfoIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Account Type</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.isAdmin ? "Administrator & Member" : "Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>
                  Manage how and when we contact you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...communicationForm}>
                  <form 
                    onSubmit={communicationForm.handleSubmit(onCommunicationSubmit)} 
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Channels</h3>
                      
                      <FormField
                        control={communicationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
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
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive important alerts via text messages
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
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Types</h3>
                      
                      <FormField
                        control={communicationForm.control}
                        name="marketingEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Marketing Emails</FormLabel>
                              <FormDescription>
                                Receive marketing and promotional emails
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
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Event Updates</FormLabel>
                              <FormDescription>
                                Get notified about changes to events you're registered for
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
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Payment Receipts</FormLabel>
                              <FormDescription>
                                Receive receipts for payments and transactions
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
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Team Registration Alerts</FormLabel>
                              <FormDescription>
                                Be notified when team registration status changes
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
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data Privacy</h3>
                      
                      <FormField
                        control={communicationForm.control}
                        name="dataOptOut"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border bg-destructive/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base font-semibold flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                                Data Processing Opt-Out
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Opt out of having your data used for analytics, performance measurements, and service improvements. 
                                This may limit some features that rely on historical data analysis.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={updateCommunicationMutation.isPending}
                    >
                      {updateCommunicationMutation.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Preferences
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form 
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} 
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MemberLayout>
  );
}