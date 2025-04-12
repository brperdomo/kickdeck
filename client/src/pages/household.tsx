import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@/hooks/use-user";
import { useHouseholdInvitations } from "@/hooks/use-household-invitations";
import { useHouseholdDetails } from "@/hooks/use-household-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Send, Clock, Home, HomeIcon, MapPin, Loader2, Save, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { UserBanner } from "@/components/user/UserBanner";

// Schema for the address form
const addressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
});

type AddressValues = z.infer<typeof addressSchema>;

export default function HouseholdPage() {
  const { user } = useUser();
  const { invitations, isLoading: invitationsLoading, sendInvitation } = useHouseholdInvitations();
  const { household, isLoading: householdLoading, updateHouseholdAddress } = useHouseholdDetails();
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  // Form for household address updates
  const addressForm = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: household?.address || "",
      city: household?.city || "",
      state: household?.state || "",
      zipCode: household?.zipCode || "",
    },
  });

  // Update form when household data changes
  useEffect(() => {
    if (household) {
      addressForm.reset({
        address: household.address,
        city: household.city,
        state: household.state,
        zipCode: household.zipCode,
      });
    }
  }, [household, addressForm]);

  const checkEmailAvailability = async (email: string) => {
    try {
      setIsChecking(true);
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (!data.available) {
        setEmailError(data.message || "Email is not available");
        return false;
      }

      setEmailError("");
      return true;
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailError("Failed to verify email availability");
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setEmailError("");

    // Check email availability first
    const isAvailable = await checkEmailAvailability(email);
    if (!isAvailable) {
      return;
    }

    try {
      await sendInvitation({ email });
      setEmail("");
      setIsDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setEmailError(error.message);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-8 max-w-6xl mx-auto p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-primary/10">
            <HomeIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Household</h1>
            <p className="text-muted-foreground">Manage your household members and address</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-end">
          <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shadow-sm">
                <MapPin className="mr-2 h-4 w-4" />
                Update Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Household Address</DialogTitle>
                <DialogDescription>
                  Keep your household address information up to date.
                </DialogDescription>
              </DialogHeader>
              <Form {...addressForm}>
                <form 
                  id="address-form" 
                  onSubmit={addressForm.handleSubmit((data) => {
                    updateHouseholdAddress.mutate(data);
                    setIsAddressModalOpen(false);
                  })}
                  className="space-y-4 py-2"
                >
                  <FormField
                    control={addressForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Street Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="123 Main St" className="pl-10" {...field} />
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addressForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="px-6">
                      <Save className="mr-2 h-4 w-4" />
                      Save Address
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Users className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Household Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to add someone to your household.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="py-2">
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                        }}
                        placeholder="Enter their email address"
                        required
                        className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive font-medium">
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isChecking} className="px-6">
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-background rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Total Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">1</div>
            <p className="text-sm text-muted-foreground mt-1">
              Active household members
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-background rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Pending Invites</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {invitations?.filter((inv) => inv.invitation.status === "pending")
                .length || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Awaiting response from invitees
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-background rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Household Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm">
              {household?.address ? (
                <div className="space-y-1">
                  <p className="font-medium">{household.address}</p>
                  <p className="text-muted-foreground">{household.city}, {household.state} {household.zipCode}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2 text-center">
                  <p className="text-muted-foreground mb-2">No address on file</p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddressModalOpen(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-background rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Household Members</CardTitle>
                <CardDescription>People currently in your household</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead className="w-[40%]">Email</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </TableCell>
                  <TableCell>{user?.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {invitations && invitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-background rounded-full">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>Sent invitations waiting for response</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Email</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map(({ invitation, createdByUser }) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        {createdByUser.firstName} {createdByUser.lastName}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(invitation.createdAt),
                          "MMM d, yyyy"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            invitation.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : invitation.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invitation.status.charAt(0).toUpperCase() +
                            invitation.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}