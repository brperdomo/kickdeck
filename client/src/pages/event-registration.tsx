import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CheckCircle2, 
  CheckCircle, 
  X, 
  Plus, 
  PlusCircle, 
  UserRoundPlus,
  CreditCard 
} from "lucide-react";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { loadStripe } from "@stripe/stripe-js";
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";

interface AgeGroup {
  id: number;
  ageGroup: string;
  gender: string;
  divisionCode: string | null;
  birthYear: number | null;
  registrationFee?: number; // Optional fee until loaded
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  details: string;
  agreement?: string; // Terms and conditions text
  refundPolicy?: string; // Refund policy text
  ageGroups: AgeGroup[];
}

interface Fee {
  id: number;
  name: string;
  amount: number; // In cents
}

type RegistrationStep = 'auth' | 'personal' | 'team' | 'payment' | 'review' | 'complete';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Payment component for handling Stripe checkout
function PaymentForm({ amount, onSuccess, isProcessing, setIsProcessing }: { 
  amount: number; 
  onSuccess: () => void; 
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment using card element
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
        onSuccess();
      }
    } catch (e) {
      console.error("Payment error:", e);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-end mt-4">
        <Button 
          disabled={!stripe || isProcessing} 
          type="submit"
          className="bg-[#2C5282] hover:bg-[#1A365D] text-white mt-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
});

type PersonalDetailsForm = z.infer<typeof personalDetailsSchema>;

const playerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jerseyNumber: z.string().regex(/^\d{1,2}$/, "Jersey number must be 1-2 digits").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  position: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().email("Invalid email").optional(),
  parentGuardianPhone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
});

const teamRegistrationSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  ageGroupId: z.number({
    required_error: "Age group is required",
    invalid_type_error: "Age group must be selected"
  }),
  headCoachName: z.string().min(1, "Head coach name is required"),
  headCoachEmail: z.string().email("Invalid email address"),
  headCoachPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  assistantCoachName: z.string().optional(),
  managerName: z.string().min(1, "Manager name is required"),
  managerEmail: z.string().email("Invalid email address"),
  managerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  players: z.array(playerSchema).min(1, "At least one player is required"),
});

type TeamRegistrationForm = z.infer<typeof teamRegistrationSchema>;
type PlayerForm = z.infer<typeof playerSchema>;

