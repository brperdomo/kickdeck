import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BracketSelector } from "@/components/registration/BracketSelector";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phone-formatter";


import { 
  Loader2, 
  CheckCircle2, 
  CheckCircle, 
  X, 
  Plus, 
  PlusCircle, 
  UserRoundPlus,
  CreditCard,
  Upload,
  FileUp,
  Download,
  AlertCircle,
  FileText,
  Save,
  Clock,
  ArrowRight,
  Info,
  UserCircle,
  UserSquare,
  Users,
  LogOut
} from "lucide-react";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
import { AnimatedEventBackground } from "@/components/ui/AnimatedEventBackground";
import { useAuth } from "@/hooks/use-auth";
import { useHouseholdDetails } from "@/hooks/use-household-details";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentElement, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import StripeProvider from "@/components/StripeProvider";
import { SetupPaymentForm } from "@/components/payment/SetupPaymentForm";
import { SetupPaymentProvider } from "@/components/payment/SetupPaymentProvider";
import { Footer } from "@/components/ui/Footer";
import { motion, AnimatePresence } from "framer-motion";
import RegistrationAuthChecker from "./registration-auth-checker";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Payment Setup Wrapper Component
function PaymentSetupWrapper({ 
  teamId, 
  expectedAmount, 
  teamName, 
  eventName, 
  onSuccess, 
  onError 
}: {
  teamId: string | number;
  expectedAmount: number;
  teamName: string;
  eventName: string;
  onSuccess: (setupIntentId: string, paymentMethodId: string) => void;
  onError: (error: Error) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSetupIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            metadata: {
              teamName,
              eventName,
              expectedAmount: expectedAmount.toString()
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating setup intent:', error);
        onError(error instanceof Error ? error : new Error('Failed to initialize payment setup'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSetupIntent();
  }, [teamId, expectedAmount, teamName, eventName, onError]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Initializing payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Payment setup not initialized. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SetupPaymentProvider clientSecret={clientSecret}>
      <SetupPaymentForm 
        teamId={teamId}
        expectedAmount={expectedAmount}
        teamName={teamName}
        eventName={eventName}
        returnUrl={window.location.origin + '/payment-setup-confirmation'}
        onSuccess={onSuccess}
        onError={onError}
      />
    </SetupPaymentProvider>
  );
}

// CSV Uploader Component
function CsvUploader({ onUploadSuccess }: { onUploadSuccess: (players: PlayerForm[]) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        setError("Please upload a CSV file.");
        return;
      }
      setFile(file);
      setError(null);
    }
  }, []);

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/players', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload file');
      }

      const data = await response.json();
      onUploadSuccess(data.players);
      
      // Reset form after successful upload
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during file upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onDrop(droppedFiles);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleBrowseClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop your CSV file here, or <span className="text-[#2C5282] font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-500">
          CSV files only (.csv)
        </p>
      </div>
      
      {file && (
        <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          onClick={uploadFile}
          disabled={!file || isUploading}
          className="bg-[#2C5282] hover:bg-[#1A365D] text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

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
  timezone: string;
  details: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  agreement?: string; // Terms and conditions text
  refundPolicy?: string; // Refund policy text
  ageGroups: AgeGroup[];
  settings?: EventSetting[]; // Event settings including allowPayLater
}

interface EventSetting {
  key: string;
  value: string;
}

interface Fee {
  id: number;
  name: string;
  amount: number; // In cents
  beginDate?: string; // When fee starts being valid
  endDate?: string; // When fee stops being valid
  feeType?: string; // 'registration', 'uniform', 'equipment', etc.
  isRequired?: boolean; // Whether the fee is mandatory
}

type RegistrationStep = 'auth' | 'personal' | 'team' | 'payment' | 'review' | 'success' | 'complete';

// Animation variants for step transitions
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

// Timezone-aware date formatting function
const formatDateInEventTimezone = (dateString: string, timezone: string): string => {
  try {
    // For date-only strings (YYYY-MM-DD), we need to avoid timezone conversion altogether
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date-only string: format directly without any timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      return `${month}/${day}/${year}`;
    } else {
      // Date with time: parse and format in the event's timezone
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).format(date);
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to basic formatting without timezone conversion
    return new Date(dateString).toLocaleDateString();
  }
};

// Payment component for handling Stripe checkout with Setup Intent
function PaymentForm({ amount, onSuccess, isProcessing, setIsProcessing, isPreview = false, teamId = null }: { 
  amount: number; 
  onSuccess: () => void; 
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  isPreview?: boolean;
  teamId?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // In preview mode, simulate a successful payment without calling Stripe
    if (isPreview) {
      console.log('Preview mode: Simulating payment info collection for amount:', amount);
      setIsProcessing(true);
      
      // Simulate a brief delay for the "processing" state
      setTimeout(() => {
        toast({
          title: "Preview: Payment Information Saved",
          description: "This is a simulated payment setup in preview mode",
        });
        setIsProcessing(false);
        onSuccess();
      }, 1500);
      
      return;
    }

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      toast({
        title: "Stripe Not Ready",
        description: "The payment system is still initializing. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // For initial registration, we don't have a teamId yet
      // We'll use a temporary ID that will be replaced once registration is complete
      const tempTeamId = teamId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a setup intent instead of a payment intent
      const response = await fetch('/api/payments/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: tempTeamId, // Include teamId to satisfy the server requirement
          expectedAmount: amount, // amount is in cents - but we're not charging yet
          metadata: {
            isNewRegistration: teamId ? 'false' : 'true', // Flag if this is a new registration
            expectedAmount: amount.toString()
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to create setup intent');
        } catch (jsonError) {
          throw new Error(errorText || 'Failed to create setup intent');
        }
      }
      
      const { clientSecret, setupIntentId } = await response.json();
      
      // Use the client secret to confirm the setup
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement('card')!,
        }
      });

      if (error) {
        toast({
          title: "Payment Setup Failed",
          description: error.message || "An error occurred saving your payment information",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        toast({
          title: "Payment Information Saved",
          description: "Your payment information has been securely stored for future processing",
        });
        onSuccess();
      }
    } catch (e) {
      console.error("Payment setup error:", e);
      toast({
        title: "Payment Setup Error",
        description: e instanceof Error ? e.message : "An unexpected error occurred saving payment information",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md">
        {/* Replace PaymentElement with CardElement which is more reliable */}
        <CardElement className="p-3 border rounded" options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
      </div>
      <div className="flex justify-end mt-4">
        <Button 
          disabled={!stripe || isProcessing} 
          type="submit"
          className="text-white mt-4"
          style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Payment Information...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Save Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Enhanced schema with conditional fields for authentication
const personalDetailsSchema = z.object({
  // Basic personal details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
  
  // Authentication fields - these are only required if email doesn't belong to existing account
  password: z.string().optional(), // For both login and new account
  confirmPassword: z.string().optional(), // Only for new account
  
  // Flags for authentication state
  emailChecked: z.boolean().optional(),
  emailExists: z.boolean().optional(),
  authenticated: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // If email exists and we need to authenticate
  if (data.emailExists && !data.authenticated) {
    // Validate password for login
    if (!data.password || data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required to log in",
        path: ["password"]
      });
    }
  }
  
  // If creating a new account
  if (data.emailChecked && !data.emailExists && !data.authenticated) {
    // Validate password creation with backend requirements
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required",
        path: ["password"]
      });
    } else {
      // Check minimum length
      if (data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 8 characters",
          path: ["password"]
        });
      }
      
      // Check for at least one number
      if (!/[0-9]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one number",
          path: ["password"]
        });
      }
      
      // Check for at least one special character
      if (!/[^a-zA-Z0-9]/.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one special character",
          path: ["password"]
        });
      }
    }
    
    // Validate password confirmation
    if (!data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please confirm your password",
        path: ["confirmPassword"]
      });
    }
    
    // Validate password match
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
    }
  }
});

type PersonalDetailsForm = z.infer<typeof personalDetailsSchema>;

const playerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jerseyNumber: z.string().regex(/^\d{1,2}$/, "Jersey number must be 1-2 digits").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicalNotes: z.string().optional(),
  emergencyContactFirstName: z.string().min(1, "Emergency contact first name is required"),
  emergencyContactLastName: z.string().min(1, "Emergency contact last name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
});

const teamRegistrationSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  ageGroupId: z.number({
    required_error: "Age group is required",
    invalid_type_error: "Age group must be selected"
  }),
  bracketId: z.number().nullable().optional(),
  headCoachName: z.string().min(1, "Head coach name is required"),
  headCoachEmail: z.string().email("Invalid email address"),
  headCoachPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  assistantCoachName: z.string().optional(),
  managerName: z.string().min(1, "Manager name is required"),
  managerEmail: z.string().email("Invalid email address"),
  managerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  // Add Roster Later flag allows submitting without players
  addRosterLater: z.boolean().optional().default(false),
  // Only validate players if addRosterLater is false
  players: z.array(playerSchema).refine(
    (data) => {
      // This is a custom refine function that will be checked later in the form logic
      return true;
    },
    { message: "At least one player is required unless 'Add Roster Later' is selected" }
  ),
  // Add fields for fee processing
  selectedFeeIds: z.array(z.number()).optional(),
  totalAmount: z.number().optional(),
  // Club information
  clubId: z.number().nullable().optional(),
  clubName: z.string().optional(),
  newClub: z.boolean().optional(),
});

type TeamRegistrationForm = z.infer<typeof teamRegistrationSchema>;
type PlayerForm = z.infer<typeof playerSchema>;

interface EventRegistrationProps {
  isPreview?: boolean;
  eventIdOverride?: string;
}

// We'll use the types defined below