export default function EventRegistration() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('auth');
  const [players, setPlayers] = useState<PlayerForm[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);

  // Helper function to parse user metadata
  const getUserAddressData = () => {
    if (!user?.metadata) return { address: '', city: '', state: '', zipCode: '' };
    
    try {
      const parsedMetadata = JSON.parse(user.metadata);
      return {
        address: parsedMetadata.address || '',
        city: parsedMetadata.city || '',
        state: parsedMetadata.state || '',
        zipCode: parsedMetadata.zipCode || '',
      };
    } catch (e) {
      console.error("Error parsing user metadata:", e);
      return { address: '', city: '', state: '', zipCode: '' };
    }
  };
  
  const addressData = getUserAddressData();
  
  const form = useForm<PersonalDetailsForm>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
    },
  });

  useEffect(() => {
    if (user) {
      // Parse address data from metadata if it exists
      let addressData = { address: '', city: '', state: '', zipCode: '' };
      
      if (user.metadata) {
        try {
          const parsedMetadata = JSON.parse(user.metadata);
          addressData = {
            address: parsedMetadata.address || '',
            city: parsedMetadata.city || '',
            state: parsedMetadata.state || '',
            zipCode: parsedMetadata.zipCode || '',
          };
        } catch (e) {
          console.error("Error parsing user metadata:", e);
        }
      }
      
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        ...addressData
      });
    }
  }, [user, form]);

  const updatePersonalDetailsMutation = useMutation({
    mutationFn: async (data: PersonalDetailsForm) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Personal details updated successfully",
      });
      setCurrentStep('team');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log('Fetching event details for ID:', eventId);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        console.log('Received event data:', data);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (!authLoading && user) {
      setCurrentStep('personal');
    }
  }, [authLoading, user]);

  const renderStepIndicator = () => {
    const steps: { key: RegistrationStep; label: string }[] = [
      { key: 'auth', label: 'Sign In' },
      { key: 'personal', label: 'Personal Details' },
      { key: 'team', label: 'Team Information' },
      { key: 'payment', label: 'Payment & Terms' },
      { key: 'review', label: 'Review & Confirm' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep === step.key ? 'text-[#2C5282]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                ${currentStep === step.key ? 'bg-[#2C5282] text-white' : 
                  index < steps.findIndex(s => s.key === currentStep) ? 'bg-[#48BB78] text-white' : 'bg-gray-200'}`}>
                {index < steps.findIndex(s => s.key === currentStep) ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-[2px] mx-2 
                ${index < steps.findIndex(s => s.key === currentStep) ? 'bg-[#48BB78]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAgeGroups = (ageGroups: AgeGroup[]) => {
    const groupedByGender = ageGroups.reduce((acc, group) => {
      if (!acc[group.gender]) {
        acc[group.gender] = [];
      }
      const displayText = group.divisionCode || `${group.gender} ${group.ageGroup}`;
      acc[group.gender].push({
        ...group,
        displayText
      });
      return acc;
    }, {} as Record<string, (AgeGroup & { displayText: string })[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedByGender).map(([gender, groups]) => (
          <div key={gender} className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">{gender}:</h4>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <span 
                  key={group.id} 
                  className="bg-white px-3 py-1 rounded-full text-sm text-blue-600 border border-blue-100"
                >
                  {group.displayText}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAuthRedirect = () => {
    // Store current location before redirecting
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    setLocation('/auth');
  };

  const onSubmitPersonalDetails = (data: PersonalDetailsForm) => {
    updatePersonalDetailsMutation.mutate(data);
  };

  const teamForm = useForm<TeamRegistrationForm>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      name: '',
      ageGroupId: 0,
      headCoachName: '',
      headCoachEmail: '',
      headCoachPhone: '',
      assistantCoachName: '',
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      players: [],
    }
  });

  const addPlayer = () => {
    const newPlayer: PlayerForm = {
      id: crypto.randomUUID(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    teamForm.setValue('players', updatedPlayers);
  };

  const removePlayer = (playerId: string) => {
    const updatedPlayers = players.filter(player => player.id !== playerId);
    setPlayers(updatedPlayers);
    teamForm.setValue('players', updatedPlayers);
  };

  // State to track terms agreement
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  
  // Fetch fee information when age group is selected
  useEffect(() => {
    if (selectedAgeGroup && selectedAgeGroup.id) {
      // Add a check to prevent repeated API calls for the same age group
      const ageGroupId = selectedAgeGroup.id;
      
      const fetchFees = async () => {
        try {
          const response = await fetch(`/api/events/${eventId}/fees?ageGroupId=${ageGroupId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.fee) {
              setRegistrationFee(data.fee.amount);
              // Only update if we don't already have the fee information to avoid infinite loop
              if (!selectedAgeGroup.registrationFee) {
                setSelectedAgeGroup(prev => prev ? { ...prev, registrationFee: data.fee.amount } : prev);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching fees:', error);
        }
      };
      
      fetchFees();
    }
  }, [selectedAgeGroup?.id, eventId]); // Only depend on the ID, not the whole object
  
  const registerTeamMutation = useMutation({
    mutationFn: async (data: TeamRegistrationForm) => {
      // Ensure player data is synchronized
      teamForm.setValue('players', players);
      
      // Safely process player dates to prevent conversion errors
      const processedPlayers = players.map(player => {
        let processedPlayer = { ...player };
        
        // Only convert valid date strings to ISO format
        if (player.dateOfBirth && typeof player.dateOfBirth === 'string') {
          try {
            // Try to create a valid date object first
            const dateObj = new Date(player.dateOfBirth);
            // Check if we got a valid date before using toISOString
            if (!isNaN(dateObj.getTime())) {
              processedPlayer.dateOfBirth = dateObj.toISOString();
            } else {
              // If date is invalid, send as is - backend should handle validation
              console.warn(`Invalid date for player: ${player.firstName} ${player.lastName}`);
            }
          } catch (error) {
            console.error('Error processing player date:', error);
            // Keep the original string if conversion fails
          }
        } else {
          // If dateOfBirth is not a string or is empty, set to null
          processedPlayer.dateOfBirth = null;
        }
        
        return processedPlayer;
      });
      
      // Transform dates and include terms agreement and fee in submission
      const response = await fetch(`/api/events/${eventId}/register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          players: processedPlayers,
          termsAcknowledged: termsAgreed,
          registrationFee: registrationFee,
          termsAcknowledgedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to register team');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team registered successfully",
      });
      setCurrentStep('review');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSelectAgeGroup = (ageGroup: AgeGroup) => {
    setSelectedAgeGroup(ageGroup);
    teamForm.setValue('ageGroupId', ageGroup.id);
  };
  
  const onSubmitTeamRegistration = (data: TeamRegistrationForm) => {
    console.log("Team form submission attempted with data:", data);
    console.log("Form errors:", teamForm.formState.errors);
    
    // Ensure player data is synced with form state
    teamForm.setValue('players', players);
    
    // Check required fields
    if (!data.name || !data.ageGroupId || !data.headCoachName || !data.headCoachEmail || !data.headCoachPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required team and coach information fields",
        variant: "destructive",
      });
      return;
    }
    
    if (players.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one player to the roster",
        variant: "destructive",
      });
      return;
    }
    
    // Validate each player has required fields
    const invalidPlayers = players.filter(player => 
      !player.firstName || !player.lastName || !player.dateOfBirth
    );
    
    if (invalidPlayers.length > 0) {
      toast({
        title: "Incomplete Player Information",
        description: "Please complete all required player fields (First Name, Last Name, Date of Birth)",
        variant: "destructive",
      });
      return;
    }
    
    // Check for missing emergency contact information
    const missingEmergency = players.filter(player => 
      !player.emergencyContactName || !player.emergencyContactPhone
    );
    
    if (missingEmergency.length > 0) {
      toast({
        title: "Missing Emergency Contact",
        description: "Please provide emergency contact information for all players",
        variant: "destructive",
      });
      return;
    }
    
    // Now proceed to the payment step instead of submitting right away
    console.log("Form validation passed, proceeding to payment step");
    setCurrentStep('payment');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600">Event Not Found</h2>
            <p className="mt-2 text-gray-600">This event may have been removed or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeadlinePassed = new Date(event.applicationDeadline) < new Date();
  if (isDeadlinePassed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-600">Registration Closed</h2>
            <p className="mt-2 text-gray-600">
              The registration deadline for this event ({new Date(event.applicationDeadline).toLocaleDateString()}) has passed. 
              Registration is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative register-event-page">
      <SoccerFieldBackground className="opacity-50" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {renderStepIndicator()}

        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-3xl font-bold text-[#2C5282]">{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {currentStep === 'auth' && !user && (
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Sign In Required</h3>
                <p className="text-gray-600 mb-6">
                  Please sign in or create an account to register for this event.
                </p>
                <Button 
                  size="lg"
                  className="bg-[#2C5282] hover:bg-[#1A365D] text-white font-semibold px-8"
                  onClick={handleAuthRedirect}
                >
                  Sign In / Register
                </Button>
              </div>
            )}

            {currentStep === 'personal' && user && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPersonalDetails)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
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
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={5} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('auth')}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-[#2C5282] hover:bg-[#1A365D] text-white"
                      disabled={updatePersonalDetailsMutation.isPending}
                    >
                      {updatePersonalDetailsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Next'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 'team' && user && (
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit(onSubmitTeamRegistration)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#2C5282]">Team Information</h3>
                    
                    <FormField
                      control={teamForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={teamForm.control}
                      name="ageGroupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age Group</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const selectedGroup = event.ageGroups?.find(
                                (group) => group.id === parseInt(value)
                              );
                              if (selectedGroup) {
                                onSelectAgeGroup(selectedGroup);
                              }
                            }}
                            value={selectedAgeGroup ? String(selectedAgeGroup.id) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an age group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {event.ageGroups?.map((ageGroup) => (
                                <SelectItem key={ageGroup.id} value={String(ageGroup.id)}>
                                  {ageGroup.divisionCode ? `${ageGroup.divisionCode} - ` : ''}{`${ageGroup.gender} ${ageGroup.ageGroup}`}
                                  {ageGroup.birthYear ? ` (Birth Year: ${ageGroup.birthYear})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Fee display when age group is selected */}
                    {selectedAgeGroup && registrationFee !== null && (
                      <div className="mt-2 bg-blue-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Registration Fee:</span>
                          <span className="text-base font-semibold text-blue-700">
                            ${(registrationFee / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-xl font-semibold text-[#2C5282]">Coach Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={teamForm.control}
                        name="headCoachName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Head Coach Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teamForm.control}
                        name="assistantCoachName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assistant Coach Name (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teamForm.control}
                        name="headCoachEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Head Coach Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teamForm.control}
                        name="headCoachPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Head Coach Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-xl font-semibold text-[#2C5282]">Team Manager Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={teamForm.control}
                        name="managerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manager Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div></div>

                      <FormField
                        control={teamForm.control}
                        name="managerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manager Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teamForm.control}
                        name="managerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manager Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-[#2C5282]">Player Roster</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPlayer}
                        className="flex items-center"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </div>
                    
                    {players.length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-md">
                        <UserRoundPlus className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No players added yet. Click "Add Player" to begin building your roster.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {players.map((player, index) => (
                          <div key={player.id} className="p-4 border rounded-md relative">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                              onClick={() => removePlayer(player.id as string)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            
                            <h4 className="font-medium mb-4">Player {index + 1}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`player-${index}-firstName`}>First Name *</Label>
                                <Input
                                  id={`player-${index}-firstName`}
                                  value={player.firstName}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].firstName = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`player-${index}-lastName`}>Last Name *</Label>
                                <Input
                                  id={`player-${index}-lastName`}
                                  value={player.lastName}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].lastName = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`player-${index}-dateOfBirth`}>Date of Birth *</Label>
                                <Input
                                  id={`player-${index}-dateOfBirth`}
                                  type="date"
                                  value={player.dateOfBirth}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].dateOfBirth = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`player-${index}-position`}>Position</Label>
                                <Input
                                  id={`player-${index}-position`}
                                  value={player.position || ''}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].position = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                  placeholder="Optional"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`player-${index}-jerseyNumber`}>Jersey #</Label>
                                <Input
                                  id={`player-${index}-jerseyNumber`}
                                  value={player.jerseyNumber || ''}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].jerseyNumber = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                  maxLength={2}
                                  placeholder="Optional"
                                />
                              </div>
                              
                              <div className="space-y-2 md:col-span-1">
                                <Label htmlFor={`player-${index}-medicalNotes`}>Medical Notes</Label>
                                <Input
                                  id={`player-${index}-medicalNotes`}
                                  value={player.medicalNotes || ''}
                                  onChange={(e) => {
                                    const newPlayers = [...players];
                                    newPlayers[index].medicalNotes = e.target.value;
                                    setPlayers(newPlayers);
                                    // Update form state with the modified players array
                                    teamForm.setValue('players', newPlayers);
                                  }}
                                  className="w-full"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium mb-2">Parent/Guardian Information (For minors)</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-parentName`}>Parent/Guardian Name</Label>
                                  <Input
                                    id={`player-${index}-parentName`}
                                    value={player.parentGuardianName || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].parentGuardianName = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                    placeholder="Optional"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-parentEmail`}>Parent/Guardian Email</Label>
                                  <Input
                                    id={`player-${index}-parentEmail`}
                                    type="email"
                                    value={player.parentGuardianEmail || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].parentGuardianEmail = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                    placeholder="Optional"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-parentPhone`}>Parent/Guardian Phone</Label>
                                  <Input
                                    id={`player-${index}-parentPhone`}
                                    type="tel"
                                    value={player.parentGuardianPhone || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].parentGuardianPhone = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                    placeholder="Optional"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium mb-2">Emergency Contact</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-emergencyName`}>Emergency Contact Name *</Label>
                                  <Input
                                    id={`player-${index}-emergencyName`}
                                    value={player.emergencyContactName || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].emergencyContactName = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-emergencyPhone`}>Emergency Contact Phone *</Label>
                                  <Input
                                    id={`player-${index}-emergencyPhone`}
                                    type="tel"
                                    value={player.emergencyContactPhone || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].emergencyContactPhone = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('personal')}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-[#2C5282] hover:bg-[#1A365D] text-white"
                      disabled={registerTeamMutation.isPending}
                    >
                      {registerTeamMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Continue to Next Step'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 'payment' && user && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#2C5282]">Payment and Terms</h3>
                
                {/* Fee Display */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Registration Fee</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700">
                        {selectedAgeGroup?.divisionCode || selectedAgeGroup?.ageGroup} Team Registration
                      </p>
                      {selectedAgeGroup?.registrationFee && (
                        <p className="text-sm text-gray-500 mt-1">
                          This fee includes entry for {event.name} tournament
                        </p>
                      )}
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                      {selectedAgeGroup?.registrationFee 
                        ? `$${(selectedAgeGroup.registrationFee / 100).toFixed(2)}` 
                        : "Fee not available"}
                    </div>
                  </div>
                </div>
                
                {/* Agreement Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-800">Tournament Agreement</h4>
                    <ScrollArea className="h-48 w-full rounded-md border p-4 bg-white">
                      <div className="text-sm text-gray-700 space-y-3">
                        {event.agreement ? (
                          <div dangerouslySetInnerHTML={{ __html: event.agreement }} />
                        ) : (
                          <p>
                            By registering for {event.name}, you agree to abide by all tournament rules and regulations.
                            The tournament director's decisions are final in all matters. All participants must follow
                            the governing body's code of conduct.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Refund Policy */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-800">Refund Policy</h4>
                    <ScrollArea className="h-32 w-full rounded-md border p-4 bg-white">
                      <div className="text-sm text-gray-700 space-y-3">
                        {event.refundPolicy ? (
                          <div dangerouslySetInnerHTML={{ __html: event.refundPolicy }} />
                        ) : (
                          <p>
                            Registration fees are non-refundable after the application deadline. 
                            A 50% refund may be issued for cancellations made at least 14 days before the event.
                            No refunds will be provided for teams that withdraw within 14 days of the event.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Agreement Checkbox */}
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms-agreement"
                        checked={termsAgreed}
                        onCheckedChange={(checked) => {
                          setTermsAgreed(checked === true);
                        }}
                      />
                      <label
                        htmlFor="terms-agreement"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
                      >
                        I have read and agree to the tournament terms, conditions, and refund policy
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Payment Form */}
                {termsAgreed && selectedAgeGroup?.registrationFee && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-blue-800">Payment Information</h4>
                    <p className="text-sm text-gray-600 mb-4">Please provide your payment details to complete registration</p>
                    
                    <Elements stripe={stripePromise}>
                      <PaymentForm 
                        amount={selectedAgeGroup.registrationFee} 
                        onSuccess={() => {
                          // Make sure to sync the latest players array with form data
                          teamForm.setValue('players', players);
                          // Then submit the form values along with player data
                          registerTeamMutation.mutate(teamForm.getValues());
                        }}
                        isProcessing={registerTeamMutation.isPending}
                        setIsProcessing={() => {}} // This is a mock function since we can't directly control mutation state
                      />
                    </Elements>
                  </div>
                )}
                
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('team')}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
            
            {currentStep === 'review' && user && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#2C5282]">Registration Complete</h3>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <p className="text-green-700 font-medium">Your team has been successfully registered for this event.</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setLocation('/user-dashboard')}
                  className="bg-[#2C5282] hover:bg-[#1A365D] text-white"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {(currentStep === 'auth' || currentStep === 'personal') && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Event Dates</h3>
                    <p>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Registration Deadline</h3>
                    <p>{new Date(event.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                </div>

                {event.ageGroups && event.ageGroups.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Eligible Age Groups</h3>
                    {renderAgeGroups(event.ageGroups)}
                  </div>
                )}

                {event.details && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Event Details</h3>
                    <div 
                      className="prose max-w-none prose-blue prose-headings:text-[#2C5282] prose-p:text-gray-700" 
                      dangerouslySetInnerHTML={{ __html: event.details }} 
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}