export default function EventRegistration({ isPreview = false, eventIdOverride }: EventRegistrationProps) {
  // AUTH FIX: Add detailed logging to verify our authentication fix is working
  console.log("AUTH FIX: EventRegistration component starting - user should now see event details without immediate redirect");
  console.log("AUTH FIX: RegistrationAuthChecker allowUnauthenticated is now set to TRUE by default");
  const params = useParams();
  const { toast } = useToast();
  
  // Use the eventIdOverride prop if provided (for preview mode), otherwise use the URL parameter
  const eventId = eventIdOverride || params.eventId;
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Coach validation states
  const [isCheckingCoach, setIsCheckingCoach] = useState(false);
  const [coachFound, setCoachFound] = useState(false);
  const [coachData, setCoachData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [coachDebounceTimeout, setCoachDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Team manager validation states
  const [isCheckingManager, setIsCheckingManager] = useState(false);
  const [managerFound, setManagerFound] = useState(false);
  const [managerData, setManagerData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [managerDebounceTimeout, setManagerDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Track when we're loading saved data to prevent validation loops
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(false);

  // Function to handle coach email change with debounce
  const handleCoachEmailChange = (value: string) => {
    // Skip validation if we're in the process of loading saved data
    if (isLoadingSavedData) {
      return;
    }
    
    // Clear previous timeout if it exists
    if (coachDebounceTimeout) {
      clearTimeout(coachDebounceTimeout);
    }
    
    // Don't validate empty emails
    if (!value || value.trim() === '') {
      setIsCheckingCoach(false);
      setCoachFound(false);
      setCoachData(null);
      return;
    }
    
    // Set a new timeout for debounce
    const timeout = setTimeout(() => {
      validateCoachMutation.mutate(value);
    }, 500); // 500ms debounce
    
    setCoachDebounceTimeout(timeout);
  };
  
  // Function to handle manager email change with debounce
  const handleManagerEmailChange = (value: string) => {
    // Skip validation if we're in the process of loading saved data
    if (isLoadingSavedData) {
      return;
    }
    
    // Clear previous timeout if it exists
    if (managerDebounceTimeout) {
      clearTimeout(managerDebounceTimeout);
    }
    
    // Don't validate empty emails
    if (!value || value.trim() === '') {
      setIsCheckingManager(false);
      setManagerFound(false);
      setManagerData(null);
      return;
    }
    
    // Set a new timeout for debounce
    const timeout = setTimeout(() => {
      validateManagerMutation.mutate(value);
    }, 500); // 500ms debounce
    
    setManagerDebounceTimeout(timeout);
  };

  // Coach validation mutation
  const validateCoachMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/coaches/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate coach email');
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsCheckingCoach(true);
    },
    onSuccess: (data) => {
      setIsCheckingCoach(false);
      setCoachFound(data.exists);
      
      if (data.exists && data.coach) {
        setCoachData(data.coach);
        
        // Auto-fill the coach name and phone if found
        if (teamForm && data.coach.firstName && data.coach.lastName) {
          const fullName = `${data.coach.firstName} ${data.coach.lastName}`;
          teamForm.setValue('headCoachName', fullName);
        }
        
        if (teamForm && data.coach.phone) {
          teamForm.setValue('headCoachPhone', data.coach.phone);
        }
      } else {
        setCoachData(null);
      }
    },
    onError: () => {
      setIsCheckingCoach(false);
      setCoachFound(false);
      setCoachData(null);
    }
  });
  
  // Manager validation mutation
  const validateManagerMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/coaches/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate manager email');
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsCheckingManager(true);
    },
    onSuccess: (data) => {
      setIsCheckingManager(false);
      setManagerFound(data.exists);
      
      if (data.exists && data.coach) {
        setManagerData(data.coach);
        
        // Auto-fill the manager name and phone if found
        if (teamForm && data.coach.firstName && data.coach.lastName) {
          const fullName = `${data.coach.firstName} ${data.coach.lastName}`;
          teamForm.setValue('managerName', fullName);
        }
        
        if (teamForm && data.coach.phone) {
          teamForm.setValue('managerPhone', data.coach.phone);
        }
      } else {
        setManagerData(null);
      }
    },
    onError: () => {
      setIsCheckingManager(false);
      setManagerFound(false);
      setManagerData(null);
    }
  });
  
  // Setup registration save state hook
  // Removed saved registration functionality for cleaner flow
  
  // NEW Authentication States
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [emailToCheck, setEmailToCheck] = useState<string>('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [redactedUserData, setRedactedUserData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    userId: number;
  } | null>(null);
  
  // Skip auth step completely - if user is not logged in, we'll handle auth within personal step
  // This ensures we start at the personal step every time - simpler and more reliable flow
  const initialStep = 'personal';
  console.log('Enhanced registration flow: Always starting at personal step with integrated auth');
  
  console.log('🔍 AUTH DEBUG 🔍', {
    user: user ? { id: user.id, email: user.email } : null,
    isLoggedIn: !!user,
    urlParams: window.location.search,
    currentStep: initialStep,
    isPreview
  });
  
  // Query client for auth state updates
  const queryClient = useQueryClient();
  
  // Logout handler for registration form
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear user data from query cache
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Reset ALL authentication state completely for clarity
      setCurrentStep('personal');
      setEmailExists(false);
      setRedactedUserData(null);
      setAuthError(null);
      setIsVerifyingPassword(false);
      setIsCheckingEmail(false);
      setIsAuthenticating(false);
      setIsCreatingAccount(false);
      
      // Reset all form fields to ensure completely clean state
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        password: '',
        confirmPassword: '',
        emailChecked: false,
        emailExists: false,
        authenticated: false,
      });
      
      // Force clear any remaining form values that might persist
      setTimeout(() => {
        form.setValue('firstName', '');
        form.setValue('lastName', '');
        form.setValue('email', '');
        form.setValue('phone', '');
        form.setValue('address', '');
        form.setValue('city', '');
        form.setValue('state', '');
        form.setValue('zipCode', '');
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
      }, 100);
      
      console.log('Complete logout and form reset performed');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out. You can continue with a new account or log in again.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to check if an email exists in the system and update form with redacted data
  const checkEmailExists = async (email: string) => {
    setIsCheckingEmail(true);
    setAuthError(null);
    setEmailToCheck(email);
    
    try {
      console.log("Checking if email exists:", email);
      
      // Make the actual API call to the backend using GET request with query parameters
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check email existence');
      }
      
      const data = await response.json();
      console.log('Email check response:', data);
      
      // Set the state based on the response
      setEmailExists(data.exists);
      form.setValue('emailChecked', true);
      form.setValue('emailExists', data.exists);
      
      // If user exists, set the redacted data
      if (data.exists && data.redactedUserData) {
        // If household data is available, use that for address data
        // Otherwise use the redacted data from the API
        const addressData = household ? {
          address: household.address || '',
          city: household.city || '',
          state: household.state || '',
          zipCode: household.zipCode || ''
        } : {
          address: data.redactedUserData.address || '',
          city: data.redactedUserData.city || '',
          state: data.redactedUserData.state || '',
          zipCode: data.redactedUserData.zipCode || ''
        };
        
        setRedactedUserData({
          firstName: data.redactedUserData.firstName,
          lastName: data.redactedUserData.lastName,
          phone: data.redactedUserData.phone || '',
          ...addressData,
          userId: data.redactedUserData.userId
        });
      } else {
        setRedactedUserData(null);
      }
      
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      toast({
        title: 'Error',
        description: 'Failed to check if email exists. Please try again.',
        variant: 'destructive',
      });
      setEmailExists(null);
      form.setValue('emailChecked', true);
      form.setValue('emailExists', false);
      setRedactedUserData(null);
      return null;
    } finally {
      setIsCheckingEmail(false);
    }
  };
  
  // Function to login with email and password
  const loginWithCredentials = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Log the payload for debugging
      console.log('Sending login credentials:', { email, password: '********' });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Changed username to email to match server expectations
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Invalid email or password');
      }
      
      const userData = await response.json();
      
      // Update the user data in the React Query cache
      queryClient.setQueryData(['/api/user'], userData);
      
      // Force a refetch of household details to get the address information
      console.log('Login successful - fetching household details...');
      try {
        // Make direct API call to household details
        const householdResponse = await fetch('/api/household/details', {
          credentials: 'include'
        });
        
        if (householdResponse.ok) {
          const householdData = await householdResponse.json();
          console.log('Household details fetched after login:', householdData);
          
          // Update the address fields with the household data
          if (householdData) {
            form.setValue('address', householdData.address || '');
            form.setValue('city', householdData.city || '');
            form.setValue('state', householdData.state || '');
            form.setValue('zipCode', householdData.zipCode || '');
          }
        } else {
          console.error('Failed to fetch household details after login');
        }
      } catch (householdError) {
        console.error('Error fetching household details:', householdError);
      }
      
      toast({
        title: 'Success',
        description: 'You have been logged in successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Invalid email or password');
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Function to register with email and password
  const registerWithCredentials = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsCreatingAccount(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: email, 
          password,
          email,
          firstName,
          lastName,
          phone: form.getValues('phone') || null,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create account');
      }
      
      const userData = await response.json();
      
      // Update the user data in the React Query cache
      queryClient.setQueryData(['/api/user'], userData);
      
      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to create account');
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreatingAccount(false);
    }
  };
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(initialStep);
  
  // Simplified registration flow without save functionality
  
  // We'll move this effect after the form is initialized
  
  // Create ref outside the effect for auth check tracking
  const authCheckRef = useRef(false);
  
  // Handle any URL parameters like auth_complete just to clean up the URL
  // Our simplified approach doesn't need these anymore, but clean up for completeness
  useEffect(() => {
    // Only run once per component mount
    if (authCheckRef.current) return;
    authCheckRef.current = true;
    
    // Clean up any auth-related URL parameters to keep URLs clean
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('auth_complete')) {
        console.log('Cleaning up auth_complete parameter from URL');
        url.searchParams.delete('auth_complete');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to clean URL:', e);
    }
  }, []);
  
  // We'll move this effect after the form is initialized
  
  // Auto-save functionality removed for cleaner flow
  
  // Removed saved state functionality for cleaner registration flow
  const [players, setPlayers] = useState<PlayerForm[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);
  const [selectedBracket, setSelectedBracket] = useState<number | null>(null);
  const [availableBrackets, setAvailableBrackets] = useState<any[]>([]);
  const [clubs, setClubs] = useState<{id: number, name: string, logoUrl: string | null}[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [isNewClub, setIsNewClub] = useState(false);
  const [clubLogo, setClubLogo] = useState<File | null>(null);
  const [selectedFees, setSelectedFees] = useState<Fee[]>([]);
  const [addRosterLater, setAddRosterLater] = useState<boolean>(false);
  
  // We don't need the handleAuthRedirect function anymore since we're handling auth state
  // directly in the useEffect hooks. This was causing the redirect to /auth when unnecessary.
  // Removing this function and direct redirections prevents circular redirects.

  // Get household details for address information
  const { household, isLoading: householdLoading } = useHouseholdDetails();
  
  // Track whether household data has been applied to the form
  const [householdDataApplied, setHouseholdDataApplied] = useState(false);
  
  // Helper function to apply household data consistently
  const applyHouseholdData = useCallback((formRef: any) => {
    if (household && !householdLoading) {
      console.log('🏠 Applying household data helper called:', household);
      
      // Force immediate update of address fields with household data
      window.requestAnimationFrame(() => {
        formRef.setValue('address', household.address || '');
        formRef.setValue('city', household.city || '');
        formRef.setValue('state', household.state || '');
        formRef.setValue('zipCode', household.zipCode || '');
        
        // Force form validation to update
        formRef.trigger(['address', 'city', 'state', 'zipCode']);
        
        console.log('✅ Household data applied successfully');
        setHouseholdDataApplied(true);
      });
      return true;
    }
    return false;
  }, [household, householdLoading]);
  
  // Get address data from household information
  const addressData = {
    address: household?.address || '',
    city: household?.city || '',
    state: household?.state || '',
    zipCode: household?.zipCode || ''
  };
  
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
      // Authentication related fields with sensible defaults
      password: '',
      confirmPassword: '',
      emailChecked: false,
      emailExists: false,
      authenticated: !!user, // If user is logged in, we're already authenticated
    },
    mode: 'onChange', // Enable validation as the user types for better feedback
  });
  
  // Watch the email field to handle checking for existing accounts
  const watchedEmail = form.watch('email');
  
  // Update emailToCheck whenever the email field changes
  useEffect(() => {
    setEmailToCheck(watchedEmail);
  }, [watchedEmail]);
  
  // Update form with household details when they load
  useEffect(() => {
    // Only try to apply data if we haven't already and if the household data is now available
    if (!householdDataApplied && household && !householdLoading && form) {
      console.log('Household data available but not yet applied, using helper function');
      
      // Use our helper to apply the household data consistently
      const addressApplied = applyHouseholdData(form);
      
      if (addressApplied) {
        // Only show a notification if it wasn't shown from the user authentication effect
        if (!user) {
          toast({
            title: "Address Loaded",
            description: "Your saved address information has been applied.",
            duration: 3000
          });
        }
      }
    }
  }, [household, householdLoading, form, householdDataApplied, applyHouseholdData, toast, user]);
  
  // Critical effect to update steps when user auth state changes
  // We've simplified the flow - just ensure we're at personal step if we have a user
  // The RegistrationAuthChecker will handle redirecting to login if no user is present
  useEffect(() => {
    // If not authenticated and not in loading state, the RegistrationAuthChecker 
    // component will handle redirecting to login
    if (user && form) {
      console.log('🔑 User authenticated, confirming personal step', { userId: user.id, email: user.email });
      
      // Always update the form with user details when logged in
      form.setValue('firstName', user.firstName || '');
      form.setValue('lastName', user.lastName || '');
      form.setValue('email', user.email || '');
      form.setValue('phone', user.phone || '');
      form.setValue('authenticated', true);
      
      // Use our helper function to apply household data consistently
      if (household && !householdLoading) {
        const addressApplied = applyHouseholdData(form);
        
        if (addressApplied) {
          // Show a concise toast notification
          toast({
            title: "Account Data Loaded",
            description: "Your profile information has been applied.",
            duration: 3000, // Short duration so it doesn't block UI
          });
        }
      }
    }
  }, [user, form, household, householdLoading, applyHouseholdData, toast]);
  

  

  
  // Verify existing account with password
  const verifyExistingAccount = async () => {
    const email = form.getValues('email');
    const password = form.getValues('password');
    
    if (!email || !password || !redactedUserData) {
      return;
    }
    
    setIsVerifyingPassword(true);
    
    try {
      console.log('Verifying existing account for:', email);
      const success = await loginWithCredentials(email, password);
      
      if (success) {
        console.log('Login successful, populating form and advancing to next step');
        // Set authenticated flag in form data
        form.setValue('authenticated', true);
        
        // Always try to fetch household details directly after login
        try {
          console.log('STEP 2: Directly fetching household details after login verification');
          const householdResponse = await fetch('/api/household/details', {
            credentials: 'include'
          });
          
          if (householdResponse.ok) {
            const householdData = await householdResponse.json();
            console.log('STEP 2: Successfully fetched household details:', householdData);
            
            // Populate name and contact from redacted data
            form.setValue('firstName', redactedUserData.firstName);
            form.setValue('lastName', redactedUserData.lastName);
            form.setValue('phone', redactedUserData.phone);
            
            // Always use the freshly fetched household data for address
            if (householdData) {
              console.log('STEP 2: Using fresh household data for address fields');
              form.setValue('address', householdData.address || '');
              form.setValue('city', householdData.city || '');
              form.setValue('state', householdData.state || '');
              form.setValue('zipCode', householdData.zipCode || '');
            } else {
              // Fallback to redacted data if household fetch succeeded but returned no data
              console.log('STEP 2: No household data found, using redacted data');
              form.setValue('address', redactedUserData.address);
              form.setValue('city', redactedUserData.city);
              form.setValue('state', redactedUserData.state);
              form.setValue('zipCode', redactedUserData.zipCode);
            }
          } else {
            console.error('STEP 2: Failed to fetch household details, using redacted data');
            // Fallback to all redacted data
            form.setValue('firstName', redactedUserData.firstName);
            form.setValue('lastName', redactedUserData.lastName);
            form.setValue('phone', redactedUserData.phone);
            form.setValue('address', redactedUserData.address);
            form.setValue('city', redactedUserData.city);
            form.setValue('state', redactedUserData.state);
            form.setValue('zipCode', redactedUserData.zipCode);
          }
        } catch (householdError) {
          console.error('STEP 2: Error fetching household details:', householdError);
          // Fallback to all redacted data on error
          form.setValue('firstName', redactedUserData.firstName);
          form.setValue('lastName', redactedUserData.lastName);
          form.setValue('phone', redactedUserData.phone);
          form.setValue('address', redactedUserData.address);
          form.setValue('city', redactedUserData.city);
          form.setValue('state', redactedUserData.state);
          form.setValue('zipCode', redactedUserData.zipCode);
        }
        
        toast({
          title: "Account Verified",
          description: "You're now using your saved information.",
        });
        
        // Important: Proceed to the team step after successful verification
        setCurrentStep('team');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify your account. Please check your password.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingPassword(false);
    }
  };
  
  // Continue registration without using saved account data
  const useNewAccountInstead = () => {
    // Just clear the redacted data and continue with current form values
    setRedactedUserData(null);
    form.setValue('authenticated', false);
    form.setValue('emailExists', false);
    
    toast({
      title: "Using New Information",
      description: "You're continuing without using your saved account information.",
    });
  };
  
  // Debounced email check effect
  useEffect(() => {
    // Only run the check when email has at least 5 characters, contains @ and .
    // Also requires a pause in typing (debounce)
    if (emailToCheck && emailToCheck.length > 5 && emailToCheck.includes('@') && emailToCheck.includes('.')) {
      // Only set checking state when we're actually going to check
      // This prevents UI flickering during normal typing
      
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Set a new timeout to check if email exists after typing stops
      const timeout = setTimeout(() => {
        setIsCheckingEmail(true);
        checkEmailExists(emailToCheck);
      }, 1000); // Increased to 1000ms (1 second) debounce
      
      setDebounceTimeout(timeout);
    } else {
      // Reset when email is too short or invalid
      setEmailExists(null);
      setRedactedUserData(null);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [emailToCheck]);

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
        ...addressData,
        // Authentication related fields
        authenticated: true, // User is authenticated
        emailChecked: true,  // Email has been checked
        emailExists: true,   // Email exists (since we have a user)
      });
    }
  }, [user, form]);

  // Direct step navigation function with registration state preservation
  const handleDirectStepNavigation = (step: RegistrationStep) => {
    console.log(`Direct navigation requested to step: ${step}`);
    
    // Check if moving from profile step to team step while an account exists but isn't verified
    if (currentStep === 'profile' && step === 'team' && emailExists && !form.getValues('authenticated')) {
      console.log('Attempting to continue without authenticating an existing account - blocking progress');
      toast({
        title: "Account Verification Required",
        description: "You must verify your existing account with your password before continuing.",
        variant: "destructive"
      });
      return; // Block navigation
    }
    
    // Set a flag indicating we're in the registration flow to prevent unwanted redirects
    sessionStorage.setItem('inRegistrationFlow', 'true');
    console.log('Setting inRegistrationFlow flag to prevent dashboard redirects');
    
    // Also set a timestamp to help with debugging
    sessionStorage.setItem('registrationFlowTimestamp', Date.now().toString());
    
    // Update the current step
    setCurrentStep(step);
    
    // Store the step in session storage
    try {
      const savedData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
      savedData.currentStep = step;
      savedData.preventRedirect = true; // Extra flag to be super explicit
      sessionStorage.setItem('registrationData', JSON.stringify(savedData));
      console.log(`Updated session storage with step: ${step} and preventRedirect flag`);
    } catch (e) {
      console.error('Failed to update session storage:', e);
    }
  };

  const updatePersonalDetailsMutation = useMutation({
    mutationFn: async (data: PersonalDetailsForm) => {
      console.log('Starting personal details update with data:', data);
      
      // In preview mode, don't actually call the API
      if (isPreview) {
        console.log('Preview mode: Simulating profile update with data:', data);
        // Simulate a successful response
        return { success: true, data };
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Profile update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating profile:', errorText);
        throw new Error(errorText || 'Failed to update profile');
      }
      
      const responseData = await response.json();
      console.log('Profile update successful, response:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Personal details update onSuccess triggered with data:', data);
      
      toast({
        title: "Success",
        description: "Personal details updated successfully - click Continue to proceed",
      });
      
      console.log('Will NOT automatically advance to team step due to state issue');
      
      // Do NOT automatically change the step as it seems to be causing issues
      // Instead, we've added a manual Continue button as a workaround
    },
    onError: (error: Error) => {
      console.error('Personal details update failed:', error);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to check if "Pay Later" option is enabled for this event
  const isPayLaterEnabled = () => {
    if (!event?.settings) return false;
    const payLaterSetting = event.settings.find(s => s.key === 'allowPayLater');
    return payLaterSetting ? payLaterSetting.value === 'true' : false;
  };
  
  const [payLaterOption, setPayLaterOption] = useState<boolean>(false);
  const [isPayLaterShown, setIsPayLaterShown] = useState<boolean>(false);
  
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
        
        // Make sure we have a settings array, even if empty
        if (!data.settings) {
          data.settings = [];
        }
        
        // Inspect branding data more carefully - this is critical for theme animation
        console.log('Inspecting branding data for event:', {
          eventId,
          hasBranding: !!data.branding,
          primaryColor: data.branding?.primaryColor,
          secondaryColor: data.branding?.secondaryColor,
          primaryColorType: typeof data.branding?.primaryColor,
          secondaryColorType: typeof data.branding?.secondaryColor,
          primaryColorLength: data.branding?.primaryColor?.length,
          secondaryColorLength: data.branding?.secondaryColor?.length,
          validPrimaryColor: typeof data.branding?.primaryColor === 'string' && data.branding?.primaryColor?.startsWith('#'),
          validSecondaryColor: typeof data.branding?.secondaryColor === 'string' && data.branding?.secondaryColor?.startsWith('#')
        });
        
        // Ensure branding object is properly structured before setting state
        if (data.branding) {
          // Normalize branding colors to ensure they have # prefix
          if (data.branding.primaryColor && !data.branding.primaryColor.startsWith('#')) {
            data.branding.primaryColor = '#' + data.branding.primaryColor;
            console.log('Fixed primary color format:', data.branding.primaryColor);
          }
          
          if (data.branding.secondaryColor && !data.branding.secondaryColor.startsWith('#')) {
            data.branding.secondaryColor = '#' + data.branding.secondaryColor;
            console.log('Fixed secondary color format:', data.branding.secondaryColor);
          }
        }

        // Set the event data including branding information
        setEvent(data);
        
        // Check if pay later is enabled and update UI state
        const payLaterEnabled = data.settings.some(s => s.key === 'allowPayLater' && s.value === 'true');
        console.log('Pay Later Feature enabled:', payLaterEnabled);
        
        // We need to ensure the isPayLaterEnabled function will return the correct value 
        // when the payment components are rendered
        if (payLaterEnabled) {
          console.log('Pay Later feature is enabled for this event');
          // Store the value in event state for isPayLaterEnabled() to detect correctly
          if (!data.settings.some(s => s.key === 'allowPayLater')) {
            data.settings.push({ key: 'allowPayLater', value: 'true' });
          }
          
          // We don't set payLaterOption to true by default, as it's a user choice,
          // but we need to make sure the UI displays the payment method options
          setIsPayLaterShown(true);
        } else {
          setIsPayLaterShown(false);
        }
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

  // Add a simple effect to force redirect authenticated users from auth step to personal step
  useEffect(() => {
    // If user is logged in and on auth step, redirect to personal step
    if (user && currentStep === 'auth') {
      console.log('Auth bypass effect triggered - user is logged in, redirecting to personal step');
      
      // Set a flag to indicate we're in the registration flow to prevent unwanted redirects
      sessionStorage.setItem('inRegistrationFlow', 'true');
      
      // Move to personal step since we're already logged in
      setCurrentStep('personal');
    }
  }, [user, currentStep]);
  
  // Fetch clubs for the current event
  useEffect(() => {
    if (eventId) {
      const fetchClubs = async () => {
        try {
          setClubLoading(true);
          const response = await fetch(`/api/clubs/event/${eventId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch clubs');
          }
          
          const data = await response.json();
          setClubs(data);
        } catch (error) {
          console.error('Error fetching clubs:', error);
          toast({
            title: 'Error',
            description: 'Failed to load club information',
            variant: 'destructive',
          });
        } finally {
          setClubLoading(false);
        }
      };
      
      fetchClubs();
    }
  }, [eventId, toast]);

  const renderStepIndicator = () => {
    const steps: { key: RegistrationStep; label: string; icon: React.ReactNode }[] = [
      { key: 'auth', label: 'Sign In', icon: <UserCircle className="w-4 h-4" /> },
      { key: 'personal', label: 'Personal Details', icon: <UserSquare className="w-4 h-4" /> },
      { key: 'team', label: 'Team Information', icon: <Users className="w-4 h-4" /> },
      { key: 'payment', label: 'Payment & Terms', icon: <CreditCard className="w-4 h-4" /> },
      { key: 'review', label: 'Review & Confirm', icon: <CheckCircle className="w-4 h-4" /> }
    ];

    return (
      <div className="flex items-center justify-center mb-8 animate-fadeIn">
        {steps.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted = index < steps.findIndex(s => s.key === currentStep);
          const stepColor = isActive ? 
            (event?.branding?.primaryColor || '#2C5282') : 
            (isCompleted ? '#48BB78' : '#718096'); 
          
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center group">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-white shadow-md transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                  style={{ 
                    backgroundColor: stepColor,
                    boxShadow: isActive ? '0 3px 10px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <div className="flex items-center justify-center">
                      {isActive ? <span className="font-semibold">{index + 1}</span> : step.icon}
                    </div>
                  )}
                </div>
                <span 
                  className={`text-sm font-medium transition-all ${isActive ? 'font-semibold scale-105' : ''}`}
                  style={{ 
                    color: isActive ? '#111827' : (isCompleted ? '#1F2937' : '#4B5563')
                  }}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-16 sm:w-20 h-[3px] mx-2 transition-all duration-500" style={{ 
                  backgroundColor: isCompleted ? '#48BB78' : '#D1D5DB',
                  boxShadow: isCompleted ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }} />
              )}
            </div>
          );
        })}
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

    // Sort each gender group by age group order (U4, U5, U6, etc.)
    Object.keys(groupedByGender).forEach(gender => {
      groupedByGender[gender].sort((a, b) => {
        // Extract age number from age group (U4 -> 4, U5 -> 5, etc.)
        const getAgeNumber = (ageGroup: AgeGroup & { displayText: string }) => {
          if (ageGroup.ageGroup && ageGroup.ageGroup.startsWith('U')) {
            return parseInt(ageGroup.ageGroup.substring(1));
          }
          return 999; // Put non-U groups at the end
        };
        
        // Sort from youngest to oldest (U4, U5, U6, etc.)
        return getAgeNumber(a) - getAgeNumber(b);
      });
    });

    // Sort genders to show Boys first, then Girls
    const sortedGenders = Object.keys(groupedByGender).sort((a, b) => {
      if (a === 'Boys' && b === 'Girls') return -1;
      if (a === 'Girls' && b === 'Boys') return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="space-y-4">
        {sortedGenders.map((gender) => (
          <div 
            key={gender} 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: `${event?.branding?.primaryColor || '#2C5282'}10` // 10 = 10% opacity
            }}
          >
            <h4 
              className="font-semibold mb-2"
              style={{ color: event?.branding?.primaryColor || '#2C5282' }}
            >{gender}</h4>
            <div className="flex flex-wrap gap-2">
              {groupedByGender[gender].map((group) => (
                <span 
                  key={group.id} 
                  className="bg-white px-3 py-1 rounded-full text-sm border"
                  style={{ 
                    color: event?.branding?.primaryColor || '#2C5282',
                    borderColor: `${event?.branding?.primaryColor || '#2C5282'}25` // 25 = 25% opacity
                  }}
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

  // The handleAuthRedirect function is already defined above

  const onSubmitPersonalDetails = async (data: PersonalDetailsForm) => {
    try {
      console.log('Personal details submitted with data:', data);
      
      // If we're already authenticated, just update the profile
      if (user || data.authenticated) {
        console.log('User is already authenticated, updating profile data');
        updatePersonalDetailsMutation.mutate(data);
        return;
      }
      
      // First time seeing this form submission, check if email exists
      if (!data.emailChecked) {
        console.log('First submission, checking if email exists:', data.email);
        
        // Set loading state
        form.setValue('emailChecked', true);
        
        // Use the existing checkEmailExists function
        const exists = await checkEmailExists(data.email);
        console.log('Email check result:', exists);
        
        // Update form state with email check result
        form.setValue('emailExists', exists);
        
        // Force re-render with the updated form state
        // This will show either login or signup fields
        form.trigger();
        
        // Don't proceed further until authentication is completed
        return;
      }
      
      // Handle authentication based on whether email exists
      if (data.emailExists) {
        // Attempt login with provided credentials
        console.log('Attempting login with existing account');
        
        if (!data.password) {
          form.setError('password', { 
            type: 'manual', 
            message: 'Password is required to log in' 
          });
          return;
        }
        
        setAuthError(null);
        setIsAuthenticating(true);
        
        try {
          // Login using the existing API
          console.log('Logging in through personal details submit with:', { email: data.email });
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: data.email,
              password: data.password 
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
            setAuthError(errorData.message || 'Invalid username or password');
            form.setError('password', { 
              type: 'manual', 
              message: errorData.message || 'Invalid password' 
            });
            return;
          }
          
          // Get user data from response
          const userData = await response.json();
          
          // Update auth context after successful login
          queryClient.setQueryData(['/api/user'], userData);
          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          
          console.log('Login successful, continuing with registration');
          form.setValue('authenticated', true);
          
          // Small delay to ensure React Query updates
          setTimeout(() => {
            updatePersonalDetailsMutation.mutate(data);
            setCurrentStep('team');
          }, 100);
        } catch (loginError) {
          console.error('Login error:', loginError);
          setAuthError('An error occurred during login. Please try again.');
          form.setError('password', { 
            type: 'manual', 
            message: 'An error occurred during login. Please try again.' 
          });
          return;
        } finally {
          setIsAuthenticating(false);
        }
      } else {
        // Create a new account with provided credentials
        console.log('Creating new account for registration');
        
        if (!data.password) {
          form.setError('password', { 
            type: 'manual', 
            message: 'Password is required to create an account' 
          });
          return;
        }
        
        if (data.password !== data.confirmPassword) {
          form.setError('confirmPassword', { 
            type: 'manual', 
            message: 'Passwords don\'t match' 
          });
          return;
        }
        
        setAuthError(null);
        setIsCreatingAccount(true);
        
        try {
          // Registration using the existing API
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              username: data.email, 
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to create account' }));
            setAuthError(errorData.message || 'Failed to create account');
            form.setError('email', { 
              type: 'manual', 
              message: errorData.message || 'Failed to create account' 
            });
            return;
          }
          
          // Get user data from response
          const userData = await response.json();
          
          // Update auth context after successful registration
          queryClient.setQueryData(['/api/user'], userData);
          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          
          console.log('Registration successful, continuing with registration');
          form.setValue('authenticated', true);
          
          // Small delay to ensure React Query updates
          setTimeout(() => {
            updatePersonalDetailsMutation.mutate(data);
            setCurrentStep('team');
          }, 100);
        } catch (registerError) {
          console.error('Registration error:', registerError);
          setAuthError('An error occurred during account creation. Please try again.');
          form.setError('password', { 
            type: 'manual', 
            message: 'An error occurred during account creation. Please try again.' 
          });
          return;
        } finally {
          setIsCreatingAccount(false);
        }
      }
    } catch (error) {
      console.error('Error in personal details submission:', error);
      toast({
        title: 'Error',
        description: 'There was a problem processing your information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const teamForm = useForm<TeamRegistrationForm>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      name: '',
      ageGroupId: 0,
      bracketId: null,
      headCoachName: '',
      headCoachEmail: '',
      headCoachPhone: '',
      assistantCoachName: '',
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      players: [],
      selectedFeeIds: [],
      totalAmount: 0,
      clubId: null,
      clubName: '',
      newClub: false
    }
  });

  const addPlayer = () => {
    const newPlayer: PlayerForm = {
      id: crypto.randomUUID(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      emergencyContactFirstName: '',
      emergencyContactLastName: '',
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
  
  // Handle club selection
  const handleClubSelect = (clubId: number | null) => {
    if (clubId === -1) {
      // -1 indicates "Enter new club"
      setIsNewClub(true);
      teamForm.setValue('clubId', null);
      teamForm.setValue('newClub', true);
    } else if (clubId === null) {
      // No club selected
      setIsNewClub(false);
      teamForm.setValue('clubId', null);
      teamForm.setValue('clubName', '');
      teamForm.setValue('newClub', false);
    } else {
      // Existing club selected
      setIsNewClub(false);
      teamForm.setValue('clubId', clubId);
      teamForm.setValue('newClub', false);
      
      // Find the club name
      const selectedClub = clubs.find(club => club.id === clubId);
      if (selectedClub) {
        teamForm.setValue('clubName', selectedClub.name);
      }
    }
  };
  
  // Handle club logo file selection
  const handleClubLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setClubLogo(file);
    }
  };

  // State to track terms agreement
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  const [availableFees, setAvailableFees] = useState<Fee[]>([]);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number;
    code: string;
    discountType: 'fixed' | 'percentage';
    amount: number;
    description?: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  // For UX purposes, only show one registration fee in the registration fee section 
  // (even if multiple are marked as registration)
  const mainRegistrationFee = useMemo(() => selectedFee, [selectedFee]);
  
  // All other fees, regardless of their type, are considered "additional fees" for the UI
  // This ensures no fees are lost even if they're all marked as "registration" type in the database
  const requiredFees = useMemo(() => 
    availableFees.filter((fee: Fee) => 
      // Exclude the main registration fee to avoid duplicates in the UI
      fee.id !== mainRegistrationFee?.id && fee.isRequired),
    [availableFees, mainRegistrationFee]
  );
  
  // Keep optional fees logic for possible future use
  const optionalFees = useMemo(() => 
    availableFees.filter((fee: Fee) => 
      fee.id !== mainRegistrationFee?.id && !fee.isRequired),
    [availableFees, mainRegistrationFee]
  );
  
  // Calculate total amount to pay based on selected fees and coupon discounts
  const calculateTotalAmount = () => {
    let total = selectedFee ? selectedFee.amount : 0;
    
    // Add required fees
    requiredFees.forEach((fee: Fee) => {
      total += fee.amount;
    });
    
    // Apply coupon discount if valid
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'fixed') {
        // Fixed amount discount (coupon amount is in dollars, convert to cents)
        total = Math.max(0, total - (appliedCoupon.amount * 100));
      } else if (appliedCoupon.discountType === 'percentage') {
        // Percentage discount
        const discountAmount = Math.round(total * (appliedCoupon.amount / 100));
        total = Math.max(0, total - discountAmount);
      }
    }
      
    return (total / 100).toFixed(2);
  };

  // Function to validate coupon code
  const validateCoupon = async (code: string) => {
    if (!code.trim() || !eventId) return;
    
    setIsValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          eventId: eventId
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponError(null);
        toast({
          title: "Coupon Applied!",
          description: `${data.coupon.discountType === 'fixed' 
            ? `$${data.coupon.amount.toFixed(2)} discount` 
            : `${data.coupon.amount}% discount`} applied successfully.`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setAppliedCoupon(null);
      setCouponError('Failed to validate coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Function to remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };
  
  // Fetch fee information when age group is selected
  useEffect(() => {
    if (selectedAgeGroup && selectedAgeGroup.id) {
      // Add a check to prevent repeated API calls for the same age group
      const ageGroupId = selectedAgeGroup.id;
      
      const fetchFees = async () => {
        try {
          console.log(`Fetching fees for age group ${ageGroupId} in event ${eventId}`);
          const response = await fetch(`/api/events/${eventId}/fees?ageGroupId=${ageGroupId}`);
          if (!response.ok) {
            console.error(`Error fetching fees: Server responded with status ${response.status}`);
            return;
          }
          
          const data = await response.json();
          console.log('Fetched fees:', data);
          
          // Handle empty or unexpected response
          if (!data) {
            console.warn('Empty response when fetching fees');
            setAvailableFees([]);
            return;
          }
          
          // Normalize the response data to handle both formats:
          // 1. When server returns {fees: [...], fee: {...}}
          // 2. When server returns just {fee: {...}}
          // 3. When server returns {fees: [...]} with no fee property
          const allFees: Fee[] = [];
          
          // Add all fees from the fees array if it exists
          if (data.fees && Array.isArray(data.fees)) {
            const validFees = data.fees.filter(fee => fee && typeof fee === 'object');
            if (validFees.length > 0) {
              console.log(`Adding ${validFees.length} fees from fees array`);
              allFees.push(...validFees);
            }
          }
          
          // If there's a single fee and it's not already in allFees, add it
          if (data.fee && typeof data.fee === 'object') {
            // Check if this fee is already in the array
            const feeExists = allFees.some(f => f.id === data.fee.id);
            if (!feeExists) {
              console.log('Adding single fee from fee property:', data.fee);
              allFees.push(data.fee);
            }
          }
          
          console.log('All normalized fees:', allFees);
          
          if (allFees.length === 0) {
            console.warn(`No fees found for age group ${ageGroupId}`);
            setAvailableFees([]);
            return;
          }
          
          // Ensure all fee objects have the required properties with defaults to prevent errors
          const normalizedFees = allFees.map(fee => ({
            id: fee.id || 0,
            name: fee.name || 'Unknown Fee',
            amount: fee.amount || 0,
            feeType: fee.feeType || 'registration',
            isRequired: typeof fee.isRequired === 'boolean' ? fee.isRequired : false,
            beginDate: fee.beginDate || null,
            endDate: fee.endDate || null
          }));
          
          // Update available fees state
          setAvailableFees(normalizedFees);
          
          // Find registration fees vs other fees
          const registrationFees = normalizedFees.filter(fee => fee.feeType === 'registration');
          const otherFees = normalizedFees.filter(fee => fee.feeType !== 'registration');
          
          // Get required fees of all types
          const requiredFeesByType: Record<string, Fee[]> = {};
          normalizedFees.forEach(fee => {
            if (fee.isRequired) {
              const feeType = fee.feeType || 'other';
              if (!requiredFeesByType[feeType]) {
                requiredFeesByType[feeType] = [];
              }
              requiredFeesByType[feeType].push(fee);
            }
          });
          
          console.log('Required fees by type:', requiredFeesByType);
          
          // Determine which fee should be the primary registration fee
          let primaryFee: Fee | null = null;
          const now = new Date();
          
          if (registrationFees.length > 0) {
            // First, try to find a registration fee with current date in range
            primaryFee = registrationFees.find(fee => {
              const beginDate = fee.beginDate ? new Date(fee.beginDate) : null;
              const endDate = fee.endDate ? new Date(fee.endDate) : null;
              
              // If no date range is specified, the fee is always applicable
              if (!beginDate && !endDate) return true;
              
              // Check if current date is within the range
              const afterBegin = !beginDate || now >= beginDate;
              const beforeEnd = !endDate || now <= endDate;
              
              return afterBegin && beforeEnd;
            }) || null;
            
            // If no date-appropriate fee found, default to the first registration fee
            if (!primaryFee && registrationFees.length > 0) {
              primaryFee = registrationFees[0];
            }
          }
          
          // If no registration fee type found, use the highest cost required fee as primary
          if (!primaryFee) {
            const allRequiredFees = normalizedFees.filter(fee => fee.isRequired);
            if (allRequiredFees.length > 0) {
              // Sort by amount in descending order and take the highest
              primaryFee = [...allRequiredFees].sort((a, b) => b.amount - a.amount)[0];
            } else if (normalizedFees.length > 0) {
              // Last resort - take any fee
              primaryFee = normalizedFees[0];
            }
          }
          
          // Update state with our primary fee
          if (primaryFee) {
            console.log('Selected primary fee:', primaryFee);
            setSelectedFee(primaryFee);
            setRegistrationFee(primaryFee.amount);
            
            // Only update if we don't already have the fee information to avoid infinite loop
            if (!selectedAgeGroup.registrationFee) {
              setSelectedAgeGroup(prev => prev ? { 
                ...prev, 
                registrationFee: primaryFee.amount
              } : prev);
            }
          }
          
          // Log all required fees for debugging
          const requiredFeeCount = normalizedFees.filter(fee => fee.isRequired).length;
          if (requiredFeeCount > 0) {
            console.log(`Adding ${requiredFeeCount} required fees to total automatically`);
          }
        } catch (error) {
          console.error('Error fetching fees:', error);
          // Ensure UI doesn't break with empty fees
          setAvailableFees([]);
        }
      };
      
      fetchFees();
    }
  }, [selectedAgeGroup?.id, eventId]); // Only depend on the ID, not the whole object
  
  const registerTeamMutation = useMutation({
    mutationFn: async (data: TeamRegistrationForm) => {
      // In preview mode, don't actually call the API
      if (isPreview) {
        console.log('Preview mode: Simulating team registration with data:', data);
        // Simulate a brief delay to imitate the actual process
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true, teamId: 'preview-team-123', data });
          }, 1500);
        });
      }
      
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
          // If dateOfBirth is not a string or is empty, set to empty string as fallback
          processedPlayer.dateOfBirth = '';
        }
        
        return processedPlayer;
      });
      
      // Collect all selected fee IDs
      const selectedFeeIds = [];
      
      // Add the main registration fee
      if (selectedFee) {
        selectedFeeIds.push(selectedFee.id);
      }
      
      // Add required fees only (no optional fees - they are no longer selectable)
      requiredFees.forEach((fee: Fee) => {
        selectedFeeIds.push(fee.id);
      });
      
      // In preview mode, don't actually call the API
      if (isPreview) {
        console.log('Preview mode: Simulating team registration with data:', {
          ...data,
          players: processedPlayers,
          termsAcknowledged: termsAgreed,
          registrationFee: registrationFee,
          selectedFeeIds: selectedFeeIds,
          termsAcknowledgedAt: new Date()
        });
        
        // Simulate a successful response with a mock team ID
        return { 
          teamId: `preview-${crypto.randomUUID().substring(0, 8)}`,
          success: true 
        };
      }
      
      // If creating a new club with a logo, upload it first
      let clubId = data.clubId;
      
      if (data.newClub && data.clubName && clubLogo) {
        try {
          const formData = new FormData();
          formData.append('name', data.clubName);
          formData.append('logo', clubLogo);
          
          const clubResponse = await fetch('/api/clubs', {
            method: 'POST',
            body: formData,
          });
          
          if (!clubResponse.ok) {
            throw new Error('Failed to create club');
          }
          
          const clubData = await clubResponse.json();
          clubId = clubData.id;
        } catch (error) {
          console.error('Error creating club:', error);
          toast({
            title: 'Error',
            description: 'Failed to create club. Team will be registered without club information.',
            variant: 'destructive',
          });
        }
      }
      
      // Transform dates and include terms agreement and fee in submission
      const response = await fetch(`/api/events/${eventId}/register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          clubId, // Use updated clubId if a new club was created
          players: processedPlayers,
          termsAcknowledged: termsAgreed,
          registrationFee: registrationFee,
          selectedFeeIds: selectedFeeIds, // Include all selected fee IDs
          termsAcknowledgedAt: new Date() // Send as Date object, server will handle proper formatting
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
      setCurrentStep('success');
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
    
    // Reset bracket selection when age group changes
    setSelectedBracket(null);
    teamForm.setValue('bracketId', null);
  };
  
  // Fetch brackets when age group is selected
  useEffect(() => {
    if (selectedAgeGroup && eventId) {
      const fetchBrackets = async () => {
        try {
          // Use the correct API endpoint route for fetching brackets
          const response = await fetch(`/api/age-groups/${selectedAgeGroup.id}/brackets`);
          if (!response.ok) {
            console.error(`Error fetching brackets: Server responded with status ${response.status}`);
            setAvailableBrackets([]);
            return;
          }
          
          const data = await response.json();
          console.log('Fetched brackets:', data);
          
          if (Array.isArray(data) && data.length > 0) {
            setAvailableBrackets(data);
          } else {
            setAvailableBrackets([]);
          }
        } catch (error) {
          console.error('Error fetching brackets:', error);
          setAvailableBrackets([]);
        }
      };
      
      fetchBrackets();
    }
  }, [selectedAgeGroup, eventId]);
  
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
    
    // Skip player validation if the user chose to add roster later
    if (players.length === 0 && !addRosterLater) {
      toast({
        title: "Error",
        description: "Please add at least one player to the roster or select the 'Add Roster Later' option",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure teamForm has the correct addRosterLater value
    teamForm.setValue('addRosterLater', addRosterLater);
    
    // Only validate players if we're not using the "add roster later" option
    if (!addRosterLater && players.length > 0) {
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
        !player.emergencyContactFirstName || !player.emergencyContactLastName || !player.emergencyContactPhone
      );
      
      if (missingEmergency.length > 0) {
        toast({
          title: "Missing Emergency Contact",
          description: "Please provide emergency contact information (first name, last name, and phone) for all players",
          variant: "destructive",
        });
        return;
      }
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
              The registration deadline for this event ({formatDateInEventTimezone(event.applicationDeadline, event.timezone)}) has passed. 
              Registration is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use event branding colors if they exist
  const primaryColor = event?.branding?.primaryColor || '#3498db';
  const secondaryColor = event?.branding?.secondaryColor || '#e74c3c';
  const hasBranding = !!event?.branding?.primaryColor && !!event?.branding?.secondaryColor;
  
  // Get contrast color for text (either white or black based on background color)
  const getContrastColor = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace(/^#/, '');
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate luminance - a measure of brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Return white for dark colors, dark gray for light colors
    return luminance > 0.55 ? '#111827' : '#ffffff';
  };
  
  // Calculate contrast color for primary color (used for buttons)
  const primaryContrastColor = getContrastColor(primaryColor);
  
  return (
    <div className="min-h-screen relative register-event-page">
      {/* Display themed background using event branding colors */}
      {hasBranding ? (
        <AnimatedEventBackground 
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          type="particles" 
          opacity={0.6}
          className="opacity-90"
        />
      ) : (
        <SoccerFieldBackground className="opacity-50" />
      )}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {renderStepIndicator()}

        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <CardHeader className="text-center border-b relative">
            {/* Logout button for authenticated users */}
            {user && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
            
            {event.branding?.logoUrl && (
              <div className="mx-auto mb-4">
                <img 
                  src={event.branding.logoUrl} 
                  alt={`${event.name} logo`} 
                  className="max-h-32 object-contain mx-auto"
                />
              </div>
            )}
            <CardTitle 
              className="text-3xl font-bold" 
              style={{ 
                color: event?.branding?.primaryColor || '#2C5282',
                textShadow: event?.branding?.primaryColor ? `0 1px 2px rgba(0,0,0,0.1)` : 'none'
              }}
            >
              {event.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            
            <AnimatePresence mode="wait">
              {currentStep === 'auth' && !authLoading && (
                <motion.div 
                  key="auth-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  {user ? (
                    // If user is authenticated, force redirect to personal step
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-center mb-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">
                        Already Signed In
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Redirecting to registration form...
                      </p>
                      <Button 
                        onClick={() => {
                          console.log("MANUAL STEP ADVANCE - Moving to personal details step");
                          setCurrentStep('personal');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Continue to Registration
                      </Button>
                    </div>
                  ) : (
                    // User is not logged in - show sign in button
                    <>
                      <h3 className="text-xl font-semibold mb-4">Sign In Required</h3>
                      <p className="text-gray-600 mb-6">
                        Please sign in or create an account to register for this event.
                      </p>
                      <Button 
                        size="lg"
                        className="font-semibold px-8"
                        style={{ 
                          backgroundColor: event?.branding?.primaryColor || '#2C5282',
                          color: primaryContrastColor,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onClick={() => {
                          // Extra safety check to ensure we capture this click
                          const returnUrl = `/register/event/${eventId}`;
                          sessionStorage.setItem('redirectAfterAuth', returnUrl);
                          
                          // Double-check that the sessionStorage was set correctly
                          const storedValue = sessionStorage.getItem('redirectAfterAuth');
                          console.log('Auth redirect btn: Stored redirectAfterAuth in sessionStorage:', storedValue);
                          
                          // Directly go to the root URL (/) which will show the login screen
                          console.log('Auth redirect btn: Using direct navigation to root page for login');
                          window.location.href = '/';
                        }}
                      >
                        Sign In / Register
                      </Button>
                    </>
                  )}
                </motion.div>
              )}

              {currentStep === 'personal' && (
                <RegistrationAuthChecker eventId={eventId!}>
                  <motion.div
                    key="personal-step"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitPersonalDetails)} className="space-y-6">
                  {/* Authentication status message */}
                  {user && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-green-700 text-sm">
                          You're signed in as <strong>{user.email}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Display authentication related fields conditionally */}
                  {!user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">
                        Account Verification
                      </h3>
                      <p className="text-blue-700 mb-2">
                        {form.getValues().emailChecked 
                          ? (form.getValues().emailExists 
                              ? "This email is already registered. You'll be prompted to verify your account below." 
                              : "Create a password to register your account.")
                          : "We'll check if you already have an account when you enter your email."}
                      </p>
                      
                      {/* Show any authentication errors */}
                      {authError && (
                        <p className="text-red-500 text-sm mt-2">{authError}</p>
                      )}
                      
                      {/* Show registration fields if email is new */}
                      {form.getValues().emailChecked && !form.getValues().emailExists && (
                        <div className="space-y-4 pt-2">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Create Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="8+ characters, include number & special character" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription className="text-sm text-muted-foreground">
                                  Password must be at least 8 characters and include a number and special character (e.g., !@#$%)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Confirm your password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {authError && (
                            <p className="text-red-500 text-sm mt-2">{authError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="enhanced-label">First Name</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              placeholder={emailExists && redactedUserData?.firstName ? "●●●●●●●●" : undefined}
                              disabled={emailExists && !form.getValues().authenticated}
                            />
                          </FormControl>
                          {emailExists && redactedUserData?.firstName && !form.getValues().authenticated && (
                            <div className="text-xs text-muted-foreground">
                              Enter your password to continue with saved information
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="enhanced-label">Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              placeholder={emailExists && redactedUserData?.lastName ? "●●●●●●●●" : undefined}
                              disabled={emailExists && !form.getValues().authenticated}
                            />
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
                          <FormLabel className="enhanced-label">Email</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              type="email"
                              onChange={(e) => {
                                field.onChange(e); // Handle default change
                                
                                // Clear any previous timeout
                                if (debounceTimeout) {
                                  clearTimeout(debounceTimeout);
                                  setDebounceTimeout(null);
                                }
                                
                                // Setup debounce validation
                                if (e.target.value && e.target.value.includes('@')) {
                                  const newTimeout = setTimeout(() => {
                                    checkEmailExists(e.target.value);
                                  }, 800); // 800ms delay for debounce
                                  
                                  setDebounceTimeout(newTimeout);
                                }
                              }}
                              disabled={isCheckingEmail}
                            />
                          </FormControl>
                          {isCheckingEmail && (
                            <div className="enhanced-message">
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Checking email...
                            </div>
                          )}
                          {emailExists && redactedUserData && (
                            <div className="enhanced-message" style={{ color: '#2563eb' }}>
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Existing account found. Please enter your password to continue.
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="enhanced-label">Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              type="tel"
                              placeholder={emailExists && redactedUserData?.phone ? "(***) ***-****" : undefined}
                              disabled={emailExists && !form.getValues().authenticated}
                            />
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
                          <FormLabel className="enhanced-label">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              placeholder={emailExists && redactedUserData?.address ? "●●●●●●●●●●●●●●●●●●●●" : undefined}
                              disabled={emailExists && !form.getValues().authenticated}
                            />
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
                          <FormLabel className="enhanced-label">City</FormLabel>
                          <FormControl>
                            <Input 
                              className="enhanced-input"
                              {...field} 
                              placeholder={emailExists && redactedUserData?.city ? "●●●●●●●●" : undefined}
                              disabled={emailExists && !form.getValues().authenticated}
                            />
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
                            <FormLabel className="enhanced-label">State</FormLabel>
                            <FormControl>
                              <Input 
                                className="enhanced-input"
                                {...field} 
                                maxLength={2}
                                placeholder={emailExists && redactedUserData?.state ? "**" : undefined}
                                disabled={emailExists && !form.getValues().authenticated}
                              />
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
                            <FormLabel className="enhanced-label">ZIP Code</FormLabel>
                            <FormControl>
                              <Input 
                                className="enhanced-input"
                                {...field} 
                                maxLength={5}
                                placeholder={emailExists && redactedUserData?.zipCode ? "*****" : undefined}
                                disabled={emailExists && !form.getValues().authenticated}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Password verification section when existing account is found */}
                  {emailExists && redactedUserData && !form.getValues().authenticated && (
                    <div className="mt-6 p-6 border border-dashed border-primary/60 rounded-md bg-primary/5 shadow-md animate-fadeIn">
                      <div className="flex items-center space-x-2 mb-3">
                        <UserCircle className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Existing Account Found</h3>
                      </div>
                      
                      <p className="text-sm mb-5 text-gray-600">
                        We found your information in our system. Please enter your password to continue with your saved information.
                      </p>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="enhanced-label">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  className="enhanced-input h-11" 
                                  {...field} 
                                  type="password" 
                                  placeholder="Enter your password"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      verifyExistingAccount();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="button" 
                          variant="default" 
                          className="w-full transition-all duration-300 hover:scale-[1.02] bg-primary hover:bg-primary/90 text-white h-11 shadow-md"
                          onClick={verifyExistingAccount}
                          disabled={isVerifyingPassword}
                          size="lg"
                        >
                          {isVerifyingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Continue with Existing Account'
                          )}
                        </Button>
                        
                        <div className="text-sm pt-2 border-t border-gray-100 mt-2">
                          <span className="text-muted-foreground">Don't remember your password? </span>
                          <a 
                            href="/forgot-password" 
                            target="_blank" 
                            className="text-primary font-medium hover:underline"
                          >
                            Reset Password
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-6">
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // When going back, reset authentication state for clarity
                          setEmailExists(false);
                          setRedactedUserData(null);
                          setAuthError(null);
                          setIsVerifyingPassword(false);
                          form.setValue('password', '');
                          form.setValue('emailChecked', false);
                          form.setValue('emailExists', false);
                          form.setValue('authenticated', false);
                          console.log('Cleared authentication state when going back');
                          setCurrentStep('auth');
                        }}
                        className="border-gray-300 hover:border-gray-400 transition-all hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      
                      {/* Original submit button just saves but doesn't advance */}
                      <Button 
                        type="submit"
                        className="font-medium shadow-md transition-all duration-300 hover:shadow-lg h-10"
                        style={{ 
                          backgroundColor: event?.branding?.primaryColor || '#2C5282',
                          color: primaryContrastColor
                        }}
                        disabled={updatePersonalDetailsMutation.isPending}
                      >
                        {updatePersonalDetailsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Details
                          </>
                        )}
                      </Button>
                      
                      {/* Enhanced continue button that's more visible */}
                      {updatePersonalDetailsMutation.isSuccess && (
                        <Button 
                          type="button"
                          className="font-medium ml-2 relative shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] h-10"
                          onClick={() => {
                            // Check if an account exists but isn't verified
                            if (emailExists && !form.getValues('authenticated')) {
                              toast({
                                title: "Account Verification Required",
                                description: "You must verify your existing account with your password before continuing.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Set a flag to indicate we're in the registration flow
                            sessionStorage.setItem('inRegistrationFlow', 'true');
                            // Navigate to the team step
                            handleDirectStepNavigation('team');
                          }}
                          style={{ 
                            backgroundColor: event?.branding?.secondaryColor || '#48BB78',
                            color: getContrastColor(event?.branding?.secondaryColor || '#48BB78')
                          }}
                        >
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
              </motion.div>
                </RegistrationAuthChecker>
            )}

            {currentStep === 'team' && user && (
              <motion.div
                key="team-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(onSubmitTeamRegistration)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 
                      className="text-xl font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >
                      Team Information
                    </h3>
                    
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
                    
                    {/* Club Selection */}
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="club-select">Club</Label>
                        <Select
                          value={teamForm.watch('clubId')?.toString() || 'none'}
                          onValueChange={(value) => {
                            const clubId = value === 'none' ? null : 
                                          value === '-1' ? -1 : 
                                          parseInt(value, 10);
                            handleClubSelect(clubId);
                          }}
                        >
                          <SelectTrigger id="club-select" className={clubLoading ? 'opacity-50' : ''}>
                            <SelectValue placeholder="Select a club" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No club</SelectItem>
                            {clubs.map((club) => (
                              <SelectItem key={club.id} value={club.id.toString()}>
                                {club.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="-1">
                              <span className="flex items-center">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Enter new club
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* New Club Input Fields */}
                      {isNewClub && (
                        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                          <h4 className="font-medium">New Club Details</h4>
                          
                          <FormField
                            control={teamForm.control}
                            name="clubName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Club Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-2">
                            <Label htmlFor="club-logo">Club Logo (optional)</Label>
                            <div className="flex flex-col gap-4">
                              <Input
                                id="club-logo"
                                type="file"
                                accept="image/*"
                                onChange={handleClubLogoChange}
                                className="max-w-md"
                              />
                              {clubLogo && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground mb-2">Logo Preview:</p>
                                  <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden">
                                    <img
                                      src={URL.createObjectURL(clubLogo)}
                                      alt="Club logo preview"
                                      className="w-full h-full object-contain"
                                      onLoad={() => {
                                        // Revoke object URL to avoid memory leaks
                                        URL.revokeObjectURL(URL.createObjectURL(clubLogo));
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Upload a logo image (max 5MB). The logo will be resized to fit appropriately on game cards.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

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
                              {event.ageGroups?.filter(ageGroup => ageGroup.isEligible !== false)
                                .sort((a, b) => {
                                  // First sort by age group number (U4, U5, U6, etc.)
                                  const getAgeNumber = (ageGroup: string) => {
                                    if (ageGroup && ageGroup.startsWith('U')) {
                                      return parseInt(ageGroup.substring(1));
                                    }
                                    return 999; // Put non-U groups at the end
                                  };
                                  
                                  const ageA = getAgeNumber(a.ageGroup);
                                  const ageB = getAgeNumber(b.ageGroup);
                                  
                                  if (ageA !== ageB) {
                                    return ageA - ageB;
                                  }
                                  
                                  // Within same age, sort by gender: Boys, Girls, Coed
                                  const genderOrder: { [key: string]: number } = { 'Boys': 0, 'Girls': 1, 'Coed': 2 };
                                  return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3);
                                })
                                .map((ageGroup) => (
                                <SelectItem key={ageGroup.id} value={String(ageGroup.id)}>
                                  {ageGroup.divisionCode ? `${ageGroup.divisionCode} - ` : ''}{`${ageGroup.gender} ${ageGroup.ageGroup}`}
                                  {ageGroup.birthYear ? ` (${ageGroup.birthYear})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Bracket Selector - appears after age group selection */}
                    {selectedAgeGroup && availableBrackets.length > 0 && (
                      <FormField
                        control={teamForm.control}
                        name="bracketId"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Select Bracket</FormLabel>
                            <FormControl>
                              <BracketSelector 
                                brackets={availableBrackets}
                                value={field.value}
                                onChange={(bracketId) => {
                                  field.onChange(bracketId);
                                  setSelectedBracket(bracketId);
                                }}
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-gray-500">
                              Select a bracket that best matches your team's skill level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Fee display when age group is selected */}
                    {selectedAgeGroup && selectedFee && (
                      <div className="mt-2 bg-blue-50 p-3 rounded-md">
                        <div className="space-y-2">
                          <div className="border-b pb-2 mb-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Primary Registration Fee:</span>
                              <span className="text-base font-semibold text-blue-700">
                                ${(selectedFee.amount / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                {selectedFee.name}
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {selectedFee.feeType || 'registration'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Show required fees automatically */}
                          {requiredFees.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <p className="font-medium text-sm">Required Additional Fees:</p>
                              {requiredFees.map(fee => (
                                <div key={`req-${fee.id}`} className="flex justify-between items-center mt-1">
                                  <span className="font-medium">{fee.name}</span>
                                  <span className="font-medium">${(fee.amount / 100).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Total amount */}
                          <div className="border-t pt-2 mt-1 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total:</span>
                            <span className="text-sm font-bold text-blue-700">${calculateTotalAmount()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 
                      className="text-xl font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >
                      Coach Information
                    </h3>
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
                            <FormLabel>
                              Head Coach Email
                              {isCheckingCoach && (
                                <span className="ml-2 inline-flex items-center">
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  <span className="text-xs text-muted-foreground">Checking...</span>
                                </span>
                              )}
                              {coachFound && !isCheckingCoach && (
                                <span className="ml-2 inline-flex items-center text-green-600">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  <span className="text-xs">Coach found</span>
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleCoachEmailChange(e.target.value);
                                }}
                                placeholder="Enter email to search for existing coach"
                              />
                            </FormControl>
                            <FormDescription>
                              Enter coach email to check if they already have an account
                            </FormDescription>
                            <FormMessage />
                            {coachFound && !isCheckingCoach && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Coach information automatically filled from existing account.
                              </p>
                            )}
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
                              <Input 
                                {...field} 
                                type="tel" 
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  field.onChange(formatted);
                                }}
                                placeholder="(555) 123-4567"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 
                      className="text-xl font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >
                      Team Manager Information
                    </h3>
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
                            <FormLabel>
                              Manager Email
                              {isCheckingManager && (
                                <span className="ml-2 inline-flex items-center">
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  <span className="text-xs text-muted-foreground">Checking...</span>
                                </span>
                              )}
                              {managerFound && !isCheckingManager && (
                                <span className="ml-2 inline-flex items-center text-green-600">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  <span className="text-xs">Manager found</span>
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleManagerEmailChange(e.target.value);
                                }}
                                placeholder="Enter email to search for existing manager"
                              />
                            </FormControl>
                            <FormDescription>
                              Enter manager email to check if they already have an account
                            </FormDescription>
                            <FormMessage />
                            {managerFound && !isCheckingManager && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Manager information automatically filled from existing account.
                              </p>
                            )}
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
                              <Input 
                                {...field} 
                                type="tel" 
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  field.onChange(formatted);
                                }}
                                placeholder="(555) 123-4567"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <h3 
                          className="text-xl font-semibold"
                          style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                        >
                          Player Roster
                        </h3>
                        
                        {/* Add Roster Later Checkbox */}
                        <div className="flex items-center">
                          <Checkbox 
                            id="add-roster-later" 
                            checked={addRosterLater}
                            onCheckedChange={(checked) => {
                              setAddRosterLater(checked === true);
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor="add-roster-later"
                            className="text-sm font-medium text-muted-foreground leading-none cursor-pointer flex gap-1 items-center"
                          >
                            Add roster later
                            <span title="Complete registration now and add your players later from your dashboard">
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPlayer}
                          className="flex items-center"
                          disabled={addRosterLater}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Player
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                              disabled={addRosterLater}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              CSV Upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Upload Player Roster CSV</DialogTitle>
                              <DialogDescription>
                                Upload a CSV file with your player roster information.
                                All required fields must be included.
                              </DialogDescription>
                            </DialogHeader>
                            <CsvUploader
                              onUploadSuccess={(players) => {
                                setPlayers((prev) => [...prev, ...players]);
                                toast({
                                  title: "Upload Successful",
                                  description: `Added ${players.length} players to your roster.`,
                                });
                              }}
                            />
                            <div className="border-t pt-4 mt-4">
                              <h4 className="font-medium mb-2">Need a template?</h4>
                              <p className="text-sm text-gray-500 mb-4">
                                Download our CSV template with all the required fields:
                              </p>
                              <a
                                href="/api/upload/template"
                                download="player-roster-template.csv"
                                className="flex items-center text-[#2C5282] hover:underline"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Template
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    {addRosterLater ? (
                      <div className="text-center p-8 border border-dashed rounded-md bg-amber-50">
                        <Clock className="w-12 h-12 mx-auto text-amber-500 mb-2" />
                        <h4 className="font-medium text-amber-800">Add Roster Later</h4>
                        <p className="text-amber-700 mt-2">
                          You've chosen to complete your roster later. After registration, 
                          you'll be able to add players from your dashboard or via CSV upload.
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-4 text-amber-700 border-amber-300"
                          onClick={() => setAddRosterLater(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel & Add Players Now
                        </Button>
                      </div>
                    ) : players.length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-md">
                        <UserRoundPlus className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No players added yet. Click "Add Player" or "CSV Upload" to begin building your roster.</p>
                        <Button
                          type="button"
                          variant="link"
                          className="mt-4 text-blue-600"
                          onClick={() => setAddRosterLater(true)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Do This Later - Add Roster After Registration
                        </Button>
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
                              
                              {/* Position field removed as requested */}
                              
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
                              {/* Parent/Guardian Information section removed to simplify data collection */}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium mb-2">Emergency Contact</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-emergencyFirstName`}>Emergency Contact First Name *</Label>
                                  <Input
                                    id={`player-${index}-emergencyFirstName`}
                                    value={player.emergencyContactFirstName || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].emergencyContactFirstName = e.target.value;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`player-${index}-emergencyLastName`}>Emergency Contact Last Name *</Label>
                                  <Input
                                    id={`player-${index}-emergencyLastName`}
                                    value={player.emergencyContactLastName || ''}
                                    onChange={(e) => {
                                      const newPlayers = [...players];
                                      newPlayers[index].emergencyContactLastName = e.target.value;
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
                                      const formatted = formatPhoneNumber(e.target.value);
                                      const newPlayers = [...players];
                                      newPlayers[index].emergencyContactPhone = formatted;
                                      setPlayers(newPlayers);
                                      // Update form state with the modified players array
                                      teamForm.setValue('players', newPlayers);
                                    }}
                                    placeholder="(555) 123-4567"
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
                  
                  <div className="flex justify-end pt-6">
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep('personal')}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit"
                        className="text-white"
                        style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
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
                  </div>
                </form>
              </Form>
              </motion.div>
            )}

            {currentStep === 'payment' && user && (
              <motion.div 
                key="payment-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >
                  Payment and Terms
                </h3>
                
                {/* Cart Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-4">Registration Summary</h4>
                  
                  {/* Team Info Display */}
                  <div className="mb-4 bg-white p-3 rounded-md">
                    <h5 className="font-medium text-blue-700">Team Information</h5>
                    <div className="mt-1 text-gray-600">
                      <p><span className="font-medium">Team Name:</span> {teamForm.getValues().name}</p>
                      <p><span className="font-medium">Division:</span> {selectedAgeGroup?.divisionCode || selectedAgeGroup?.ageGroup}</p>
                      <p><span className="font-medium">Coach:</span> {teamForm.getValues().headCoachName}</p>
                    </div>
                  </div>
                  
                  {/* Fee Section */}
                  <div className="mb-4">
                    <h5 className="font-medium text-blue-700 mb-2">Fee Details</h5>
                    
                    {availableFees.length > 0 ? (
                      <div className="space-y-3">
                        {/* Multiple Fee Options Selector */}
                        {availableFees.length > 1 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Select Registration Fee Option:</label>
                            <div className="grid gap-2">
                              {availableFees.filter(fee => fee.feeType === 'registration').map((fee) => (
                                <div 
                                  key={fee.id}
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setRegistrationFee(fee.amount);
                                  }}
                                  className={`
                                    p-3 border rounded-md flex justify-between items-center cursor-pointer
                                    ${selectedFee?.id === fee.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                                  `}
                                >
                                  <div>
                                    <p className="font-medium">{fee.name}</p>
                                    {(fee.beginDate || fee.endDate) && (
                                      <p className="text-xs text-gray-500">
                                        {fee.beginDate && `Available from ${formatDateInEventTimezone(fee.beginDate, event.timezone)}`}
                                        {fee.beginDate && fee.endDate && ' to '}
                                        {fee.endDate && `${formatDateInEventTimezone(fee.endDate, event.timezone)}`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="font-bold text-blue-800">
                                    ${(fee.amount / 100).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Cart Items */}
                        <div className="bg-white rounded-md overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                              <tr>
                                <th className="px-4 py-2">Item</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {/* Registration Fee */}
                              {selectedFee && (
                                <tr>
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium">{selectedFee.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {selectedAgeGroup?.divisionCode || selectedAgeGroup?.ageGroup} Team
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                      Primary {selectedFee.feeType || 'Registration'} Fee
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    ${(selectedFee.amount / 100).toFixed(2)}
                                  </td>
                                </tr>
                              )}
                              
                              {/* Additional Fees like Uniform (only required fees are shown) */}
                              {requiredFees.map(fee => (
                                <tr key={`fee-${fee.id}`}>
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium">{fee.name}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs flex items-center gap-1">
                                      {fee.feeType || 'Additional'}
                                      <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Required</Badge>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    ${(fee.amount / 100).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Show coupon discount row if applied */}
                              {appliedCoupon && (
                                <tr className="border-t border-green-200 bg-green-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <p className="font-medium text-green-800">Discount: {appliedCoupon.code}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                      {appliedCoupon.discountType === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-green-800">
                                    -{(() => {
                                      let subtotal = selectedFee ? selectedFee.amount : 0;
                                      requiredFees.forEach((fee) => {
                                        subtotal += fee.amount;
                                      });
                                      
                                      if (appliedCoupon.discountType === 'fixed') {
                                        const discountAmount = Math.min(appliedCoupon.amount * 100, subtotal);
                                        return `$${(discountAmount / 100).toFixed(2)}`;
                                      } else {
                                        const discountAmount = Math.round(subtotal * (appliedCoupon.amount / 100));
                                        return `$${(discountAmount / 100).toFixed(2)}`;
                                      }
                                    })()}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="bg-gray-50 font-medium">
                              <tr>
                                <td className="px-4 py-3" colSpan={2}>Total</td>
                                <td className="px-4 py-3 text-right text-blue-800">
                                  ${calculateTotalAmount()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        
                        {/* Optional fees removed - all fees are automatically applied */}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No fees available for the selected age group
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Agreement Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <h4 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Tournament Agreement</h4>
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
                    <h4 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Refund Policy</h4>
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
                
                {/* Payment Options */}
                {termsAgreed && (
                  <div className="border rounded-lg p-4 space-y-6">
                    <div>
                      <h4 
                        className="font-semibold"
                        style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                      >Payment Options</h4>
                      {registrationFee ? (
                        <p className="text-sm text-gray-600">Select how you would like to proceed with payment</p>
                      ) : (
                        <p className="text-sm text-gray-600">
                          No registration fee is configured for this age group. You can register without payment at this time.
                        </p>
                      )}
                    </div>
                    
                    {/* No Fee Case - Show direct registration button */}
                    {!registrationFee && (
                      <div className="mt-4">
                        <Button 
                          type="button" 
                          className="w-full text-white"
                          style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
                          onClick={() => {
                            // Make sure to sync the latest players array with form data
                            teamForm.setValue('players', players);
                            
                            // For no-fee registrations, we need to set addRosterLater to true
                            // if they don't have any players (to bypass the server validation)
                            const shouldAddRosterLater = addRosterLater || players.length === 0;
                            
                            // If players array is empty and addRosterLater isn't already set,
                            // update the addRosterLater state for UI consistency
                            if (players.length === 0 && !addRosterLater) {
                              setAddRosterLater(true);
                            }
                            
                            // Submit registration without payment info
                            registerTeamMutation.mutate({
                              ...teamForm.getValues(),
                              selectedFeeIds: [],
                              totalAmount: 0, // No amount
                              paymentMethod: 'free',
                              addRosterLater: shouldAddRosterLater // Always true if no players
                            });
                          }}
                          disabled={registerTeamMutation.isPending}
                        >
                          {registerTeamMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Complete Registration
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Discount Code Section - Show if there are fees */}
                    {(requiredFees.length > 0 || selectedFee) && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">Discount Code (Optional)</h4>
                          {appliedCoupon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="text-red-600 hover:text-red-700 h-auto p-0"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        {!appliedCoupon ? (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter discount code (e.g., DJSO)"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="flex-1"
                              disabled={isValidatingCoupon}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => validateCoupon(couponCode)}
                              disabled={!couponCode.trim() || isValidatingCoupon}
                              className="px-4"
                            >
                              {isValidatingCoupon ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  Discount Applied: {appliedCoupon.code}
                                </p>
                                {appliedCoupon.description && (
                                  <p className="text-xs text-green-600 mt-1">
                                    {appliedCoupon.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm font-medium text-green-800">
                                -{appliedCoupon.discountType === 'fixed' 
                                  ? `$${appliedCoupon.amount.toFixed(2)}`
                                  : `${appliedCoupon.amount}%`
                                }
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {couponError && (
                          <p className="text-sm text-red-600">{couponError}</p>
                        )}
                        
                        {/* Total amount display with discount applied */}
                        {(requiredFees.length > 0 || selectedFee) && (
                          <div className="bg-gray-50 border rounded-md p-3 mt-3">
                            <div className="space-y-2">
                              {/* Show fee breakdown */}
                              {selectedFee && (
                                <div className="flex justify-between text-sm">
                                  <span>{selectedFee.name}</span>
                                  <span>${(selectedFee.amount / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {requiredFees.map((fee) => (
                                <div key={fee.id} className="flex justify-between text-sm">
                                  <span>{fee.name}</span>
                                  <span>${(fee.amount / 100).toFixed(2)}</span>
                                </div>
                              ))}
                              
                              {/* Show discount if applied */}
                              {appliedCoupon && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Discount ({appliedCoupon.code})</span>
                                  <span>
                                    -{(() => {
                                      let subtotal = selectedFee ? selectedFee.amount : 0;
                                      requiredFees.forEach((fee) => {
                                        subtotal += fee.amount;
                                      });
                                      
                                      if (appliedCoupon.discountType === 'fixed') {
                                        const discountAmount = Math.min(appliedCoupon.amount * 100, subtotal);
                                        return `$${(discountAmount / 100).toFixed(2)}`;
                                      } else {
                                        const discountAmount = Math.round(subtotal * (appliedCoupon.amount / 100));
                                        return `$${(discountAmount / 100).toFixed(2)}`;
                                      }
                                    })()}
                                  </span>
                                </div>
                              )}
                              
                              {/* Total amount */}
                              <div className="border-t pt-2">
                                <div className="flex justify-between font-bold">
                                  <span>Total Amount</span>
                                  <span>${calculateTotalAmount()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Method Selection - Only show if there are fees */}
                    {registrationFee && isPayLaterShown ? (
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-3">
                          <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-blue-50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="card"
                              checked={!payLaterOption}
                              onChange={() => setPayLaterOption(false)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <div>
                              <h4 className="font-medium">Pay now with card</h4>
                              <p className="text-sm text-gray-500">Complete payment immediately with credit/debit card</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-blue-50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="later"
                              checked={payLaterOption}
                              onChange={() => setPayLaterOption(true)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <div>
                              <h4 className="font-medium">Pay later</h4>
                              <p className="text-sm text-gray-500">Register now and pay before the event date</p>
                            </div>
                          </label>
                        </div>
                        
                        {/* Pay Now option - Show credit card form */}
                        {!payLaterOption && (
                          <div className="mt-4">
                            <h4 
                              className="font-semibold"
                              style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                            >Payment Information</h4>
                            <p className="text-sm text-gray-600 mb-2">Please provide your payment details below</p>
                            <div className="p-3 mb-4 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
                              <p className="flex items-start">
                                <InfoPopover content={
                                  <div>
                                    Two-step payment process: Your payment information will be securely stored, but your card will only be charged after your team registration is reviewed and approved by event administrators.
                                  </div>
                                } />
                                <span>
                                  <strong>Two-step payment process:</strong> Your payment information will be securely stored, but your card will only be charged after your team registration is reviewed and approved by event administrators.
                                </span>
                              </p>
                            </div>
                            
                            <StripeProvider>
                              <PaymentForm 
                                amount={parseFloat(calculateTotalAmount()) * 100} // Convert back to cents for payment processing
                                isPreview={isPreview}
                                onSuccess={() => {
                                  // Make sure to sync the latest players array with form data
                                  teamForm.setValue('players', players);
                                  
                                  // Include all applicable fee IDs in the submission
                                  const allSelectedFeeIds = [
                                    ...(selectedFee ? [selectedFee.id] : []),
                                    ...requiredFees.map(fee => fee.id)
                                  ];
                                  
                                  // Then submit the form values along with player data and selected fees
                                  registerTeamMutation.mutate({
                                    ...teamForm.getValues(),
                                    selectedFeeIds: allSelectedFeeIds,
                                    totalAmount: parseFloat(calculateTotalAmount()) * 100, // in cents
                                    paymentMethod: 'card'
                                  });
                                }}
                                isProcessing={registerTeamMutation.isPending}
                                setIsProcessing={() => {}} // This is a mock function
                              />
                            </StripeProvider>
                          </div>
                        )}
                        
                        {/* Pay Later option - Show confirmation button */}
                        {payLaterOption && (
                          <div className="mt-4">
                            <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-4">
                              <h4 className="font-medium text-amber-800 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Payment Reminder
                              </h4>
                              <p className="text-sm text-amber-700 mt-1">
                                By choosing to pay later, you agree to complete payment before the event. 
                                Your team registration will be marked as "pending payment" until the full amount is received.
                              </p>
                            </div>
                            
                            <Button 
                              type="button" 
                              className="w-full text-white"
                              style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
                              onClick={() => {
                                // Make sure to sync the latest players array with form data
                                teamForm.setValue('players', players);
                                
                                // Include all applicable fee IDs in the submission
                                const allSelectedFeeIds = [
                                  ...(selectedFee ? [selectedFee.id] : []),
                                  ...requiredFees.map(fee => fee.id)
                                ];
                                
                                // Submit with "pay_later" method
                                registerTeamMutation.mutate({
                                  ...teamForm.getValues(),
                                  selectedFeeIds: allSelectedFeeIds,
                                  totalAmount: parseFloat(calculateTotalAmount()) * 100, // in cents
                                  paymentMethod: 'pay_later',
                                  addRosterLater // Include the flag to indicate roster will be added later
                                });
                              }}
                              disabled={registerTeamMutation.isPending}
                            >
                              {registerTeamMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  Register Now (Pay Later)
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular Payment Flow (Pay Later not enabled)
                      <div>
                        {registrationFee && (
                          <>
                            <h4 
                              className="font-semibold"
                              style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                            >Payment Information</h4>
                            <p className="text-sm text-gray-600 mb-2">Please provide your payment details below</p>
                            <div className="p-3 mb-4 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
                              <p className="flex items-start">
                                <InfoPopover content={
                                  <div>
                                    Two-step payment process: Your payment information will be securely stored by Stripe, but your card will only be charged after your team registration is reviewed and approved by event administrators. The total amount will be charged at that time.
                                  </div>
                                } />
                                <span>
                                  <strong>Two-step payment process:</strong> Your payment information will be securely stored by Stripe, but your card will only be charged after your team registration is reviewed and approved by event administrators. The total amount of ${(parseFloat(calculateTotalAmount())).toFixed(2)} will be charged at that time.
                                </span>
                              </p>
                            </div>
                            
                            <PaymentSetupWrapper 
                              teamId={`temp-${Date.now()}`} // Use temporary ID that won't conflict with database
                              expectedAmount={parseFloat(calculateTotalAmount()) * 100} // Convert back to cents for payment processing
                              teamName={teamForm.getValues().name}
                              eventName={event?.name || 'tournament'}
                              onSuccess={(setupIntentId, paymentMethodId) => {
                                console.log(`Setup intent created successfully: ${setupIntentId}, Payment method: ${paymentMethodId}`);
                                
                                // Make sure to sync the latest players array with form data
                                teamForm.setValue('players', players);
                                
                                // Include all applicable fee IDs in the submission
                                const allSelectedFeeIds = [
                                  ...(selectedFee ? [selectedFee.id] : []),
                                  ...requiredFees.map(fee => fee.id)
                                ];
                                
                                // Then submit the form values along with player data, selected fees, and payment method info
                                registerTeamMutation.mutate({
                                  ...teamForm.getValues(),
                                  selectedFeeIds: allSelectedFeeIds,
                                  totalAmount: parseFloat(calculateTotalAmount()) * 100, // in cents
                                  paymentMethod: 'card',
                                  addRosterLater, // Include the flag to indicate roster will be added later
                                  setupIntentId, // Include the setup intent ID
                                  paymentMethodId // Include the payment method ID
                                });
                              }}
                              onError={(error) => {
                                toast({
                                  title: "Payment Setup Error",
                                  description: error.message || "There was a problem setting up your payment method",
                                  variant: "destructive"
                                });
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('team')}
                  >
                    Back
                  </Button>
                </div>
              </motion.div>
            )}
            
            {currentStep === 'review' && user && (
              <motion.div 
                key="review-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >
                  Review & Confirm Registration
                </h3>
                
                {/* Team Information Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Team Name</label>
                        <p className="font-medium">{teamForm.getValues().name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Age Group</label>
                        <p className="font-medium">
                          {selectedAgeGroup ? `${selectedAgeGroup.ageGroup} ${selectedAgeGroup.gender}` : 'Not selected'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Head Coach</label>
                        <p className="font-medium">{teamForm.getValues().headCoachName}</p>
                        <p className="text-sm text-gray-600">{teamForm.getValues().headCoachEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Team Manager</label>
                        <p className="font-medium">{teamForm.getValues().managerName}</p>
                        <p className="text-sm text-gray-600">{teamForm.getValues().managerEmail}</p>
                      </div>
                      {teamForm.getValues().clubName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Club</label>
                          <p className="font-medium">{teamForm.getValues().clubName}</p>
                        </div>
                      )}
                    </div>
                    
                    {addRosterLater ? (
                      <div className="bg-amber-50 p-3 rounded border border-amber-200">
                        <p className="text-amber-800 font-medium">Players will be added later</p>
                        <p className="text-sm text-amber-600">You've chosen to add your team roster after registration</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Players ({players.length})</label>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {players.map((player, index) => (
                            <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                              <span className="font-medium">{player.firstName} {player.lastName}</span>
                              <span className="text-sm text-gray-600">Born: {player.dateOfBirth}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {/* Required Fees */}
                      {requiredFees.map((fee) => (
                        <div key={fee.id} className="flex justify-between">
                          <span>{fee.name}</span>
                          <span className="font-medium">${(fee.amount / 100).toFixed(2)}</span>
                        </div>
                      ))}
                      
                      {/* Selected Optional Fee */}
                      {selectedFee && (
                        <div className="flex justify-between">
                          <span>{selectedFee.name}</span>
                          <span className="font-medium">${(selectedFee.amount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {requiredFees.length === 0 && !selectedFee && (
                        <div className="text-center py-4 text-gray-500">
                          No registration fees for this age group
                        </div>
                      )}
                    </div>
                    
                    {/* Applied Coupon Display Only (for review) */}
                    {appliedCoupon && (
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700">Applied Discount</h4>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Discount Code: {appliedCoupon.code}
                              </p>
                              {appliedCoupon.description && (
                                <p className="text-xs text-green-600 mt-1">
                                  {appliedCoupon.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm font-medium text-green-800">
                              -{appliedCoupon.discountType === 'fixed' 
                                ? `$${appliedCoupon.amount.toFixed(2)}`
                                : `${appliedCoupon.amount}%`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(requiredFees.length > 0 || selectedFee) && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span>${calculateTotalAmount()}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Payment Process</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Your payment method will be securely saved</li>
                        <li>• No charge will be made immediately</li>
                        <li>• Payment will only be processed if your registration is approved</li>
                        <li>• You'll receive an email receipt when payment is processed</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="font-medium">{form.getValues().firstName} {form.getValues().lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="font-medium">{form.getValues().email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="font-medium">{form.getValues().phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Payment Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(requiredFees.length > 0 || selectedFee) ? (
                      <div className="space-y-4">
                        {/* Show payment form directly */}
                        <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
                          <h4 className="font-medium text-blue-800 mb-2">Ready to Complete Registration</h4>
                          <p className="text-sm text-blue-700">
                            Review your information above and complete the payment setup below to finalize your registration.
                          </p>
                        </div>
                        
                        {/* Payment Setup Form */}
                        <div className="border-t pt-4">
                          <StripeProvider>
                            <PaymentSetupWrapper 
                              teamId={`temp-${Date.now()}`}
                              expectedAmount={parseFloat(calculateTotalAmount()) * 100}
                              teamName={teamForm.getValues().name}
                              eventName={event?.name || 'tournament'}
                              onSuccess={(setupIntentId, paymentMethodId) => {
                                console.log(`Setup intent created successfully: ${setupIntentId}, Payment method: ${paymentMethodId}`);
                                
                                teamForm.setValue('players', players);
                                
                                const allSelectedFeeIds = [
                                  ...(selectedFee ? [selectedFee.id] : []),
                                  ...requiredFees.map(fee => fee.id)
                                ];
                                
                                registerTeamMutation.mutate({
                                  ...teamForm.getValues(),
                                  selectedFeeIds: allSelectedFeeIds,
                                  totalAmount: parseFloat(calculateTotalAmount()) * 100,
                                  addRosterLater,
                                  setupIntentId,
                                  paymentMethodId,
                                  appliedCoupon: appliedCoupon
                                });
                              }}
                              onError={(error) => {
                                toast({
                                  title: "Payment Setup Error",
                                  description: error.message || "There was a problem setting up your payment method",
                                  variant: "destructive"
                                });
                              }}
                            />
                          </StripeProvider>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No payment required for this registration.</p>
                        <Button
                          onClick={() => {
                            teamForm.setValue('players', players);
                            registerTeamMutation.mutate({
                              ...teamForm.getValues(),
                              selectedFeeIds: [],
                              totalAmount: 0,
                              addRosterLater,
                              appliedCoupon: appliedCoupon
                            });
                          }}
                          disabled={registerTeamMutation.isPending}
                          className="text-white"
                          style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
                        >
                          {registerTeamMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting Registration...
                            </>
                          ) : (
                            'Complete Registration'
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Back Button */}
                <div className="flex justify-start pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('team')}
                  >
                    Back to Team Details
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 'success' && user && (
              <motion.div 
                key="success-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >
                  Registration Complete
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <p className="text-green-700 font-medium">Your team has been successfully registered for this event.</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    window.location.href = '/dashboard';
                  }}
                  className="text-white"
                  style={{ backgroundColor: event?.branding?.primaryColor || '#2C5282' }}
                >
                  Go to Dashboard
                </Button>
              </motion.div>
            )}

            {(currentStep === 'auth' || currentStep === 'personal') && (
              <motion.div
                key="event-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Event Dates</h3>
                    <p>{formatDateInEventTimezone(event.startDate, event.timezone)} - {formatDateInEventTimezone(event.endDate, event.timezone)}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Registration Deadline</h3>
                    <p>{formatDateInEventTimezone(event.applicationDeadline, event.timezone)}</p>
                  </div>
                </div>

                {event.ageGroups && event.ageGroups.length > 0 && (
                  <div className="space-y-2">
                    <h3 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Eligible Age Groups</h3>
                    {renderAgeGroups(event.ageGroups)}
                  </div>
                )}

                {event.details && (
                  <div className="space-y-2">
                    <h3 
                      className="font-semibold"
                      style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                    >Event Details</h3>
                    <div 
                      className="prose max-w-none prose-blue prose-p:text-gray-700" 
                      style={{ 
                        '--tw-prose-headings': event?.branding?.primaryColor || '#2C5282' 
                      } as React.CSSProperties}
                      dangerouslySetInnerHTML={{ __html: event.details }} 
                    />
                  </div>
                )}
              </motion.div>
            )}
            
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}