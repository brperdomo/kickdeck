import { useState, useMemo, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { formatPhoneNumber } from "@/utils/phone-formatter";
import { 
  Link2, X, Ticket, Plus, Mail, KeyRound, Check, RefreshCcw, UserMinus, RotateCcw, 
  Pencil, PlusCircle, CalendarRange, UserRoundPlus, ClipboardX, ArrowLeft,
  Upload, Wand2, Sparkles, AlertTriangle, CalendarDays, Loader2,
  Trophy, WandSparkles, CheckCircle2, AlertCircle, CreditCard, MapPin,
  TrendingUp, BarChart2, HelpCircle, Eye, Clock, Download
} from "lucide-react";
// Removed ClubLogo import as we now display club name as text
import { ComplexCard } from "@/components/admin/ComplexCard";
import { formatAddress } from "@/lib/format-address";
import { EventsTable } from "@/components/events/EventsTable";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";
import EmulationManager from "@/components/admin/EmulationManager";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatedSidebar } from "@/components/admin/AnimatedSidebar";
import { AnimatedNavigationButton } from "@/components/admin/AnimatedNavigationButton";
import { AnimatedContainer, AnimatedList, AnimatedItem, AnimatedContent } from "@/components/ui/animation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TeamModal } from "@/components/teams/TeamModal";
import { TeamCsvUploader } from "@/components/teams/TeamCsvUploader";
import { FormSubmissionsCard } from "@/components/admin/FormSubmissionsCard";
import { FeeAdjustmentDialog } from "@/components/admin/FeeAdjustmentDialog";
import { TeamContactEditDialog } from "@/components/TeamContactEditDialog";
import { BracketAssignmentModal } from "@/components/BracketAssignmentModal";
import { PaymentRetryButton } from "@/components/admin/PaymentRetryButton";
import { ScheduleVisualization } from "@/components/ScheduleVisualization";
import BracketSelector from "@/components/admin/scheduling/BracketSelector";
import { SchedulingWorkflow } from "@/components/admin/scheduling/SchedulingWorkflow";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentStatusBadge, TeamStatusBadge } from "@/components/ui/payment-status-badge";
import { PaymentMethodDisplay, PaymentStatusLegend } from "@/components/ui/payment-method-display";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox as CheckboxComponent } from "@/components/ui/checkbox";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";
import { useTournamentDirector } from "@/hooks/use-tournament-director";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { PermissionGuard } from "@/components/admin/PermissionGuard";

// Format currency values in dollars with 2 decimal places
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  // Convert cents to dollars and format with 2 decimal places
  return `$${(amount / 100).toFixed(2)}`;
}

// Helper function to get the roster count display value
function getRosterCount(team: any): string {
  if (!team) {
    return '0';
  }
  
  // Handle nested team structure (item.team or direct item)
  const teamData = team.team || team;
  
  // Check for playerCount directly from API
  if (typeof teamData.playerCount === 'number') {
    return teamData.playerCount.toString();
  }
  
  // Check if players array exists and has length
  if (teamData.players && Array.isArray(teamData.players)) {
    return teamData.players.length.toString();
  }
  
  // Check for playerCount on the original team object as well
  if (typeof team.playerCount === 'number') {
    return team.playerCount.toString();
  }
  
  return '0';
}



import {
  Calendar,
  Shield,
  UserPlus,
  Home,
  LogOut,
  User,
  UserRound,
  Palette,
  ChevronRight,
  Search,
  ClipboardList,
  MoreHorizontal,
  Building2,
  MessageSquare,
  DollarSign,
  Settings,
  Users,
  ChevronDown,
  Edit,
  Eye,
  UserCircle,
  Percent,
  Printer,
  Flag,
  ImageIcon,
  FormInput,
  Bell,
  Moon,
  Sun,
  Trash2,
  FileText,
  FileText,
  Trash,
  CalendarIcon,
  Map,
  Download,
  FileUp,
  Filter,
  ListFilter,
  ListChecks,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { BrandingPreviewProvider, useBrandingPreview } from "@/hooks/use-branding-preview";
import { BrandingPreview } from "@/components/BrandingPreview";
import { DetailedFeeBreakdown } from "@/components/teams/DetailedFeeBreakdown";
import { useExportProcess } from "@/hooks/use-export-process";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/ui/motion-card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectSeparator,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminModal } from "@/components/admin/AdminModal";
import { ComplexEditor } from "@/components/ComplexEditor";
import { FieldEditor } from "@/components/FieldEditor";
import { UpdatesLogModal } from "@/components/admin/UpdatesLogModal";
import { useDropzone } from 'react-dropzone';
import { FileManager } from "@/components/admin/FileManager.tsx";
import Members from "@/components/admin/Members";
import { FormTemplatesView } from "@/components/admin/FormTemplatesView";
import { FormSubmissionsReport } from "@/pages/FormSubmissionsReport"; // Import the component
import { AccountingCodeModal } from "@/components/admin/AccountingCodeModal";
import FormTemplateEditPage from "@/pages/form-template-edit";
import FormTemplateCreatePage from "@/pages/form-template-create";
import { InternalOperationsPanel } from "@/components/admin/InternalOperationsPanel"; // Added import
import { StripeSettingsView } from "@/components/admin/StripeSettingsView"; // Added import
import RolePermissionsManager from "@/components/admin/RolePermissionsManager"; // Added import
import { AdminBanner } from "@/components/admin/AdminBanner"; // Import the AdminBanner component
import { NewRegistrationsBanner } from "@/components/admin/NewRegistrationsBanner"; // Import the notification banner
import { Toggle } from '@/components/ui/toggle';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// CSV Uploader Component
function CsvUploader({ onUploadSuccess, teamId }: { onUploadSuccess: (players: any[]) => void, teamId: number }) {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };

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
      formData.append('teamId', teamId.toString());

      const response = await fetch('/api/upload/csv-admin', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const data = await response.json();
      
      onUploadSuccess(data.players);
      setFile(null);
      
      toast({
        title: "Upload Successful",
        description: `Added ${data.players.length} players to the team.`,
      });
    } catch (error: any) {
      setError(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
            onClick={() => setFile(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setFile(null);
            setError(null);
          }}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          disabled={!file || isUploading} 
          onClick={uploadFile}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


function EmulationStatus() {
  // Check if we're in emulation mode
  const isEmulating = typeof window !== 'undefined' && !!localStorage.getItem('emulationToken');
  const emulatedName = typeof window !== 'undefined' ? sessionStorage.getItem('emulatedAdminName') : null;
  
  if (!isEmulating) return null;
  
  return (
    <div className="w-full bg-red-100 border-b border-red-300 py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 h-5 w-5 mr-2" />
            <p className="text-red-800 font-medium">
              <span className="font-bold">EMULATION MODE:</span> 
              {emulatedName ? ` Viewing as ${emulatedName}` : ' Viewing as another administrator'}
            </p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              // Remove emulation
              localStorage.removeItem('emulationToken');
              sessionStorage.removeItem('emulationActive');
              sessionStorage.removeItem('emulatedAdminName');
              // Redirect to admin page to reset
              window.location.href = '/admin';
            }}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Exit Emulation
          </Button>
        </div>
      </div>
    </div>
  );
}

function LogoBanner() {
  const { settings } = useOrganizationSettings();

  return (
    <div className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
      <EmulationStatus />
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-center items-center">
          <img
            src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
            alt="Organization Logo"
            className="w-auto h-48 md:h-60 max-w-[840px] md:max-w-[960px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

const MyAccount = lazy(() => import("./my-account"));

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'files' | 'formTemplates' | 'formSubmissions' | 'roles' | 'members';
type SettingsView = 'general';
type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';
type RoleType = 'super_admin' | 'tournament_admin' | 'score_admin' | 'finance_admin';

function EventsView() {
  const navigate = useLocation()[1];
  return (
    <div className="space-y-6">
      <AnimatedContainer animation="slideUp" delay={0.1}>
        <div className="flex justify-between items-center">
          <motion.h2 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >Events</motion.h2>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate("/admin/events/create")} className="event-create-button">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedContainer>
      <AnimatedContainer animation="fadeIn" delay={0.3}>
        <EventsTable />
      </AnimatedContainer>
    </div>
  );
}

interface RoleGroup {
  [key: string]: any[];
  super_admin: any[];
  tournament_admin: any[];
  score_admin: any[];
  finance_admin: any[];
}

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  openTime: string;
  closeTime: string;
  rules?: string;
  directions?: string;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  openFields: number;
  closedFields: number;
}

interface ComplexFormValues {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  openTime: string;
  closeTime: string;
  rules?: string;
  directions?: string;
  isOpen: boolean;
}

interface Field {
  id: number;
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
  specialInstructions?: string;
  complexId: number;
}

interface FieldFormValues {
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
  specialInstructions?: string;
}

function AdministratorsView() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("super_admin");
  const [selectedAdmin, setSelectedAdmin] = useState<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null>(null);
  const queryClient = useQueryClient();

  const administratorsQuery = useQuery({
    queryKey: ['/api/admin/administrators'],
    queryFn: async () => {
      const response = await fetch('/api/admin/administrators', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch administrators');
      return response.json();
    }
  });

  // Store unique administrators and manage by roles
  const administrators = useMemo(() => {
    if (!administratorsQuery.data) {
      return {
        super_admin: [],
        tournament_admin: [],
        score_admin: [],
        finance_admin: [],
        uniqueAdmins: {} // Object to store unique admins by ID
      };
    }

    // Log the full administrator data to console for debugging
    console.log("Full administrator data:", administratorsQuery.data);

    // First create a map of unique administrators by ID
    const uniqueAdminsMap: Record<number, any> = {};
    
    // Process each administrator into our map
    administratorsQuery.data.forEach((admin: any) => {
      // If we've already stored this admin, don't overwrite, just merge their roles
      if (uniqueAdminsMap[admin.id]) {
        // Make sure we have a roles array
        let existingRoles = uniqueAdminsMap[admin.id].roles || [];
        let newRoles = (admin.roles && Array.isArray(admin.roles)) 
          ? admin.roles.filter((role: any) => role !== null) 
          : [];
        
        // Merge roles arrays and remove duplicates
        uniqueAdminsMap[admin.id].roles = Array.from(new Set([...existingRoles, ...newRoles]));
      } else {
        // If this is a new admin, add them to our map
        const roles = (admin.roles && Array.isArray(admin.roles)) 
          ? admin.roles.filter((role: any) => role !== null) 
          : [];
        
        uniqueAdminsMap[admin.id] = {
          ...admin,
          roles: roles
        };
      }
    });
    
    // Now create the role-specific arrays using our map of unique admins
    const groupedAdmins: RoleGroup & { uniqueAdmins: Record<number, any> } = {
      super_admin: [],
      tournament_admin: [],
      score_admin: [],
      finance_admin: [],
      uniqueAdmins: uniqueAdminsMap
    };
    
    // Sort admins into role-specific arrays
    Object.values(uniqueAdminsMap).forEach((admin: any) => {
      if (!admin.roles || admin.roles.length === 0) {
        // If admin has no roles but is marked as admin, add as super_admin
        if (admin.isAdmin) {
          admin.roles = ['super_admin'];
          if (!groupedAdmins.super_admin.includes(admin.id)) {
            groupedAdmins.super_admin.push(admin.id);
          }
        }
      } else {
        // Add to each role-specific array based on their roles
        admin.roles.forEach((role: string) => {
          if (role in groupedAdmins && role !== 'uniqueAdmins') {
            if (!groupedAdmins[role].includes(admin.id)) {
              groupedAdmins[role].push(admin.id);
            }
          }
        });
      }
    });

    return groupedAdmins;
  }, [administratorsQuery.data]);

  const handleEditAdmin = (admin: any) => {
    setSelectedAdmin({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      roles: admin.roles || [],
    });
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setSelectedAdmin(null);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'tournament_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'score_admin':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finance_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper function for payment status badges
  const getPaymentStatusBadge = (status: string | null | undefined) => {
    const variant = 
      status === 'paid' ? 'success' :
      status === 'refunded' ? 'outline' :
      status === 'failed' ? 'destructive' :
      'secondary';
      
    const label = status 
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : 'Pending';
      
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'Super Admin';
      case 'tournament_admin':
        return 'Tournament Admin';
      case 'score_admin':
        return 'Score Admin';
      case 'finance_admin':
        return 'Finance Admin';
      default:
        return 'Unknown Type';
    }
  };

  const updateAdminMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
    }) => {
      const response = await fetch(`/api/admin/administrators/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update administrator');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['/api/admin/administrators']);
      toast({
        title: "Success",
        description: "Administrator updated successfully",
        variant: "default"
      });
      setIsAddModalOpen(false);
      setSelectedAdmin(null);
    },
    onError: (error: Error) => {
      const errorMessage = error.message;

      // Provide specific error messages based on error codes
      if (errorMessage.includes("LAST_SUPER_ADMIN")) {
        toast({
          title: "Cannot Update Role",
          description: "You cannot remove the super_admin role from the last super administrator",
          variant: "destructive"
        });
      } else if (errorMessage.includes("EMAIL_EXISTS")) {
        toast({
          title: "Email Already Exists",
          description: "The email address is already registered",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage || "Failed to update administrator",
          variant: "destructive"
        });
      }
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/admin/administrators/${adminId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete administrator');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/administrators']);
      toast({
        title: 'Success',
        description: 'Administrator deleted successfully',
        variant: 'success'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete administrator',
        variant: 'destructive'
      });
    }
  });


  if (administratorsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatedContainer animation="slideUp" delay={0.1}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Administrators</h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setIsAddModalOpen(true)} className="admin-create-button">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Administrator
            </Button>
          </motion.div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer animation="fadeIn" delay={0.3}>
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4 gap-4">
            <TabsTrigger
              value="super_admin"
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900"
            >
              <Shield className="mr-2 h-4 w-4" />
              Super Admins
            </TabsTrigger>
            <TabsTrigger
              value="tournament_admin"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Tournament Admins
            </TabsTrigger>
            <TabsTrigger
              value="score_admin"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Score Admins
            </TabsTrigger>
            <TabsTrigger
              value="finance_admin"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Finance Admins
            </TabsTrigger>
          </TabsList>

          {Object.entries(administrators)
            .filter(([type]) => type !== "uniqueAdmins") 
            .map(([type, adminIds]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <AnimatedContainer animation="fadeIn" delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {getTypeLabel(type)}
                      <Badge className={`ml-2 ${getBadgeColor(type)}`}>
                        {Array.isArray(adminIds) ? adminIds.length : 0} Members
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden border rounded-md admin-list">
                      <Table className="border-collapse admin-list">
                        <TableHeader className="bg-muted/50">
                          <TableRow className="border-b">
                            <TableHead className="py-3 px-4">Name</TableHead>
                            <TableHead className="py-3 px-4">Email</TableHead>
                            <TableHead className="py-3 px-4">Roles</TableHead>
                            <TableHead className="py-3 px-4">Status</TableHead>
                            <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(adminIds) && adminIds.map((adminId: number) => {
                            const admin = administrators.uniqueAdmins[adminId];
                            if (!admin) return null;
                            
                            return (
                              <TableRow key={admin.id} className="border-b hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium p-4">
                                  {admin.firstName} {admin.lastName}
                                </TableCell>
                                <TableCell className="p-4">{admin.email}</TableCell>
                                <TableCell className="p-4">
                                  {admin.roles?.map((role: string) => (
                                    <Badge key={role} variant="outline" className="mr-1">
                                      {role}
                                    </Badge>
                                  ))}
                                </TableCell>
                                <TableCell className="p-4">
                                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                                    Active
                                  </Badge>
                                </TableCell>
                                <TableCell className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="admin-edit-button">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => deleteAdminMutation.mutate(admin.id)}
                                          disabled={deleteAdminMutation.isPending}
                                          className="text-red-600 admin-delete-button"
                                        >
                                          <Trash className="mr-2 h-4 w-4" />
                                          Remove
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            </TabsContent>
          ))}
        </Tabs>
      </AnimatedContainer>

      <AdminModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        admin={selectedAdmin}
      />
    </>
  );
}

function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('financial');
  const [selectedFinancialReport, setSelectedFinancialReport] = useState<string>('accounting-codes');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const { isExporting, startExport } = useExportProcess();
  const navigate = useLocation()[1];
  const [isAccountingCodeModalOpen, setIsAccountingCodeModalOpen] = useState(false);
  const [selectedAccountingCode, setSelectedAccountingCode] = useState<{
    id: number;
    code: string;
    name: string;
    description?: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // Fetch events for the event selector
  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const accountingCodesQuery = useQuery({
    queryKey: ['/api/admin/accounting-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    }
  });

  const deleteAccountingCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/accounting-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to delete accounting code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/accounting-codes']);
      toast({
        title: "Success",
        description: "Accounting code deleted successfully",
        variant: "success"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete accounting code",
        variant: "destructive"
      });
    }
  });

  const handleEditCode = (code: typeof selectedAccountingCode) => {
    setSelectedAccountingCode(code);
    setIsAccountingCodeModalOpen(true);
  };

  const handleDeleteCode = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this accounting code?')) {
      await deleteAccountingCodeMutation.mutateAsync(id);
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'financial':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Financial Management</h3>
                <select 
                  className="border rounded px-2 py-1"
                  value={selectedFinancialReport}
                  onChange={(e) => setSelectedFinancialReport(e.target.value)}
                >
                  <option value="accounting-codes">Accounting Codes</option>
                  <option value="registration-orders">Registration Orders</option>
                  <option value="payment-logs">Payment Logs</option>
                  <option value="financial-overview">Financial Overview</option>
                  <option value="fees-analysis">Fees Analysis</option>
                  <option value="bookkeeping">Bookkeeping Report</option>
                  <option value="revenue-forecast">Revenue Forecast</option>
                  <option value="fees-by-event">Fees by Event</option>
                  <option value="fees-by-age-group">Fees by Age Group</option>
                </select>
              </div>
              <div className="flex gap-2">
                {selectedFinancialReport === 'accounting-codes' && (
                  <Button onClick={() => setIsAccountingCodeModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Accounting Code
                  </Button>
                )}
                <Button
                  onClick={() => startExport('financial')}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Accounting Codes Table */}
            {selectedFinancialReport === 'accounting-codes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Accounting Codes</CardTitle>
                </CardHeader>
                <CardContent>
                {accountingCodesQuery.isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : accountingCodesQuery.isError ? (
                  <div className="text-center text-red-500">
                    Error loading accounting codes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountingCodesQuery.data?.map((code: any) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-medium">{code.code}</TableCell>
                          <TableCell>{code.name}</TableCell>
                          <TableCell>{code.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCode(code)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCode(code.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </CardContent>
              </Card>
            )}
            {selectedFinancialReport === 'fees-by-event' && (
              <Card>
                <CardHeader>
                  <CardTitle>Fees by Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    Event fees report coming soon
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedFinancialReport === 'fees-by-age-group' && (
              <Card>
                <CardHeader>
                  <CardTitle>Fees by Age Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    Age group fees report coming soon
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedFinancialReport === 'registration-orders' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Registration Orders Report</CardTitle>
                    <CardDescription>View and manage all payment transactions for team registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center py-4">
                      <Button onClick={() => navigate('/registration-orders-report')} className="space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Open Registration Orders Report</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedFinancialReport === 'payment-logs' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Payment Logs</CardTitle>
                    <CardDescription>Monitor detailed payment transaction logs including failures and error information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center py-4">
                      <Button onClick={() => navigate('/payment-logs')} className="space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Open Payment Logs</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedFinancialReport === 'financial-overview' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Financial Overview Report</CardTitle>
                    <CardDescription>Comprehensive analysis of your financial performance across all events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center py-4">
                      <Button onClick={() => navigate('/financial-overview-report')} className="space-x-2">
                        <BarChart2 className="w-4 h-4" />
                        <span>Open Financial Overview</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedFinancialReport === 'fees-analysis' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Fees Analysis Report</CardTitle>
                    <CardDescription>Analyze fee structure effectiveness and performance across events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center py-4">
                      <Button onClick={() => navigate('/fees-analysis-report')} className="space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Open Fees Analysis</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedFinancialReport === 'bookkeeping' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Bookkeeping Report</CardTitle>
                    <CardDescription>Comprehensive financial data for accounting and bookkeeping purposes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This report provides detailed financial information for bookkeeping, including:
                      </p>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        <li>Teams registered by date range with gross/net amounts</li>
                        <li>Stripe fees and settlement dates</li>
                        <li>Detailed reports for refunds, chargebacks, and pending payments</li>
                        <li>Export options for accounting software integration</li>
                      </ul>
                      <div className="flex justify-center items-center py-4">
                        <Button onClick={() => navigate('/bookkeeping-report')} className="space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Open Bookkeeping Report</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedFinancialReport === 'revenue-forecast' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Revenue Forecast</CardTitle>
                    <CardDescription>Track captured transactions and forecast future revenue from your "collect now, charge later" flow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This report shows revenue forecasting based on your setup intent payment flow:
                      </p>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        <li>Captured payment methods ready to charge</li>
                        <li>Pending team approvals and potential revenue</li>
                        <li>Forecasted total revenue with fee estimates</li>
                        <li>Event-based filtering and breakdown</li>
                      </ul>
                      <div className="flex justify-center items-center py-4">
                        <Button onClick={() => navigate('/revenue-forecast')} className="space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Open Revenue Forecast</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
      case 'manager':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manager Reports</h3>
              <Button
                onClick={() => selectedEvent !== 'all' ? startExport('manager', selectedEvent) : null}
                disabled={isExporting === 'manager' || selectedEvent === 'all'}
              >
                {isExporting === 'manager' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Team and Coaching Staff Export</h4>
                      <p className="text-sm text-muted-foreground">Export team information including coach and manager contact details</p>
                    </div>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select Event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {eventsQuery.data?.map((event: any) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedEvent === 'all' ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Select an Event</AlertTitle>
                      <AlertDescription>
                        Please select a specific event to export manager reports.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-lg border p-4 bg-muted/5">
                      <h5 className="font-medium mb-2">CSV Export Includes:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Team Name</li>
                        <li>• Coach Name, Email & Phone</li>
                        <li>• Manager Name, Email & Phone</li>
                        <li>• Level of Play Desired (Flight)</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">
                        Only approved teams will be included in the export.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Player Reports</h3>
              <Button
                onClick={() => startExport('player')}
                disabled={isExporting !== 'player'}
              >
                {isExporting === 'player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Player report content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Schedule Reports</h3>
              <Button
                onClick={() => startExport('schedule')}
                disabled={isExporting !== 'schedule'}
              >
                {isExporting === 'schedule' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Schedule report content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'guest-player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Guest Player Reports</h3>
              <Button
                onClick={() => startExport('guest-player')}
                disabled={isExporting !== 'guest-player'}
              >
                {isExporting === 'guest-player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Guest player report content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports and Financials</h2>
      </div>

      <div className="grid grid-cols-4 gap-6" data-section="reports">
        {/* Report Navigation */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Button
                variant={selectedReport === 'financial' ? 'secondary' : 'ghost'}
                data-variant={selectedReport === 'financial' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('financial')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Financial Reports
              </Button>
              <Button
                variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                data-variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('manager')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manager Reports
              </Button>
              <Button
                variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                data-variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('player')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Player Reports
              </Button>
              <Button
                variant={selectedReport === 'schedule' ? 'secondary' : 'ghost'}
                data-variant={selectedReport === 'schedule' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('schedule')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Schedule Reports
              </Button>
              <Button
                variant={selectedReport === 'guest-player' ? 'secondary' : 'ghost'}
                data-variant={selectedReport === 'guest-player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('guest-player')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Guest Player Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="col-span-3">
          {renderReportContent()}
        </div>
      </div>

      <AccountingCodeModal
        open={isAccountingCodeModalOpen}
        onOpenChange={setIsAccountingCodeModalOpen}
        codeToEdit={selectedAccountingCode}
      />
    </>
  );
}

function BrandingPreviewCard() {
  const { preview } = useBrandingPreview();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <BrandingPreview
          logoUrl={preview.logoUrl}
          primaryColor={preview.primaryColor}
          secondaryColor={preview.secondaryColor}
        />
      </CardContent>
    </Card>
  );
}

// Add type for organization settings
interface OrganizationSettings {
  id: number;
  name: string;
  createdAt: string;
  primaryColor: string;
  secondaryColor: string | null;
  logoUrl: string | null;
  updatedAt: string;
}

function OrganizationSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useOrganizationSettings<OrganizationSettings>();
  const { updatePreview } = useBrandingPreview();
  const [name, setName] = useState(settings?.name || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor || '#ffffff');
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(settings?.logoUrl);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview the uploaded image
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLogo(file);

    try {
      // Import Vibrant using dynamic import
      const Vibrant = (await import('node-vibrant')).default;

      // Create new Vibrant instance
      const v = new Vibrant(objectUrl);

      //      // Get the palette with error handling
      const palette = await v.getPalette();      // Set primary color from the Vibrant swatch
      if (palette.Vibrant) {        setPrimaryColor(palette.Vibrant.hex);
console.log('Primarycolor extracted:', palette.Vibrant.hex);
      }

      // Set secondary color from theLightVibrant or Muted swatch
      if (palette.LightVibrant) {
        setSecondaryColor(palette.LightVibrant.hex);
        console.log('Secondary color (Light Vibrant) extracted:', palette.LightVibrant.hex);
      } else if (palette.Muted) {
        setSecondaryColor(palette.Muted.hex);
        console.log('Secondary color (Muted) extracted:', palette.Muted.hex);
      }

      // Update the preview
      updatePreview({
        logoUrl: objectUrl,
        primaryColor: palette.Vibrant?.hex || primaryColor,
        secondaryColor: palette.LightVibrant?.hex || palette.Muted?.hex || secondaryColor,
      });

      toast({
        title: "Colors extracted",
        description: "Brand colors have been updated based on your logo.",
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      toast({
        title: "Error",
        description: "Failed to extract colors from the logo. Please try a different image.",
        variant: "destructive",
      });
    }
  }, [primaryColor, secondaryColor, updatePreview, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      if (logo) {
        formData.append('logo', logo);
      }

      await updateSettings.mutateAsync(formData);

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
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
    <div className="grid grid-cols-2 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Organization Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Organization logo"
                    className="h-20 w-20 object-contain"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground text-center">
                  {isDragActive
                    ? "Drop the logo here"
                    : "Drag & drop your logo here, or click to select"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <BrandingPreview />
    </div>
  );
}

function ComplexesView() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const queryClient = useQueryClient();

  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/fields', viewingComplexId],
    enabled: !!viewingComplexId,
    queryFn: async () => {
      if (!viewingComplexId) return [];
      const response = await fetch(`/api/admin/complexes/${viewingComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  const createComplexMutation = useMutation({
    mutationFn: async (data: ComplexFormValues) => {
      const response = await fetch('/api/admin/complexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create complex');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/complexes']);
      toast({
        title: "Success",
        description: "Complex created successfully",
      });
      setIsAddModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create complex",
        variant: "destructive",
      });
    },
  });

  const updateComplexMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ComplexFormValues }) => {
      const response = await fetch(`/api/admin/complexes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          openTime: data.openTime,
          closeTime: data.closeTime,
          rules: data.rules || null,
          directions: data.directions || null,
          isOpen: data.isOpen
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update complex');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/complexes'] });
      toast({
        title: "Success",
        description: "Complex updated successfully",
      });
      setIsAddModalOpen(false);
      setSelectedComplex(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update complex",
        variant: "destructive",
      });
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async ({ complexId, data }: { complexId: number; data: FieldFormValues }) => {
      const response = await fetch(`/api/admin/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, complexId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fields', viewingComplexId] });
      toast({
        title: "Success",
        description: "Field created successfully",
      });
      setIsFieldModalOpen(false);
      setSelectedField(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create field",
        variant: "destructive",
      });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ complexId, fieldId, data }: { complexId: number; fieldId: number; data: FieldFormValues }) => {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fields', viewingComplexId] });
      toast({
        title: "Success",
        description: "Field updated successfully",
      });
      setIsFieldModalOpen(false);
      setSelectedField(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message: "Failed to update field",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (data: ComplexFormValues) => {
    try {
      if (selectedComplex) {
        await updateComplexMutation.mutateAsync({ id: selectedComplex.id, data });
      } else {
        await createComplexMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error submitting complex:', error);
    }
  };

  const handleFieldSubmit = async (data: FieldFormValues) => {
    if (!viewingComplexId) return;

    try {
      if (selectedField) {
        await updateFieldMutation.mutateAsync({
          complexId: viewingComplexId,
          fieldId: selectedField.id,
          data
        });
      } else {
        await createFieldMutation.mutateAsync({
          complexId: viewingComplexId,
          data
        });
      }
    } catch (error) {
      console.error('Error submitting field:', error);
    }
  };

  const handleViewFields = (complexId: number) => {
    setViewingComplexId(complexId);
  };

  const handleEditComplex = (complex: Complex) => {
    setSelectedComplex(complex);
    setIsAddModalOpen(true);
  };

  const handleAddField = () => {
    setSelectedField(null);
    setIsFieldModalOpen(true);
  };

  const handleEditField = (field: Field) => {
    setSelectedField(field);
    setIsFieldModalOpen(true);
  };

  // Delete mutations
  const deleteComplexMutation = useMutation({
    mutationFn: async (complexId: number) => {
      const response = await fetch(`/api/admin/complexes/${complexId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete complex');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/complexes'] });
      toast({
        title: "Success",
        description: "Complex and all associated fields deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete complex",
        variant: "destructive",
      });
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fields', viewingComplexId] });
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete field",
        variant: "destructive",
      });
    }
  });

  const handleDeleteComplex = async (complexId: number) => {
    if (window.confirm('Are you sure you want to delete this complex? This will also delete all associated fields and cannot be undone.')) {
      await deleteComplexMutation.mutateAsync(complexId);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (window.confirm('Are you sure you want to delete this field? This cannot be undone.')) {
      await deleteFieldMutation.mutateAsync(fieldId);
    }
  };

  if (complexesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Field Complexes</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Complex
        </Button>
      </div>

      <div className="grid gap-6">
        {complexesQuery.data?.map((complex: Complex) => (
          <ComplexCard 
            key={complex.id} 
            complex={complex} 
            onEditComplex={handleEditComplex} 
            onDeleteComplex={handleDeleteComplex}
            onViewFields={handleViewFields}
            isViewingFields={viewingComplexId === complex.id}
            onAddField={viewingComplexId === complex.id ? handleAddField : undefined}
            fields={viewingComplexId === complex.id ? fieldsQuery.data || [] : []}
            fieldsLoading={fieldsQuery.isLoading && viewingComplexId === complex.id}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
          />
        ))}
      </div>

      <ComplexEditor
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleSubmit}
        complex={selectedComplex}
      />

      {viewingComplexId && (
        <FieldEditor
          open={isFieldModalOpen}
          onOpenChange={setIsFieldModalOpen}
          onSubmit={handleFieldSubmit}
          field={selectedField}
          complexId={viewingComplexId}
        />
      )}
    </>
  );
}

// Using the simpler EventsView implementation from line 126

import { ClientManagementView } from "@/components/admin/ClientManagementView";

function HouseholdsView() {
  return <ClientManagementView />;
}

function SchedulingView() {
  const permissionsHook = usePermissions();
  const canEditSchedule = permissionsHook.hasPermission("edit_schedule");
  const canDeleteGames = permissionsHook.hasPermission("edit_schedule"); // Using edit_schedule permission for game deletion
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  // AI scheduling moved to Master Schedule component
  const [bracketAssignmentModalOpen, setBracketAssignmentModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSuggestingBrackets, setIsSuggestingBrackets] = useState(false);
  const [scheduleQuality, setScheduleQuality] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [bracketSuggestions, setBracketSuggestions] = useState<any[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedBrackets, setSelectedBrackets] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewGames, setPreviewGames] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Mock data until we implement the backend
  const mockGames: any[] = [];
  const mockAgeGroups: any[] = [];
  
  // Fetch events for dropdown - using import-eligible-events to show all upcoming events
  const eventsQuery = useQuery({
    queryKey: ['admin', 'import-eligible-events', 'scheduling'],
    queryFn: async () => {
      const response = await fetch('/api/admin/import-eligible-events', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch eligible events');
      const data = await response.json();
      
      // Ensure we handle different response formats and always return an array
      if (Array.isArray(data)) {
        // Filter for active or upcoming events for scheduling
        return data.filter((event: any) => {
          const eventEndDate = new Date(event.endDate);
          return eventEndDate >= new Date(); // Only include events that haven't ended yet
        });
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.events)) {
          // Filter for active or upcoming events for scheduling
          return data.events.filter((event: any) => {
            const eventEndDate = new Date(event.endDate);
            return eventEndDate >= new Date(); // Only include events that haven't ended yet
          });
        } else {
          console.warn('Events data is not in expected format:', data);
          return [];
        }
      } else {
        console.warn('Unexpected events data format:', data);
        return [];
      }
    }
  });
  
  // Fetch games for selected event
  const gamesQuery = useQuery({
    queryKey: ['admin', 'games', selectedEvent, format(selectedDate, 'yyyy-MM-dd'), selectedAgeGroup],
    queryFn: async () => {
      if (!selectedEvent) return { games: [], ageGroups: [] };
      
      // Fetch from the backend API
      try {
        const response = await fetch(`/api/admin/events/${selectedEvent}/schedule`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedule data');
        }
        const scheduleData = await response.json();
        
        // Fetch age groups for this event
        const ageGroupsResponse = await fetch(`/api/admin/events/${selectedEvent}/age-groups`);
        if (!ageGroupsResponse.ok) {
          throw new Error('Failed to fetch age groups');
        }
        const ageGroupsData = await ageGroupsResponse.json();
        
        // Format the games data for the ScheduleVisualization component
        // Handle both old and new data formats
        const formattedGames = scheduleData.games.map((game: any) => {
          // Enhanced format (new format has homeTeam as an object)
          if (typeof game.homeTeam === 'object') {
            return {
              id: game.id.toString(),
              homeTeam: {
                id: game.homeTeam?.id || 0,
                name: game.homeTeam?.name || 'TBD',
                coach: game.homeTeam?.coach || '',
                clubName: game.homeTeam?.clubName || '',
                status: game.homeTeam?.status || 'approved'
              },
              awayTeam: {
                id: game.awayTeam?.id || 0,
                name: game.awayTeam?.name || 'TBD',
                coach: game.awayTeam?.coach || '',
                clubName: game.awayTeam?.clubName || '',
                status: game.awayTeam?.status || 'approved'
              },
              field: game.fieldName || '',
              complexName: game.complexName || 'Unknown',
              complexId: game.complexId || 0,
              fieldId: game.fieldId || 0,
              startTime: game.startTime,
              endTime: game.endTime,
              status: game.status || 'scheduled',
              ageGroup: game.ageGroup || 'Unknown',
              ageGroupId: game.ageGroupId || 0,
              bracket: game.bracket?.name || 'Default',
              bracketId: game.bracket?.id || 0,
              round: game.round || 'Group Stage'
            };
          }
          
          // Legacy format
          return {
            id: game.id.toString(),
            homeTeam: {
              id: 0,
              name: game.homeTeam || 'TBD',
              coach: '',
              status: 'approved'
            },
            awayTeam: {
              id: 0,
              name: game.awayTeam || 'TBD',
              coach: '',
              status: 'approved'
            },
            field: game.fieldName || '',
            complexName: 'Unknown',
            startTime: game.startTime,
            endTime: game.endTime,
            status: game.status || 'scheduled',
            ageGroup: game.ageGroup || 'Unknown',
            bracket: 'Default',
            round: 'Group Stage'
          };
        });
        
        // Format age groups for dropdown
        const formattedAgeGroups = ageGroupsData.map((ag: any) => ag.ageGroup);
        
        return { 
          games: formattedGames, 
          ageGroups: formattedAgeGroups 
        };
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        // Return empty data on error
        return { games: [], ageGroups: [] };
      }
    },
    enabled: !!selectedEvent
  });
  
  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete game: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'games', selectedEvent] });
      toast({
        title: "Success",
        description: "Game deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting game:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete game",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle game deletion
  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGameMutation.mutateAsync(gameId);
    } catch (error) {
      // Error is handled in the mutation's onError
    }
  };
  
  // Bulk delete games mutation
  const bulkDeleteGamesMutation = useMutation({
    mutationFn: async (gameIds: string[]) => {
      const response = await fetch(`/api/admin/games/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete games: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'games', selectedEvent] });
      toast({
        title: "Success",
        description: `${data.deletedCount || 'Multiple'} games deleted successfully`,
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error bulk deleting games:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete games",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle bulk game deletion
  const handleBulkDeleteGames = async (gameIds: string[]) => {
    try {
      await bulkDeleteGamesMutation.mutateAsync(gameIds);
    } catch (error) {
      // Error is handled in the mutation's onError
    }
  };
  
  // Helper function to validate workflow completion before allowing schedule generation
  const validateWorkflowCompletion = async (eventId: string): Promise<boolean> => {
    try {
      // Check if game metadata exists
      const metadataResponse = await fetch(`/api/admin/events/${eventId}/game-metadata`);
      if (!metadataResponse.ok) {
        return false;
      }
      
      const metadataData = await metadataResponse.json();
      if (!metadataData || !metadataData.gameFormats || metadataData.gameFormats.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Function to show workflow validation error and guide user
  const showWorkflowValidationError = () => {
    toast({
      title: "Complete Workflow Steps First",
      description: "Schedule generation requires completing the sequential workflow. Click 'Scheduling System' in the sidebar to set up game metadata, flights, and brackets first.",
      variant: "destructive",
      duration: 8000
    });
  };

  // AI scheduling functionality moved to Master Schedule component
  const queryClient = useQueryClient();
  
  // Function to optimize existing schedule
  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      if (!selectedEvent) {
        throw new Error("No event selected");
      }
      
      // Call the actual API endpoint
      const response = await fetch(`/api/admin/events/${selectedEvent}/optimize-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolveCoachConflicts: true,
          optimizeFieldUsage: true,
          minimizeTravel: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to optimize schedule: ${response.status}`);
      }
      
      // Parse the API response
      const data = await response.json();
      console.log('Schedule optimization response:', data);
      
      // Update state with optimized data
      setScheduleQuality(data.qualityScore || 95);
      setConflicts(data.conflicts || []);
      
      // Refresh games data
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule', selectedEvent] });
      
      toast({
        title: "Success",
        description: `Schedule optimized successfully! Quality improved to ${data.qualityScore || 'N/A'}/100.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to optimize schedule",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };
  
  // State for tracking if we're using fallback mode for bracket suggestions
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);

  // Function to suggest bracket assignments using AI
  const suggestBracketAssignments = async () => {
    if (!selectedEvent) {
      toast({
        title: "No Event Selected",
        description: "Please select an event first",
        variant: "destructive",
      });
      return;
    }
    
    setIsSuggestingBrackets(true);
    setBracketAssignmentModalOpen(true);
    setUsingFallbackMode(false); // Reset fallback mode state
    
    try {
      // Call API to get bracket suggestions
      const response = await fetch(`/api/admin/events/${selectedEvent}/suggest-bracket-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get bracket suggestions: ${response.status}`);
      }
      
      const data = await response.json();
      setBracketSuggestions(data.suggestions || []);
      
      // Check if response is using fallback mode
      if (data.source === 'fallback') {
        setUsingFallbackMode(true);
        toast({
          title: "Using Fallback Mode",
          description: "AI suggestions are limited due to API rate limiting. Using simpler matching criteria instead.",
          variant: "warning",
        });
      }
      
      // If no suggestions, show notification
      if (!data.suggestions || data.suggestions.length === 0) {
        toast({
          title: "No Teams Need Brackets",
          description: data.message || "All teams already have bracket assignments or there are no approved teams without brackets",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error suggesting bracket assignments:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suggest bracket assignments",
        variant: "destructive",
      });
      // Close modal on error
      setBracketAssignmentModalOpen(false);
    } finally {
      setIsSuggestingBrackets(false);
    }
  };
  
  // Function to apply bracket assignments
  const applyBracketAssignments = async (assignments: Array<{teamId: number, bracketId: number}>) => {
    try {
      if (!selectedEvent) {
        throw new Error("No event selected");
      }
      
      if (assignments.length === 0) {
        toast({
          title: "No changes",
          description: "No bracket assignments were selected to apply.",
          variant: "default",
        });
        return;
      }
      
      // Call the API to apply the bracket assignments
      const response = await fetch(`/api/admin/events/${selectedEvent}/update-team-brackets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignments })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update team brackets: ${response.status}`);
      }
      
      // Successfully applied bracket assignments
      toast({
        title: "Success",
        description: `Applied ${assignments.length} bracket assignments successfully.`,
        variant: "default",
      });
      
      // Clear suggestions and close the modal
      setBracketSuggestions([]);
      setBracketAssignmentModalOpen(false);
      
      // Refresh data if needed
      gamesQuery.refetch();
    } catch (error) {
      console.error("Error applying bracket assignments:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply bracket assignments",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tournament Scheduling</h2>
      </div>
      
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow">6-Step Workflow</TabsTrigger>
          <TabsTrigger value="ai">AI Quick Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          {selectedEvent ? (
            <SchedulingWorkflow 
              eventId={selectedEvent}
              onComplete={(scheduleData) => {
                toast({
                  title: "Scheduling Complete",
                  description: "6-step tournament scheduling workflow completed successfully!",
                });
                // Refresh data
                queryClient.invalidateQueries({ queryKey: ['admin', 'games', selectedEvent] });
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <CalendarDays className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-lg">Select an Event to Start</h3>
                    <p className="text-muted-foreground">
                      Choose an event from the dropdown below to begin the 6-step scheduling workflow
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <Select value={selectedEvent || ""} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsQuery.isLoading ? (
                          <SelectItem value="loading" disabled>Loading events...</SelectItem>
                        ) : eventsQuery.isError ? (
                          <SelectItem value="error" disabled>Error loading events</SelectItem>
                        ) : eventsQuery.data && Array.isArray(eventsQuery.data) && eventsQuery.data.length > 0 ? (
                          eventsQuery.data.map((event: any) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No events available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">AI-Powered Quick Scheduling</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={suggestBracketAssignments}
                disabled={!selectedEvent || isSuggestingBrackets}
              >
                {isSuggestingBrackets ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Assign Brackets
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={async () => {
                  if (!selectedEvent) return;
                  
                  // Validate workflow completion before opening modal
                  const isWorkflowValid = await validateWorkflowCompletion(selectedEvent);
                  if (!isWorkflowValid) {
                    showWorkflowValidationError();
                    return;
                  }
                  
                  setAiSchedulingModalOpen(true);
                }}
                disabled={!selectedEvent}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate AI Schedule
              </Button>
              <Button 
                variant="default"
                onClick={optimizeSchedule}
                disabled={!selectedEvent || isOptimizing || !(gamesQuery.data?.games?.length > 0)}
              >
                {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize Schedule
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEvent || ""} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {eventsQuery.isLoading ? (
                  <SelectItem value="loading" disabled>Loading events...</SelectItem>
                ) : eventsQuery.isError ? (
                  <SelectItem value="error" disabled>Error loading events</SelectItem>
                ) : eventsQuery.data && Array.isArray(eventsQuery.data) && eventsQuery.data.length > 0 ? (
                  // If data is available and is an array, map over it
                  eventsQuery.data.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))
                ) : (
                  // Default fallback
                  <SelectItem value="none" disabled>No events available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Schedule Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleQuality ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Quality Score:</span>
                  <span className={cn(
                    "text-sm font-medium",
                    scheduleQuality >= 90 ? "text-green-600" : 
                    scheduleQuality >= 70 ? "text-amber-600" : 
                    "text-red-600"
                  )}>
                    {scheduleQuality}/100
                  </span>
                </div>
                <Progress value={scheduleQuality} className={cn(
                  scheduleQuality >= 90 ? "bg-green-100" : 
                  scheduleQuality >= 70 ? "bg-amber-100" : 
                  "bg-red-100"
                )} />
                <div className="text-xs text-muted-foreground">
                  {conflicts.length === 0 ? (
                    "No conflicts detected"
                  ) : (
                    `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'} detected`
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                Generate a schedule to see quality metrics
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {conflicts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Conflicts & Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex items-start gap-2 pb-3 border-b last:border-0">
                  <div className={cn(
                    "p-2 rounded-full",
                    conflict.severity === 'critical' ? "bg-red-100" :
                    conflict.severity === 'high' ? "bg-amber-100" :
                    "bg-blue-100"
                  )}>
                    <AlertTriangle className={cn(
                      "h-5 w-5",
                      conflict.severity === 'critical' ? "text-red-600" :
                      conflict.severity === 'high' ? "text-amber-600" :
                      "text-blue-600"
                    )} />
                  </div>
                  <div>
                    <h4 className="font-medium">{
                      conflict.type === 'coach_conflict' ? "Coach Conflict" :
                      conflict.type === 'field_overbooked' ? "Field Overbooked" :
                      "Rest Period Violation"
                    }</h4>
                    <p className="text-sm text-muted-foreground">{conflict.description}</p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm">
                      <WandSparkles className="mr-2 h-4 w-4" />
                      Auto Fix
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEvent ? (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Visualization</CardTitle>
            <CardDescription>
              Click and drag to move games between fields and time slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gamesQuery.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              gamesQuery.data?.games && gamesQuery.data.games.length > 0 ? (
                <ScheduleVisualization
                  games={gamesQuery.data.games.map(game => ({
                    id: game.id.toString(),
                    homeTeam: {
                      id: game.homeTeam?.id || 0,
                      name: game.homeTeam?.name || 'TBD',
                      coach: game.homeTeam?.coach || '',
                      clubName: game.homeTeam?.clubName || ''
                    },
                    awayTeam: {
                      id: game.awayTeam?.id || 0,
                      name: game.awayTeam?.name || 'TBD',
                      coach: game.awayTeam?.coach || '',
                      clubName: game.awayTeam?.clubName || ''
                    },
                    field: game.field || '',
                    complexName: game.complexName || '',
                    startTime: game.startTime || new Date().toISOString(),
                    endTime: game.endTime || new Date().toISOString(),
                    bracket: game.bracket || 'Default',
                    round: game.round || 'Group Stage',
                    ageGroup: game.ageGroup || ''
                  }))}
                  conflicts={conflicts}
                  qualityScore={scheduleQuality || undefined}
                  onDeleteGame={handleDeleteGame}
                  onBulkDeleteGames={handleBulkDeleteGames}
                  allowEditing={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <ClipboardX className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-medium">No Games Scheduled</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the AI Schedule Generator to create a schedule for this event
                    </p>
                  </div>
                  <Button onClick={async () => {
                    if (!selectedEvent) return;
                    
                    // Validate workflow completion before opening modal
                    const isWorkflowValid = await validateWorkflowCompletion(selectedEvent);
                    if (!isWorkflowValid) {
                      showWorkflowValidationError();
                      return;
                    }
                    
                    setAiSchedulingModalOpen(true);
                  }}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Schedule
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-medium text-lg">Select an Event to Start</h3>
                <p className="text-muted-foreground">
                  Choose an event from the dropdown above to view and manage its schedule
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* AI Schedule Generation Dialog */}
      <Dialog open={aiSchedulingModalOpen} onOpenChange={setAiSchedulingModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Schedule Generator</DialogTitle>
            <DialogDescription>
              Configure settings for the AI to generate an optimal tournament schedule.
            </DialogDescription>
          </DialogHeader>
          
          {/* Preview Games UI */}
          {previewMode && previewGames.length > 0 ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Schedule Preview</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPreviewGames([])}
                >
                  <X className="h-4 w-4 mr-1" /> Close Preview
                </Button>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="text-sm mb-3">
                  Here's a preview of 5 games from your schedule. If these look good, you can proceed with generating the full schedule.
                </p>
                
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Division</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewGames.map((game, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(game.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            {game.homeTeam?.name || 'TBD'} vs {game.awayTeam?.name || 'TBD'}
                          </TableCell>
                          <TableCell>{game.fieldName || game.field}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{game.ageGroup}</span>
                              <span className="text-xs text-muted-foreground">{game.bracket}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPreviewGames([]);
                    setPreviewMode(false);
                  }}
                >
                  Adjust Settings
                </Button>
                <Button 
                  onClick={() => {
                    // Get values from form fields
                    const minRestEl = document.getElementById('min-rest') as HTMLInputElement;
                    const maxGamesEl = document.getElementById('max-games') as HTMLInputElement;
                    const resolveCoachConflictsEl = document.getElementById('resolve-coach-conflicts') as HTMLInputElement;
                    const fieldOptimizationEl = document.getElementById('field-optimization') as HTMLInputElement;
                    
                    // Get tournament format from radio group
                    const tournamentFormatEl = document.querySelector('input[name="round-robin-knockout"]:checked') as HTMLInputElement;
                    const tournamentFormat = tournamentFormatEl?.value || 'round-robin-knockout';
                    
                    // Close modal and generate full schedule
                    setAiSchedulingModalOpen(false);
                    
                    // Call the generate schedule function with the same parameters but without preview mode
                    generateSchedule({
                      minRest: parseInt(minRestEl?.value || '30', 10),
                      maxGamesPerDay: parseInt(maxGamesEl?.value || '3', 10),
                      resolveCoachConflicts: resolveCoachConflictsEl?.checked || true,
                      optimizeFieldUsage: fieldOptimizationEl?.checked || true,
                      tournamentFormat: tournamentFormat,
                      selectedAgeGroups: selectedAgeGroups,
                      selectedBrackets: selectedBrackets,
                      previewMode: false // Generate full schedule
                    });
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Generate Full Schedule
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {/* Main content in 2 columns to save vertical space */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Schedule Constraints */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Schedule Constraints</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-rest">Minimum Rest Period</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id="min-rest" 
                            type="number" 
                            defaultValue="30" 
                            min="10" 
                            max="240"
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">minutes</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-games">Max Games Per Day</Label>
                        <Input 
                          id="max-games" 
                          type="number" 
                          defaultValue="3" 
                          min="1" 
                          max="6"
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Coach Conflict Resolution */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Coach & Field Settings</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="resolve-coach-conflicts" defaultChecked />
                      <Label htmlFor="resolve-coach-conflicts">Resolve coach conflicts</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="field-optimization" defaultChecked />
                      <Label htmlFor="field-optimization">Optimize field usage</Label>
                    </div>
                  </div>
                  
                  {/* Tournament Format */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Tournament Format</h4>
                    <RadioGroup defaultValue="round-robin-knockout" className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round-robin-knockout" id="round-robin-knockout" />
                        <Label htmlFor="round-robin-knockout">Group stage + knockout</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="double-elimination" id="double-elimination" />
                        <Label htmlFor="double-elimination">Double elimination</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single-elimination" id="single-elimination" />
                        <Label htmlFor="single-elimination">Single elimination</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Preview Mode Toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="preview-mode" 
                        checked={previewMode}
                        onCheckedChange={(checked) => setPreviewMode(!!checked)}
                      />
                      <Label htmlFor="preview-mode">Preview mode (5 sample games)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Preview before full generation
                    </p>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  {/* Age Groups Selection */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Age Groups</h4>
                    <p className="text-xs text-muted-foreground">
                      Select age groups to include (leave empty for all)
                    </p>
                    
                    {gamesQuery.data?.ageGroups && gamesQuery.data.ageGroups.length > 0 ? (
                      <ScrollArea className="h-28 border rounded-md p-2">
                        <div className="space-y-1">
                          {gamesQuery.data.ageGroups.map((ageGroup) => (
                            <div key={ageGroup} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`age-group-${ageGroup}`}
                                checked={selectedAgeGroups.includes(ageGroup)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAgeGroups([...selectedAgeGroups, ageGroup]);
                                  } else {
                                    setSelectedAgeGroups(
                                      selectedAgeGroups.filter((ag) => ag !== ageGroup)
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`age-group-${ageGroup}`} className="text-sm">{ageGroup}</Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No age groups available
                      </div>
                    )}
                  </div>
                  
                  {/* Brackets Selection */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Brackets</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedAgeGroups.length === 0 
                        ? "Select age groups to see available brackets" 
                        : "Select brackets to include (leave empty for all)"}
                    </p>
                    
                    {selectedAgeGroups.length === 0 ? (
                      <div className="flex items-center justify-center h-28 border rounded-md p-2 bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                          Select one or more age groups above
                        </p>
                      </div>
                    ) : (
                      <BracketSelector 
                        eventId={selectedEvent}
                        selectedAgeGroups={selectedAgeGroups}
                        selectedBrackets={selectedBrackets}
                        onBracketsChange={setSelectedBrackets}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!previewGames.length && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiSchedulingModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Get values from form fields
                  const minRestEl = document.getElementById('min-rest') as HTMLInputElement;
                  const maxGamesEl = document.getElementById('max-games') as HTMLInputElement;
                  const resolveCoachConflictsEl = document.getElementById('resolve-coach-conflicts') as HTMLInputElement;
                  const fieldOptimizationEl = document.getElementById('field-optimization') as HTMLInputElement;
                  
                  // Get tournament format from radio group
                  const tournamentFormatEl = document.querySelector('input[name="round-robin-knockout"]:checked') as HTMLInputElement;
                  const tournamentFormat = tournamentFormatEl?.value || 'round-robin-knockout';
                  
                  // Close the modal only if not in preview mode
                  if (!previewMode) {
                    setAiSchedulingModalOpen(false);
                  }
                  
                  // Call the generate schedule function with the form values
                  generateSchedule({
                    minRest: parseInt(minRestEl?.value || '30', 10),
                    maxGamesPerDay: parseInt(maxGamesEl?.value || '3', 10),
                    resolveCoachConflicts: resolveCoachConflictsEl?.checked || true,
                    optimizeFieldUsage: fieldOptimizationEl?.checked || true,
                    tournamentFormat: tournamentFormat,
                    selectedAgeGroups: selectedAgeGroups,
                    selectedBrackets: selectedBrackets,
                    previewMode: previewMode
                  });
                }}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {previewMode ? 'Generating Preview...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {previewMode ? 'Generate Preview' : 'Generate Schedule'}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BracketAssignmentModal 
        open={bracketAssignmentModalOpen}
        onOpenChange={setBracketAssignmentModalOpen}
        eventId={selectedEvent}
        suggestions={bracketSuggestions}
        isSuggesting={isSuggestingBrackets}
        usingFallbackMode={usingFallbackMode}
        onApply={applyBracketAssignments}
      />
    </>
  );
}


function TeamsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isDeletePlayerDialogOpen, setIsDeletePlayerDialogOpen] = useState(false);
  const [isCsvUploadDialogOpen, setIsCsvUploadDialogOpen] = useState(false);
  const [isTeamCsvImportDialogOpen, setIsTeamCsvImportDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isAddPlayerMode, setIsAddPlayerMode] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [isBulkApprovalDialogOpen, setIsBulkApprovalDialogOpen] = useState(false);
  const [bulkApprovalNotes, setBulkApprovalNotes] = useState("");
  const [isBulkRejectionDialogOpen, setIsBulkRejectionDialogOpen] = useState(false);
  const [bulkRejectionNotes, setBulkRejectionNotes] = useState("");
  const [isFeeAdjustmentDialogOpen, setIsFeeAdjustmentDialogOpen] = useState(false);
  const [isTeamContactEditOpen, setIsTeamContactEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // DialogDescription is already imported at the top of the file
  
  // Fetch events for dropdown
  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });
  
  // Fetch import-eligible events (including those with past registration deadlines)
  const importEligibleEventsQuery = useQuery({
    queryKey: ['admin', 'import-eligible-events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/import-eligible-events', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch import-eligible events');
      const data = await response.json();
      console.log('Import eligible events:', data);
      return data;
    }
  });

  // Fetch teams with event and age group data
  const teamsQuery = useQuery({
    queryKey: ['admin', 'teams', selectedEvent, selectedStatus],
    queryFn: async () => {
      let url = '/api/admin/teams';
      const params = new URLSearchParams();
      
      if (selectedEvent !== 'all') params.append('eventId', selectedEvent);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      console.log('Teams data received:', data);
      return data;
    }
  });

  // Mutation for approving/rejecting team registration
  const updateTeamStatusMutation = useMutation({
    mutationFn: async ({ teamId, status, notes, skipPayment, skipEmail }: { teamId: number, status: string, notes?: string, skipPayment?: boolean, skipEmail?: boolean }) => {
      try {
        console.log('Sending status update with data:', { teamId, status, notes, skipPayment, skipEmail });
        
        const response = await fetch(`/api/admin/teams/${teamId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes, skipPayment, skipEmail })
        });
        
        // First try to get the response text to check for parsing issues
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let responseData;
        try {
          // Try to parse the response as JSON
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError, 'Response text:', responseText);
          throw new Error('Server returned invalid JSON response. Please try again.');
        }
        
        if (!response.ok) {
          console.error('Error response:', responseData);
          
          if (responseData && responseData.error) {
            throw new Error(responseData.error);
          } else {
            throw new Error(`Failed to update team status. Status: ${response.status}`);
          }
        }
        
        return responseData;
      } catch (err) {
        console.error('Error in updateTeamStatus mutation:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Team status updated",
        description: `Team registration has been ${selectedTeam?.status ? selectedTeam.status.toLowerCase() : 'updated'}`,
      });
      setIsApprovalDialogOpen(false);
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const bulkApproveTeamsMutation = useMutation({
    mutationFn: async ({ teamIds, notes }: { teamIds: number[], notes?: string }) => {
      console.log('Bulk approving teams:', teamIds, 'with notes:', notes);
      
      const response = await fetch('/api/admin/teams/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ teamIds, notes })
      });
      
      const responseText = await response.text();
      console.log('Bulk approval response:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing bulk approval response:', parseError);
        throw new Error('Server returned invalid response. Please try again.');
      }
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to bulk approve teams');
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      const { summary, results } = data;
      
      toast({
        title: "Bulk Approval Complete",
        description: `${summary.successful} teams approved successfully. ${summary.failed > 0 ? `${summary.failed} failed.` : ''}`,
      });
      
      // Show detailed results if there were warnings or failures
      if (summary.warnings > 0 || summary.failed > 0) {
        console.log('Bulk approval results:', results);
      }
      
      setIsBulkApprovalDialogOpen(false);
      setSelectedTeamIds([]);
      setBulkApprovalNotes("");
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const bulkRejectTeamsMutation = useMutation({
    mutationFn: async ({ teamIds, notes }: { teamIds: number[], notes?: string }) => {
      console.log('Bulk rejecting teams:', teamIds, 'with notes:', notes);
      
      const response = await fetch('/api/admin/teams/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ teamIds, notes })
      });
      
      const responseText = await response.text();
      console.log('Bulk rejection response:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing bulk rejection response:', parseError);
        throw new Error('Server returned invalid response. Please try again.');
      }
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to bulk reject teams');
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      const { summary, results } = data;
      
      toast({
        title: "Bulk Rejection Complete",
        description: `${summary.successful} teams rejected successfully. ${summary.failed > 0 ? `${summary.failed} failed.` : ''}`,
      });
      
      // Show detailed results if there were warnings or failures
      if (summary.warnings > 0 || summary.failed > 0) {
        console.log('Bulk rejection results:', results);
      }
      
      setIsBulkRejectionDialogOpen(false);
      setSelectedTeamIds([]);
      setBulkRejectionNotes("");
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Rejection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Resend approval email mutation
  const resendApprovalEmailMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/admin/teams/${teamId}/resend-approval-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend approval email');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Sent Successfully",
        description: `Approval email resent to ${data.recipients.length} recipient(s) for ${data.teamName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting team registration
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "Team registration has been successfully deleted",
      });
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for processing refunds
  const processRefundMutation = useMutation({
    mutationFn: async ({ teamId, reason, amount }: { teamId: number, reason: string, amount?: number | null }) => {
      const response = await fetch(`/api/admin/teams/${teamId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, amount })
      });
      
      if (!response.ok) throw new Error('Failed to process refund');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund processed",
        description: "The payment has been successfully refunded.",
      });
      setIsRefundDialogOpen(false);
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error processing refund",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Players Query - Fetch players for selected team
  const playersQuery = useQuery({
    queryKey: ['admin', 'teams', selectedTeam?.id, 'players'],
    queryFn: async () => {
      if (!selectedTeam) return [];
      
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}/players`);
      if (!response.ok) throw new Error('Failed to fetch players');
      
      return response.json();
    },
    enabled: !!selectedTeam?.id && isDetailsDialogOpen
  });
  
  // Add Player Mutation
  const addPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      const response = await fetch(`/api/admin/teams/${selectedTeam!.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Get specific validation errors if available
        if (errorData.error && Array.isArray(errorData.error)) {
          const validationErrors = errorData.error.map((err: any) => 
            `${err.message || err.code}`
          ).join(', ');
          throw new Error(`Validation error: ${validationErrors}`);
        } else if (errorData.details) {
          throw new Error(`${errorData.error}: ${errorData.details}`);
        } else {
          throw new Error(errorData.error || 'Failed to add player');
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player added successfully",
        variant: "default"
      });
      setIsPlayerDialogOpen(false);
      playersQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update Player Mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ playerId, playerData }: { playerId: number, playerData: any }) => {
      const response = await fetch(`/api/admin/teams/${selectedTeam!.id}/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player updated successfully",
        variant: "default"
      });
      setIsPlayerDialogOpen(false);
      playersQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete Player Mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/admin/teams/${selectedTeam!.id}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player deleted successfully",
        variant: "default"
      });
      setIsDeletePlayerDialogOpen(false);
      playersQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update Team Contacts Mutation
  const updateTeamContactsMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await fetch(`/api/member/teams/${selectedTeam.id}/contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team contacts');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team contacts updated successfully",
        variant: "default"
      });
      setIsTeamContactEditOpen(false);
      // Refresh the team details to show updated contact information
      queryClient.invalidateQueries(['admin', 'teams', selectedTeam?.id]);
      // Also refetch all teams to ensure the list is updated
      teamsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update selectedTeam when player data is available
  useEffect(() => {
    if (playersQuery.data && selectedTeam) {
      console.log('Players data received:', playersQuery.data);
      setSelectedTeam(prevTeam => ({
        ...prevTeam,
        players: playersQuery.data
      }));
    }
  }, [playersQuery.data, selectedTeam?.id]);

  // View team details
  const handleViewTeamDetails = (team: any) => {
    // Parse coach data if it exists
    let coachData = team.coachData;
    
    // If coach data is a string, try to parse it as JSON
    if (!coachData && team.coach && typeof team.coach === 'string') {
      try {
        coachData = JSON.parse(team.coach);
      } catch (e) {
        console.error("Error parsing coach data:", e);
        coachData = {}; // Initialize to empty object if parsing fails
      }
    }
    
    // Set the selected team with parsed coach data
    setSelectedTeam({
      ...team,
      coachData
    });
    
    setIsDetailsDialogOpen(true);
  };

  // Handle team selection for bulk operations
  const handleTeamSelection = (teamId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTeamIds(prev => [...prev, teamId]);
    } else {
      setSelectedTeamIds(prev => prev.filter(id => id !== teamId));
    }
  };

  // Handle select all/none for bulk operations
  const handleSelectAll = (teams: any[], isSelectAll: boolean) => {
    if (isSelectAll) {
      const registeredTeamIds = teams
        .filter(team => team.status === 'registered')
        .map(team => team.id);
      setSelectedTeamIds(registeredTeamIds);
    } else {
      setSelectedTeamIds([]);
    }
  };

  // Handle bulk approval dialog
  const handleBulkApproval = () => {
    if (selectedTeamIds.length === 0) {
      toast({
        title: "No teams selected",
        description: "Please select teams to approve",
        variant: "destructive"
      });
      return;
    }
    setIsBulkApprovalDialogOpen(true);
  };

  // Confirm bulk approval
  const confirmBulkApproval = () => {
    bulkApproveTeamsMutation.mutate({
      teamIds: selectedTeamIds,
      notes: bulkApprovalNotes || undefined
    });
  };

  // Handle bulk rejection dialog
  const handleBulkRejection = () => {
    if (selectedTeamIds.length === 0) {
      toast({
        title: "No teams selected",
        description: "Please select teams to reject",
        variant: "destructive"
      });
      return;
    }
    setIsBulkRejectionDialogOpen(true);
  };

  // Confirm bulk rejection
  const confirmBulkRejection = () => {
    bulkRejectTeamsMutation.mutate({
      teamIds: selectedTeamIds,
      notes: bulkRejectionNotes || undefined
    });
  };

  // Handle financial export for approved teams
  const handleFinancialExport = async () => {
    try {
      const url = new URL('/api/admin/teams/financial-export', window.location.origin);
      
      // Add event filter if one is selected
      if (selectedEvent && selectedEvent !== 'all') {
        url.searchParams.set('eventId', selectedEvent);
      }
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url.toString();
      link.download = ''; // Let the server set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Started",
        description: "Financial report will download shortly",
        variant: "default"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to generate financial report",
        variant: "destructive"
      });
    }
  };

  // Handle team status update
  const handleStatusUpdate = (team: any, status: 'registered' | 'approved' | 'rejected' | 'withdrawn' | 'refunded' | 'waitlisted', notes?: string, skipPayment?: boolean, skipEmail?: boolean) => {
    const statusDisplayMap = {
      'registered': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn',
      'refunded': 'Refunded',
      'waitlisted': 'Waitlisted'
    };
    
    // Set appropriate dialog message based on status transition
    let dialogTitle = `Update Team Status`;
    let dialogMessage = `Are you sure you want to change the status of team "${team.name}" from "${statusDisplayMap[team.status]}" to "${statusDisplayMap[status]}"?`;
    
    // Special messaging for specific status transitions
    if (team.status === 'registered' && status === 'approved') {
      dialogMessage = skipPayment 
        ? `Approve team "${team.name}" for participation in the event without processing payment? (Team is already marked as PAID)`
        : skipEmail 
          ? `Approve team "${team.name}" for participation in the event without sending email notification?`
          : `Approve team "${team.name}" for participation in the event?`;
    } else if (team.status === 'registered' && status === 'rejected') {
      dialogMessage = `Reject team "${team.name}" from participating in the event?`;
    } else if (team.status === 'registered' && status === 'waitlisted') {
      dialogMessage = `Place team "${team.name}" on the waitlist? They will not take up a slot in the event until approved, and can be moved to approved status if space becomes available.`;
    } else if (status === 'withdrawn') {
      dialogMessage = `Mark team "${team.name}" as withdrawn from the event? This indicates the team has voluntarily withdrawn their registration.`;
    } else if (team.status !== 'registered' && status === 'registered') {
      dialogMessage = `Reset team "${team.name}" status to pending review? This will remove any previous approval or rejection decisions.`;
    }
    
    setSelectedTeam({ 
      ...team, 
      status,
      dialogTitle,
      dialogMessage,
      skipPayment,
      skipEmail
    });
    setIsApprovalDialogOpen(true);
  };

  // Handle refund request
  const handleRefundRequest = (team: any) => {
    setSelectedTeam(team);
    setIsRefundDialogOpen(true);
  };
  
  // Handle opening the edit team modal
  const handleEditTeam = () => {
    // The selectedTeam is already set from handleViewTeamDetails
    setIsEditModalOpen(true);
  };

  // Confirm team status update
  const confirmStatusUpdate = (notes?: string) => {
    if (!selectedTeam) return;
    
    updateTeamStatusMutation.mutate({
      teamId: selectedTeam.id,
      status: selectedTeam.status,
      notes,
      skipPayment: selectedTeam.skipPayment,
      skipEmail: selectedTeam.skipEmail
    });
  };

  // Confirm refund
  const confirmRefund = () => {
    if (!selectedTeam) return;
    
    // Calculate the refund amount based on whether it's a partial refund or not
    const amount = isPartialRefund ? 
      // Convert string dollar amount to cents
      Math.round(parseFloat(refundAmount) * 100) : 
      null;
    
    processRefundMutation.mutate({
      teamId: selectedTeam.id,
      reason: refundReason,
      amount
    });
  };

  // Filter teams by search term
  // First, let's normalize the team data to handle the nested structure
  const normalizedTeams = useMemo(() => {
    if (!teamsQuery.data) return [];
    
    // Add debugging log to see what's coming back from the API
    console.log('Teams data from API:', teamsQuery.data);
    
    // Process the nested structure (each item has a 'team' property)
    return teamsQuery.data.map((item: any) => {
      // If the item has a team property, use that, otherwise use the item itself
      const teamData = item.team || item;
      
      // Map the status field to a paymentStatus property
      // This fixes the issue where the UI expects paymentStatus but DB uses status field
      let paymentStatus = teamData.paymentStatus || 'Unpaid';
      
      // If there's no explicit paymentStatus field, try to infer it from other fields
      if (!teamData.paymentStatus) {
        if (teamData.status === 'paid') {
          paymentStatus = 'paid';
        } else if (teamData.status === 'refunded') {
          paymentStatus = 'refunded';
        } else if (teamData.paymentIntentId && teamData.paymentDate) {
          // If the team has payment details, assume it's paid
          paymentStatus = 'paid';
        } else if (teamData.status === 'approved' || teamData.status === 'waitlisted') {
          // For team registration flow, approved and waitlisted teams have already paid
          paymentStatus = 'paid';
        }
      }
      
      // Combine any additional data from the parent object with the team data
      return {
        ...teamData,
        // Include event and ageGroup data if they exist in the parent object
        event: item.event || teamData.event,
        ageGroup: item.ageGroup || teamData.ageGroup,
        // Add the derived paymentStatus
        paymentStatus
      };
    });
  }, [teamsQuery.data]);
  
  // Now filter the normalized teams based on search criteria
  const filteredTeams = useMemo(() => {
    if (!normalizedTeams.length) return [];
    console.log('Normalized teams data:', normalizedTeams);
    
    if (!searchTerm) return normalizedTeams;
    
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    
    return normalizedTeams.filter((team: any) => {
      // Skip undefined or null teams entirely
      if (!team) {
        console.log('Found invalid team entry:', team);
        return false;
      }
      
      // Safely access and match properties with null checks
      const nameMatch = team && team.name && typeof team.name === 'string' 
        ? team.name.toLowerCase().includes(lowercaseSearchTerm) 
        : false;
      
      const managerMatch = team && team.managerEmail && typeof team.managerEmail === 'string' 
        ? team.managerEmail.toLowerCase().includes(lowercaseSearchTerm) 
        : false;
      
      const submitterMatch = team && team.submitterEmail && typeof team.submitterEmail === 'string' 
        ? team.submitterEmail.toLowerCase().includes(lowercaseSearchTerm) 
        : false;
      
      return nameMatch || managerMatch || submitterMatch;
    });
  }, [normalizedTeams, searchTerm]);

  // Calculate team counts by status (always show real counts, not filtered)
  const teamCounts = useMemo(() => {
    if (!normalizedTeams.length) return {
      registered: 0,
      approved: 0,
      waitlisted: 0,
      rejected: 0
    };
    
    // If "all" events is selected, these are the real totals
    // If a specific event is selected, these are the totals for that event
    return {
      registered: normalizedTeams.filter(team => team?.status === 'registered').length,
      approved: normalizedTeams.filter(team => team?.status === 'approved').length,
      waitlisted: normalizedTeams.filter(team => team?.status === 'waitlisted').length,
      rejected: normalizedTeams.filter(team => team?.status === 'rejected').length
    };
  }, [normalizedTeams]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount / 100);
  };

  // Parse coach data from JSON
  const getCoachName = (coachData: string | null) => {
    if (!coachData) return "N/A";
    
    try {
      const coach = JSON.parse(coachData);
      return coach.headCoachName || "N/A";
    } catch (e) {
      console.error("Error parsing coach data:", e);
      // If it's not valid JSON, return the raw value for debugging
      return typeof coachData === 'string' ? coachData.substring(0, 20) + '...' : "N/A";
    }
  };

  // Handle team data export
  const handleExportTeamData = async () => {
    if (selectedEvent === 'all' || !selectedEvent) {
      toast({
        title: "Select Event",
        description: "Please select a specific event to export team data.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/manager-reports/${selectedEvent}/csv`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-data-event-${selectedEvent}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Team data has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed", 
        description: `Failed to export team data. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <AnimatedContainer animation="slideUp" delay={0.1}>
        <div className="flex justify-between items-center mb-6">
          <motion.h2 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Team Registrations
          </motion.h2>
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="default"
                onClick={() => setIsTeamCsvImportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Import Teams
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handleExportTeamData}
                disabled={selectedEvent === 'all' || !selectedEvent}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Team Data
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedContainer>
      
      <AnimatedContainer animation="fadeIn" delay={0.2}>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4 team-list">
              <motion.div 
                className="flex flex-wrap gap-4 items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                  <div className="relative w-[220px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
                    <Input
                      placeholder="Search teams..."
                      className="pl-9 bg-background h-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Select 
                    value={selectedEvent} 
                    onValueChange={setSelectedEvent}
                  >
                    <SelectTrigger className="w-[220px] bg-background">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      <SelectGroup>
                        <SelectLabel className="flex items-center font-semibold text-primary">
                          <ListFilter className="h-4 w-4 mr-2" />
                          Filter Options
                        </SelectLabel>
                        <SelectItem value="all" className="flex items-center rounded-md mb-1 bg-muted/40 font-medium">
                          <Eye className="h-4 w-4 mr-2 text-primary" />
                          All Events
                        </SelectItem>
                      </SelectGroup>
                      
                      <SelectSeparator />
                      
                      <SelectGroup>
                        <SelectLabel className="flex items-center font-semibold text-primary">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Available Events
                        </SelectLabel>
                        {importEligibleEventsQuery.isLoading ? (
                          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading events...
                          </div>
                        ) : Array.isArray(importEligibleEventsQuery.data) && importEligibleEventsQuery.data.length > 0 ? (
                          importEligibleEventsQuery.data.map((event: any) => (
                            <SelectItem 
                              key={event.id} 
                              value={event.id.toString()} 
                              className="flex items-center mb-0.5 hover:bg-muted/60 transition-colors"
                            >
                              <Badge variant="outline" className="mr-2 px-1 py-0 h-5 text-xs">
                                {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                              </Badge>
                              {event.name}
                            </SelectItem>
                          ))
                        ) : Array.isArray(importEligibleEventsQuery.data?.events) && importEligibleEventsQuery.data.events.length > 0 ? (
                          importEligibleEventsQuery.data.events.map((event: any) => (
                            <SelectItem 
                              key={event.id} 
                              value={event.id.toString()} 
                              className="flex items-center mb-0.5 hover:bg-muted/60 transition-colors"
                            >
                              <Badge variant="outline" className="mr-2 px-1 py-0 h-5 text-xs">
                                {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                              </Badge>
                              {event.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            No events available
                          </div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-[220px] bg-background">
                      <ClipboardList className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue placeholder="Registration Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="flex items-center font-semibold text-primary">
                          <Filter className="h-4 w-4 mr-2" />
                          Status Filters
                        </SelectLabel>
                        <SelectItem value="all" className="flex items-center rounded-md mb-1 bg-muted/40 font-medium">
                          <ListChecks className="h-4 w-4 mr-2 text-primary" />
                          All Statuses
                        </SelectItem>
                      </SelectGroup>
                      
                      <SelectSeparator />
                      
                      <SelectGroup>
                        <SelectItem value="registered" className="flex items-center mb-0.5">
                          <Badge variant="outline" className="mr-2 border-yellow-400/30 bg-yellow-50/40 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                          Registered (Pending)
                        </SelectItem>
                        <SelectItem value="approved" className="flex items-center mb-0.5">
                          <Badge variant="outline" className="mr-2 border-green-400/30 bg-green-50/40 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <Check className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                          Approved
                        </SelectItem>
                        <SelectItem value="rejected" className="flex items-center mb-0.5">
                          <Badge variant="outline" className="mr-2 border-red-400/30 bg-red-50/40 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <X className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                          Rejected
                        </SelectItem>
                        <SelectItem value="paid" className="flex items-center mb-0.5">
                          <Badge variant="outline" className="mr-2 border-blue-400/30 bg-blue-50/40 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            <CreditCard className="h-3 w-3 mr-1" />
                            $
                          </Badge>
                          Paid
                        </SelectItem>
                        <SelectItem value="refunded" className="flex items-center mb-0.5">
                          <Badge variant="outline" className="mr-2 border-purple-400/30 bg-purple-50/40 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            ↩
                          </Badge>
                          Refunded
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>

              <Tabs defaultValue="registered">
                <TabsList className="mb-4 bg-slate-100 p-2 rounded-lg border border-slate-200 gap-1">
                  <TabsTrigger 
                    value="registered" 
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200 px-4 py-2 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <ListFilter className="h-4 w-4" />
                      Pending Review
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {teamCounts.registered}
                      </Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="approved" 
                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200 px-4 py-2 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Approved
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {teamCounts.approved}
                      </Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="waitlisted" 
                    className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200 px-4 py-2 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Waitlisted
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {teamCounts.waitlisted}
                      </Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rejected" 
                    className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200 px-4 py-2 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Rejected
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {teamCounts.rejected}
                      </Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="refunded" 
                    className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200 px-4 py-2 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Refunded
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {teamCounts.refunded || 0}
                      </Badge>
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="registered">
                  {/* Payment Status Legend */}
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 mb-3">
                        <HelpCircle className="h-4 w-4" />
                        Payment Status Guide
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mb-4">
                      <Card>
                        <CardContent className="p-4">
                          <PaymentStatusLegend />
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Bulk Actions Toolbar */}
                  {selectedTeamIds.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-blue-900">
                            {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''} selected
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeamIds([])}
                          >
                            Clear Selection
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleBulkApproval}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={bulkApproveTeamsMutation.isPending}
                          >
                            {bulkApproveTeamsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Check className="h-4 w-4 mr-2" />
                            Approve Selected Teams
                          </Button>
                          <Button
                            onClick={handleBulkRejection}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={bulkRejectTeamsMutation.isPending}
                          >
                            {bulkRejectTeamsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <X className="h-4 w-4 mr-2" />
                            Reject Selected Teams
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100 w-12">
                            <Checkbox
                              checked={selectedTeamIds.length > 0 && selectedTeamIds.length === filteredTeams.filter(team => team.status === 'registered').length}
                              onCheckedChange={(checked) => {
                                const registeredTeams = filteredTeams.filter(team => team.status === 'registered');
                                handleSelectAll(registeredTeams, checked === true);
                              }}
                              aria-label="Select all teams"
                            />
                          </TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team Name</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Age Group</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Submitter</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Registered Date</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Roster Count</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Final Total</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Payment Method</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-4">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeams.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-4">
                              No teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'registered')
                            .map((team: any, index) => (
                              <TableRow key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TableCell className="w-12">
                                  <Checkbox
                                    checked={selectedTeamIds.includes(team.id)}
                                    onCheckedChange={(checked) => {
                                      handleTeamSelection(team.id, checked === true);
                                    }}
                                    aria-label={`Select team ${team.name}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{team.name}</span>
                                    {team.clubName && (
                                      <span className="text-xs text-muted-foreground">({team.clubName})</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{formatDate(team.createdAt)}</TableCell>
                                <TableCell>{getRosterCount(team)}</TableCell>
                                <TableCell>{formatCurrency(team.totalAmount || team.registrationFee || 0)}</TableCell>
                                <TableCell>
                                  <PaymentMethodDisplay team={team} showCardDetails={false} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {/* Payment Retry Button - Shows for failed payments */}
                                    <PaymentRetryButton
                                      teamId={team.id}
                                      teamName={team.name}
                                      paymentStatus={team.paymentStatus}
                                      onSuccess={() => teamsQuery.refetch()}
                                    />
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTeamDetails(team)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="team-edit-button team-status-button"
                                      onClick={() => handleStatusUpdate(team, 'approved')}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="team-status-button"
                                      onClick={() => handleStatusUpdate(team, 'waitlisted')}
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      Waitlist
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-destructive team-edit-button team-status-button"
                                      onClick={() => handleStatusUpdate(team, 'rejected')}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="waitlisted">
                  <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700">
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Team Name</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Event</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Age Group</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Submitter</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Registered Date</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Roster Count</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Final Total</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100">Payment Method</TableHead>
                          <TableHead className="font-semibold py-4 text-amber-900 dark:text-amber-100 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeams.filter((team: any) => team && team.status === 'waitlisted').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              No waitlisted teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'waitlisted')
                            .map((team: any, index) => (
                              <TableRow key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{team.name}</span>
                                    {team.clubName && (
                                      <span className="text-xs text-muted-foreground">({team.clubName})</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{formatDate(team.createdAt)}</TableCell>
                                <TableCell>{getRosterCount(team)}</TableCell>
                                <TableCell>{formatCurrency(team.totalAmount || team.registrationFee || 0)}</TableCell>
                                <TableCell>
                                  <PaymentMethodDisplay team={team} showCardDetails={false} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTeamDetails(team)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="team-edit-button team-status-button"
                                      onClick={() => handleStatusUpdate(team, 'approved')}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-destructive team-edit-button team-status-button"
                                      onClick={() => handleStatusUpdate(team, 'rejected')}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="approved">
                  <div className="mb-4 flex justify-between items-center">
                    <h4 className="font-semibold text-lg">Approved Teams</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFinancialExport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Financial Report
                    </Button>
                  </div>
                  <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team Name</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Age Group</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Submitter</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Date Approved</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Roster Count</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Final Total</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Payment Method</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeams.filter((team: any) => team && team.status === 'approved').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              No approved teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'approved')
                            .map((team: any, index) => (
                              <TableRow key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{team.name}</span>
                                    {team.clubName && (
                                      <span className="text-xs text-muted-foreground">({team.clubName})</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{team.approvedAt ? formatDate(team.approvedAt) : "N/A"}</TableCell>
                                <TableCell>{getRosterCount(team)}</TableCell>
                                <TableCell>{formatCurrency(team.totalAmount || team.registrationFee || 0)}</TableCell>
                                <TableCell>
                                  <PaymentMethodDisplay team={team} showCardDetails={false} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTeamDetails(team)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                    {team.paymentStatus === 'paid' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="team-status-button team-edit-button"
                                        onClick={() => handleRefundRequest(team)}
                                      >
                                        <RefreshCcw className="h-4 w-4 mr-1" />
                                        Refund
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="team-status-button" onClick={() => handleStatusUpdate(team, 'registered')}
                                    >
                                      <ArrowLeft className="h-4 w-4 mr-1" />
                                      Reset
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="rejected">
                  <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team Name</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Age Group</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Submitter</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Registered Date</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Roster Count</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Rejection Reason</TableHead>
                          <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeams.filter((team: any) => team && team.status === 'rejected').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No rejected teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'rejected')
                            .map((team: any, index) => (
                              <TableRow key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{team.name}</span>
                                    {team.clubName && (
                                      <span className="text-xs text-muted-foreground">({team.clubName})</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{formatDate(team.createdAt)}</TableCell>
                                <TableCell>{getRosterCount(team)}</TableCell>
                                <TableCell>
                                  <span className="text-muted-foreground">
                                    {team.notes || 'No reason provided'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTeamDetails(team)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="team-status-button" onClick={() => handleStatusUpdate(team, 'registered')}
                                    >
                                      <ArrowLeft className="h-4 w-4 mr-1" />
                                      Reset
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="refunded">
                  <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Team Name</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Event</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Age Group</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Submitter</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Registered Date</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Refund Date</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100">Amount</TableHead>
                          <TableHead className="font-semibold py-4 text-purple-900 dark:text-purple-100 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeams.filter((team: any) => team && team.status === 'refunded').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No refunded teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'refunded')
                            .map((team: any, index) => (
                              <TableRow key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{team.name}</span>
                                    {team.clubName && (
                                      <span className="text-xs text-muted-foreground">({team.clubName})</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{formatDate(team.createdAt)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-purple-700 border-purple-400">
                                    {team.refundDate ? formatDate(team.refundDate) : 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatCurrency(team.totalAmount || team.registrationFee || 0)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTeamDetails(team)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Details
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Team Status Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTeam?.dialogTitle || (
                selectedTeam?.status === 'approved' ? 'Approve Team Registration' : 
                selectedTeam?.status === 'rejected' ? 'Reject Team Registration' :
                selectedTeam?.status === 'withdrawn' ? 'Mark Team as Withdrawn' :
                selectedTeam?.status === 'registered' ? 'Reset to Pending Status' : 'Update Team Status'
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.dialogMessage || (
                selectedTeam?.status === 'approved' 
                  ? 'This will approve the team registration and notify the manager.'
                  : selectedTeam?.status === 'rejected'
                  ? 'This will reject the team registration. Please provide a reason for rejection.'
                  : selectedTeam?.status === 'withdrawn'
                  ? 'This will mark the team as withdrawn from the event. Please provide a reason if applicable.'
                  : selectedTeam?.status === 'waitlisted'
                  ? 'This will place the team on the waitlist. Their payment will be processed, but they will not occupy a slot in scheduling until later approved.'
                  : selectedTeam?.status === 'registered'
                  ? 'This will reset the team status to pending review.'
                  : 'This will update the team status and notify the manager.'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Show notes field for rejection or withdrawal */}
          {(selectedTeam?.status === 'rejected' || selectedTeam?.status === 'withdrawn') && (
            <Textarea 
              placeholder={`Reason for ${selectedTeam?.status === 'rejected' ? 'rejection' : 'withdrawal'} (will be shared with the manager)`}
              value={selectedTeam?.notes || ''}
              onChange={(e) => setSelectedTeam({ ...selectedTeam, notes: e.target.value })}
            />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => confirmStatusUpdate(selectedTeam?.notes)}
              disabled={updateTeamStatusMutation.isPending}
              className="team-status-button team-edit-button"
              variant={selectedTeam?.status === 'rejected' || selectedTeam?.status === 'withdrawn' ? 'destructive' : 
                       selectedTeam?.status === 'approved' ? 'default' : 'outline'}
            >
              {updateTeamStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTeam?.status === 'approved' ? 'Confirm Approval' : 
               selectedTeam?.status === 'rejected' ? 'Confirm Rejection' :
               selectedTeam?.status === 'withdrawn' ? 'Confirm Withdrawal' :
               selectedTeam?.status === 'waitlisted' ? 'Confirm Waitlist' :
               selectedTeam?.status === 'registered' ? 'Reset Status' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              This will process a refund for {selectedTeam?.name}'s registration payment of {selectedTeam ? formatCurrency(selectedTeam.totalAmount || selectedTeam.registrationFee || 0) : '$0.00'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="partial-refund" 
                checked={isPartialRefund}
                onCheckedChange={(checked) => {
                  setIsPartialRefund(!!checked);
                  if (!checked) {
                    setRefundAmount("");
                  }
                }}
              />
              <Label htmlFor="partial-refund" className="cursor-pointer">
                Process partial refund
              </Label>
            </div>
            
            {isPartialRefund && (
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="refund-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={refundAmount}
                    onChange={(e) => {
                      // Ensure the value is positive and not greater than the registration fee
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      
                      if (!value) {
                        setRefundAmount("");
                      } else if (!isNaN(numValue) && numValue > 0) {
                        const maxAmount = selectedTeam ? (selectedTeam.totalAmount || selectedTeam.registrationFee || 0) / 100 : 0;
                        if (numValue <= maxAmount) {
                          setRefundAmount(value);
                        } else {
                          setRefundAmount(maxAmount.toString());
                        }
                      }
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPartialRefund && refundAmount && !isNaN(parseFloat(refundAmount)) ? (
                    <span>
                      Refunding <strong>${parseFloat(refundAmount).toFixed(2)}</strong> of {selectedTeam ? formatCurrency(selectedTeam.totalAmount || selectedTeam.registrationFee || 0) : '$0.00'}
                    </span>
                  ) : (
                    <span>Enter an amount to refund</span>
                  )}
                </div>
              </div>
            )}
            
            <Textarea 
              placeholder="Reason for refund (for internal records)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRefund}
              disabled={processRefundMutation.isPending || (isPartialRefund && (!refundAmount || isNaN(parseFloat(refundAmount))))}
              className="team-status-button team-edit-button"
            >
              {processRefundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isPartialRefund ? (
                'Process Partial Refund'
              ) : (
                'Process Full Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Details: {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Complete registration information for {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Status:</div>
                      <div className="col-span-2">
                        <Badge variant={
                          selectedTeam.status === 'approved' ? 'success' : 
                          selectedTeam.status === 'rejected' ? 'destructive' : 
                          'default'
                        }>
                          {selectedTeam.status?.toUpperCase() || 'REGISTERED'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Event:</div>
                      <div className="col-span-2">{selectedTeam.event?.name || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Age Group:</div>
                      <div className="col-span-2">{selectedTeam.ageGroup?.ageGroup || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Division:</div>
                      <div className="col-span-2">{selectedTeam.ageGroup?.divisionCode || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Submitted by:</div>
                      <div className="col-span-2">{selectedTeam.submitterEmail || selectedTeam.managerEmail}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Submission Date:</div>
                      <div className="col-span-2">{formatDate(selectedTeam.createdAt)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Payment Method:</div>
                      <div className="col-span-2">
                        <Badge variant={
                          selectedTeam.paymentStatus === 'paid' ? 'default' : 
                          selectedTeam.paymentStatus === 'refunded' ? 'outline' : 
                          'outline'
                        }>
                          {selectedTeam.paymentStatus || 'Unpaid'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Final Total:</div>
                      <div className="col-span-2">{formatCurrency(selectedTeam.totalAmount || selectedTeam.registrationFee || 0)}</div>
                    </div>
                    {selectedTeam.status === 'rejected' && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Rejection Reason:</div>
                        <div className="col-span-2">{selectedTeam.notes || 'No reason provided'}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Team Information</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTeamContactEditOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Contacts
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Team Name:</div>
                      <div className="col-span-2">{selectedTeam.name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Manager:</div>
                      <div className="col-span-2">{selectedTeam.managerName || selectedTeam.managerEmail}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Manager Email:</div>
                      <div className="col-span-2">{selectedTeam.managerEmail || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Manager Phone:</div>
                      <div className="col-span-2">{selectedTeam.managerPhone ? formatPhoneNumber(selectedTeam.managerPhone) : 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Head Coach:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.headCoachName || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Coach Email:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.headCoachEmail || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Coach Phone:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.headCoachPhone ? formatPhoneNumber(selectedTeam.coachData.headCoachPhone) : 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Asst. Coach:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.assistantCoachName || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Asst. Email:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.assistantCoachEmail || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Asst. Phone:</div>
                      <div className="col-span-2">{selectedTeam.coachData?.assistantCoachPhone ? formatPhoneNumber(selectedTeam.coachData.assistantCoachPhone) : 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Club/Org:</div>
                      <div className="col-span-2">{selectedTeam.clubName || 'N/A'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Team Roster ({selectedTeam.players ? selectedTeam.players.length : 0} players)
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="csv-upload-button"
                      onClick={() => setIsCsvUploadDialogOpen(true)}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Import CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="team-edit-button"
                      onClick={() => {
                        // Initialize a new blank player with emergency contact placeholders
                        setSelectedPlayer({
                          id: 0,
                          teamId: selectedTeam.id,
                          firstName: '',
                          lastName: '',
                          dateOfBirth: '',
                          jerseyNumber: '',
                          medicalNotes: '',
                          // Emergency contact information (required)
                          emergencyContactFirstName: '',
                          emergencyContactLastName: '',
                          emergencyContactPhone: '',
                          isActive: true
                        });
                        setIsAddPlayerMode(true);
                        setIsPlayerDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Player
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTeam.players && selectedTeam.players.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Date of Birth</TableHead>
                          <TableHead>Jersey #</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTeam.players.map((player: any) => (
                          <TableRow key={player.id}>
                            <TableCell>{player.firstName} {player.lastName}</TableCell>
                            <TableCell>{formatDate(player.dateOfBirth)}</TableCell>
                            <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                            <TableCell>{player.parentGuardianEmail || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="team-edit-button"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setIsAddPlayerMode(false);
                                    setIsPlayerDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  className="team-edit-button"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setIsDeletePlayerDialogOpen(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No players added to this team yet.
                    </div>
                  )}
                </CardContent>
              </Card>
                
              {/* Form Template Submissions */}
              <FormSubmissionsCard teamId={selectedTeam.id} />
              
              {/* Additional notes or special requirements */}
              {selectedTeam.specialRequirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedTeam.specialRequirements}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Payment & Fee Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Show original registration fee first */}
                    {selectedTeam.registrationFee && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Registration Fee:</div>
                        <div className="col-span-2">
                          {formatCurrency(selectedTeam.registrationFee)}
                        </div>
                      </div>
                    )}

                    {/* Show coupon discount if applied */}
                    {selectedTeam.appliedCoupon && (() => {
                      try {
                        const coupon = typeof selectedTeam.appliedCoupon === 'string' 
                          ? JSON.parse(selectedTeam.appliedCoupon) 
                          : selectedTeam.appliedCoupon;
                        
                        return (
                          <div className="grid grid-cols-3 gap-1">
                            <div className="font-medium">Coupon Applied:</div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                  {coupon.code}
                                </span>
                                <span className="text-green-600 font-medium">
                                  -{coupon.discountType === 'percentage' 
                                    ? `${coupon.amount}%` 
                                    : `$${coupon.amount.toFixed(2)}`}
                                </span>
                              </div>
                              {coupon.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {coupon.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } catch (e) {
                        return (
                          <div className="grid grid-cols-3 gap-1">
                            <div className="font-medium">Coupon Applied:</div>
                            <div className="col-span-2 text-sm text-muted-foreground">
                              Coupon information available (parsing error)
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {/* Show final total amount */}
                    <div className="grid grid-cols-3 gap-1 border-t pt-2">
                      <div className="font-medium">Total Amount:</div>
                      <div className="col-span-2 font-semibold text-blue-700">
                        {selectedTeam.totalAmount 
                          ? formatCurrency(selectedTeam.totalAmount) 
                          : selectedTeam.registrationFee 
                            ? formatCurrency(selectedTeam.registrationFee) 
                            : 'Not available'}
                      </div>
                    </div>
                    
                    {/* Fee Adjustment Button - only show for teams not yet approved and paid */}
                    {(selectedTeam.status !== 'approved' || selectedTeam.paymentStatus !== 'paid') && selectedTeam.totalAmount > 0 && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Fee Adjustment:</div>
                        <div className="col-span-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsFeeAdjustmentDialogOpen(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Adjust Registration Fee
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Payment Method:</div>
                      <div className="col-span-2">
                        <PaymentMethodDisplay team={selectedTeam} showCardDetails={true} />
                      </div>
                    </div>
                    
                    {selectedTeam.paymentIntentId && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Payment ID:</div>
                        <div className="col-span-2 font-mono text-xs bg-slate-50 p-1 rounded">
                          {selectedTeam.paymentIntentId}
                        </div>
                      </div>
                    )}
                    
                    {/* Payment Completion URL for teams that need payment */}
                    {(selectedTeam.paymentStatus === 'payment_required' || 
                      selectedTeam.paymentStatus === 'payment_method_invalid' ||
                      (selectedTeam.status === 'approved' && selectedTeam.paymentStatus !== 'paid') ||
                      (selectedTeam.totalAmount && selectedTeam.totalAmount > 0 && selectedTeam.paymentStatus !== 'paid')) && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Payment Setup:</div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-amber-700">
                              {selectedTeam.paymentStatus === 'payment_method_invalid' 
                                ? 'New payment method required' 
                                : 'Payment required'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={async () => {
                              try {
                                // Generate a new Setup Intent for payment completion
                                const response = await fetch(`/api/admin/teams/${selectedTeam.id}/generate-completion-url`, {
                                  method: 'POST'
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  // Show guidance if available, otherwise show error
                                  const message = errorData.guidance ? 
                                    `${errorData.error}\n\n${errorData.guidance}` : 
                                    (errorData.error || 'Failed to generate completion URL');
                                  throw new Error(message);
                                }
                                
                                const data = await response.json();
                                
                                if (data.completionUrl) {
                                  // Copy URL to clipboard
                                  await navigator.clipboard.writeText(data.completionUrl);
                                  const isLinkReplacement = data.replacingLinkPayment;
                                  toast({
                                    title: isLinkReplacement ? "Link Payment Replacement URL Generated" : "Completion URL Generated",
                                    description: isLinkReplacement 
                                      ? "New payment URL created for card payment (replacing Link). Send this to the team manager."
                                      : "Payment completion URL copied to clipboard. Send this to the team manager.",
                                  });
                                } else {
                                  // Show more specific error message with guidance if available
                                  const message = data.guidance ? 
                                    `${data.message || data.error}\n\n${data.guidance}` : 
                                    (data.error || data.message || 'No completion URL received');
                                  throw new Error(message);
                                }
                              } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : "Failed to generate completion URL";
                                toast({
                                  title: errorMessage.includes("ready for approval") ? "Team Ready for Approval" : "Error",
                                  description: errorMessage,
                                  variant: errorMessage.includes("ready for approval") ? "default" : "destructive",
                                });
                              }
                            }}
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Generate Payment Completion URL
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedTeam.paymentStatus === 'payment_method_invalid' 
                              ? `Previous payment method cannot be reused. Send this URL to ${selectedTeam.managerEmail} to provide a new payment method.`
                              : `Send this URL to ${selectedTeam.managerEmail} to complete payment setup`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedTeam.refundDate && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Refunded On:</div>
                        <div className="col-span-2">{formatDate(selectedTeam.refundDate)}</div>
                      </div>
                    )}
                    
                    {/* Fee breakdown section */}
                    {selectedTeam.selectedFeeIds && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium mb-2">Fee Breakdown</h4>
                        <div className="bg-slate-50 rounded-md p-2">
                          <p className="text-sm text-slate-500 mb-2">
                            Selected fees: {selectedTeam.selectedFeeIds.split(',').length}
                          </p>
                          
                          <DetailedFeeBreakdown 
            teamId={selectedTeam.id} 
            selectedFeeIds={selectedTeam.selectedFeeIds}
            totalAmount={selectedTeam.totalAmount}
            appliedCoupon={selectedTeam.appliedCoupon}
          />
                          
                          <div className="flex justify-between py-1 font-semibold mt-2 border-t border-slate-200 pt-2">
                            <span>Total</span>
                            <span>
                              {selectedTeam.totalAmount 
                                ? formatCurrency(selectedTeam.totalAmount) 
                                : selectedTeam.registrationFee 
                                  ? formatCurrency(selectedTeam.registrationFee) 
                                  : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Terms acknowledgment information */}
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Terms Acknowledged:</div>
                      <div className="col-span-2">
                        <Badge variant={selectedTeam.termsAcknowledged || selectedTeam.status === 'paid' ? 'success' : 'outline'}>
                          {selectedTeam.termsAcknowledged || selectedTeam.status === 'paid' ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    {selectedTeam.termsAcknowledgedAt && (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-medium">Acknowledged On:</div>
                        <div className="col-span-2">{formatDate(selectedTeam.termsAcknowledgedAt)}</div>
                      </div>
                    )}
                    <div className="pt-2">
                      {(selectedTeam.termsAcknowledged || selectedTeam.status === 'paid') && (
                        <div className="flex flex-col gap-2">
                          {selectedTeam.termsAcknowledgementRecord ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(`/api/teams/${selectedTeam.id}/terms-acknowledgment/download`, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Acknowledgment Document
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/teams/${selectedTeam.id}/terms-acknowledgment/generate`, {
                                    method: 'POST',
                                  });
                                  const data = await response.json();
                                  
                                  if (data.success && data.downloadUrl) {
                                    window.open(data.downloadUrl, '_blank');
                                    toast({
                                      title: "Success",
                                      description: "Terms acknowledgment document generated successfully",
                                    });
                                  } else {
                                    throw new Error(data.error || 'Failed to generate document');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: error instanceof Error ? error.message : "Failed to generate document",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Generate Acknowledgment Document
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <DialogFooter className="gap-2 flex-wrap">
                {/* Universal action buttons for all teams */}
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleStatusUpdate(selectedTeam, 'rejected');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject Team
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleStatusUpdate(selectedTeam, 'approved');
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve Team
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    const skipPayment = selectedTeam.payment_status === 'paid';
                    handleStatusUpdate(selectedTeam, 'approved', null, skipPayment, true); // skipEmail=true
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve Without Email
                </Button>
                
                {selectedTeam.payment_status === 'paid' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      handleStatusUpdate(selectedTeam, 'approved', null, true); // skipPayment=true
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve Without Payment
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleStatusUpdate(selectedTeam, 'withdrawn');
                  }}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Mark Withdrawn
                </Button>
                

                
                {/* Status-specific buttons */}
                {selectedTeam.status === 'approved' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      resendApprovalEmailMutation.mutate(selectedTeam.id);
                    }}
                    disabled={resendApprovalEmailMutation.isPending}
                  >
                    {resendApprovalEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-1" />
                    )}
                    Resend Approval Email
                  </Button>
                )}
                
                {selectedTeam.paymentStatus === 'paid' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      handleRefundRequest(selectedTeam);
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Process Refund
                  </Button>
                )}
                
                {(selectedTeam.payment_status === 'payment_pending' || 
                  selectedTeam.payment_status === 'payment_failed' || 
                  selectedTeam.payment_status === 'setup_intent_completed') && 
                 (selectedTeam.paymentIntentId || selectedTeam.setupIntentId) && (
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        // Determine which endpoint to use based on payment method
                        const endpoint = selectedTeam.paymentIntentId 
                          ? `/api/admin/teams/${selectedTeam.id}/generate-payment-intent-completion-url`
                          : `/api/admin/teams/${selectedTeam.id}/generate-completion-url`;
                        
                        const response = await fetch(endpoint, {
                          method: 'POST',
                        });
                        const data = await response.json();
                        
                        if (data.success && data.completionUrl) {
                          navigator.clipboard.writeText(data.completionUrl);
                          toast({
                            title: "Success",
                            description: "Payment completion URL copied to clipboard",
                          });
                        } else {
                          // Check if we should refresh the page
                          if (data.shouldRefresh) {
                            teamsQuery.refetch();
                            setIsDetailsDialogOpen(false);
                            toast({
                              title: "Payment Complete",
                              description: "Payment has been completed successfully",
                            });
                            return;
                          }
                          throw new Error(data.error || 'Failed to generate completion URL');
                        }
                      } catch (error) {
                        toast({
                          title: "Error", 
                          description: error instanceof Error ? error.message : "Failed to generate completion URL",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Link className="h-4 w-4 mr-1" />
                    Generate Payment URL
                  </Button>
                )}
                
                {/* Force Payment URL Generation - Override for problematic teams */}
                <Button 
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={async () => {
                    if (!confirm(`Force generate payment URL for "${selectedTeam.name}"?\n\nThis will bypass all payment status checks and create a new payment URL regardless of current status.`)) {
                      return;
                    }
                    
                    try {
                      // Determine which endpoint to use based on payment method
                      const endpoint = selectedTeam.paymentIntentId 
                        ? `/api/admin/teams/${selectedTeam.id}/generate-payment-intent-completion-url`
                        : `/api/admin/teams/${selectedTeam.id}/generate-completion-url`;
                      
                      const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ forceGenerate: true }),
                      });
                      const data = await response.json();
                      
                      if (data.success && data.completionUrl) {
                        navigator.clipboard.writeText(data.completionUrl);
                        toast({
                          title: "Success - Override Applied",
                          description: "Payment URL generated (bypassed status checks) and copied to clipboard",
                        });
                      } else {
                        throw new Error(data.error || 'Failed to generate completion URL');
                      }
                    } catch (error) {
                      toast({
                        title: "Error", 
                        description: error instanceof Error ? error.message : "Failed to force generate completion URL",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Force Payment URL
                </Button>

                
                <Button 
                  variant="outline" 
                  onClick={handleEditTeam}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Team
                </Button>
                
                {/* Delete button only for teams in registered/pending review status */}
                {selectedTeam.status === 'registered' && (
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete team "${selectedTeam.name}"? This action cannot be undone.`)) {
                        deleteTeamMutation.mutate(selectedTeam.id);
                        setIsDetailsDialogOpen(false);
                      }
                    }}
                    disabled={deleteTeamMutation.isPending}
                  >
                    {deleteTeamMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Team
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Team Edit Modal */}
      {selectedTeam && (
        <TeamModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            // Refresh the team data after edit
            if (selectedTeam?.id) {
              teamsQuery.refetch();
            }
          }}
          team={selectedTeam}
        />
      )}

      {/* Add/Edit Player Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAddPlayerMode ? 'Add Player' : 'Edit Player'}</DialogTitle>
            <DialogDescription>
              {isAddPlayerMode 
                ? 'Add a new player to the team roster.' 
                : 'Edit player information.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlayer && (
            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (isAddPlayerMode) {
                  addPlayerMutation.mutate(selectedPlayer);
                } else {
                  updatePlayerMutation.mutate({
                    playerId: selectedPlayer.id,
                    playerData: selectedPlayer
                  });
                }
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={selectedPlayer.firstName || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      firstName: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={selectedPlayer.lastName || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      lastName: e.target.value
                    })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date"
                    value={selectedPlayer.dateOfBirth ? selectedPlayer.dateOfBirth.substring(0, 10) : ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      dateOfBirth: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jerseyNumber">Jersey Number</Label>
                  <Input 
                    id="jerseyNumber" 
                    value={selectedPlayer.jerseyNumber || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      jerseyNumber: e.target.value
                    })}
                  />
                </div>
              </div>
              
              {/* Position field removed as requested */}
              
              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Medical Notes</Label>
                <Textarea 
                  id="medicalNotes" 
                  placeholder="Any medical conditions, allergies, or special needs..."
                  value={selectedPlayer.medicalNotes || ''}
                  onChange={(e) => setSelectedPlayer({
                    ...selectedPlayer,
                    medicalNotes: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-4">
                {/* Parent/Guardian Information section removed to simplify data collection */}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Emergency Contact</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactFirstName">First Name * (Required)</Label>
                    <Input 
                      id="emergencyContactFirstName" 
                      value={selectedPlayer.emergencyContactFirstName || ''}
                      onChange={(e) => setSelectedPlayer({
                        ...selectedPlayer,
                        emergencyContactFirstName: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactLastName">Last Name * (Required)</Label>
                    <Input 
                      id="emergencyContactLastName" 
                      value={selectedPlayer.emergencyContactLastName || ''}
                      onChange={(e) => setSelectedPlayer({
                        ...selectedPlayer,
                        emergencyContactLastName: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Phone * (Required)</Label>
                  <Input 
                    id="emergencyContactPhone" 
                    type="tel"
                    value={selectedPlayer.emergencyContactPhone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setSelectedPlayer({
                        ...selectedPlayer,
                        emergencyContactPhone: formatted
                      });
                    }}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPlayerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPlayerMutation.isPending || updatePlayerMutation.isPending}
                >
                  {(addPlayerMutation.isPending || updatePlayerMutation.isPending) && 
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  }
                  {isAddPlayerMode ? 'Add Player' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Player Confirmation Dialog */}
      <Dialog open={isDeletePlayerDialogOpen} onOpenChange={setIsDeletePlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedPlayer?.firstName} {selectedPlayer?.lastName} from the team roster?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletePlayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletePlayerMutation.mutate(selectedPlayer.id)}
              disabled={deletePlayerMutation.isPending}
            >
              {deletePlayerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* CSV Upload Dialog */}
      <Dialog open={isCsvUploadDialogOpen} onOpenChange={setIsCsvUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Player Roster CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file containing player information to add multiple players at once.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam && (
            <CsvUploader 
              teamId={selectedTeam.id} 
              onUploadSuccess={(players) => {
                toast({
                  title: "Upload Successful",
                  description: `Added ${players.length} players to the team.`,
                });
                setIsCsvUploadDialogOpen(false);
                playersQuery.refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Team CSV Import Dialog */}
      <Dialog open={isTeamCsvImportDialogOpen} onOpenChange={setIsTeamCsvImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Teams</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple teams at once into an event.
            </DialogDescription>
          </DialogHeader>
          
          {/* Event Selector for Team Import */}
          <div className="mb-4">
            <Label htmlFor="importEventSelect">Select Event</Label>
            <Select 
              value={selectedEvent !== 'all' ? selectedEvent : ''} 
              onValueChange={(value) => setSelectedEvent(value)}
            >
              <SelectTrigger id="importEventSelect" className="w-full">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(importEligibleEventsQuery.data) 
                  ? importEligibleEventsQuery.data.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))
                  : Array.isArray(importEligibleEventsQuery.data?.events)
                    ? importEligibleEventsQuery.data.events.map((event: any) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))
                    : (<SelectItem value="none" disabled>No events available</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          
          {selectedEvent && selectedEvent !== 'all' ? (
            <TeamCsvUploader
              eventId={parseInt(selectedEvent)}
              onUploadSuccess={(teams) => {
                setIsTeamCsvImportDialogOpen(false);
                queryClient.invalidateQueries({queryKey: ['admin', 'teams']});
                
                toast({
                  title: "Teams Imported",
                  description: `Successfully imported ${teams.length} teams to the event.`
                });
              }}
            />
          ) : (
            <Alert className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Event Required</AlertTitle>
              <AlertDescription>
                Please select an event to import teams to.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Approval Dialog */}
      <Dialog open={isBulkApprovalDialogOpen} onOpenChange={setIsBulkApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve Teams</DialogTitle>
            <DialogDescription>
              You are about to approve {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''}. 
              This will process payments and send confirmation emails.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkApprovalNotes">Notes (optional)</Label>
              <Textarea
                id="bulkApprovalNotes"
                placeholder="Add notes that will be included in approval emails..."
                value={bulkApprovalNotes}
                onChange={(e) => setBulkApprovalNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkApproval}
              disabled={bulkApproveTeamsMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {bulkApproveTeamsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Confirm Bulk Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Rejection Dialog */}
      <Dialog open={isBulkRejectionDialogOpen} onOpenChange={setIsBulkRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reject Teams</DialogTitle>
            <DialogDescription>
              You are about to reject {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''}. 
              This will send rejection notification emails to team managers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkRejectionNotes">Notes (optional)</Label>
              <Textarea
                id="bulkRejectionNotes"
                placeholder="Add notes that will be included in rejection emails..."
                value={bulkRejectionNotes}
                onChange={(e) => setBulkRejectionNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkRejectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkRejection}
              disabled={bulkRejectTeamsMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkRejectTeamsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <X className="h-4 w-4 mr-2" />
              Confirm Bulk Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Adjustment Dialog */}
      <FeeAdjustmentDialog
        team={selectedTeam}
        open={isFeeAdjustmentDialogOpen}
        onOpenChange={(open) => {
          setIsFeeAdjustmentDialogOpen(open);
          if (!open) {
            // Refresh teams data when dialog closes to show updated amounts
            teamsQuery.refetch();
          }
        }}
      />

      {/* Team Contact Edit Dialog */}
      <TeamContactEditDialog
        team={selectedTeam}
        open={isTeamContactEditOpen}
        onOpenChange={setIsTeamContactEditOpen}
        onSubmit={(contactData) => updateTeamContactsMutation.mutate(contactData)}
        isSubmitting={updateTeamContactsMutation.isPending}
      />
    </>
  );
}

function MembersView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Member Management</h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <Members />
        </CardContent>
      </Card>
    </div>
  );
}

// Navigation Button with permission check
interface NavigationButtonProps {
  view: View;
  activeView: View;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  permission: string;
}

function NavigationButton({ view, activeView, onClick, icon, label, permission }: NavigationButtonProps) {
  const { hasPermission } = usePermissions();
  
  // Removing permission check to allow access to all navigation items
  // if (!hasPermission(permission)) {
  //   return null;
  // }
  
  return (
    <Button
      variant={activeView === view ? 'secondary' : 'ghost'}
      className="w-full justify-start"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

interface AdminDashboardProps {
  initialView?: View;
}

function AdminDashboard({ initialView = 'events' }: AdminDashboardProps) {
  const { user, logout, isLoading: isUserLoading } = useUser();
  const { hasPermission, hasRole } = usePermissions();
  const { isTournamentDirector, assignedEvents, hasEventAccess } = useTournamentDirector();
  const [location, navigate] = useLocation();
  const [activeView, setActiveView] = useState<View>(initialView);
  // Show welcome banner only once per login session
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if we've already shown the banner in this session
    const welcomeShown = sessionStorage.getItem('welcomeBannerShown');
    return !welcomeShown;
  });
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUpdatesLog, setShowUpdatesLog] = useState(false);
  const [showInternalOps, setShowInternalOps] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [showEmulationModal, setShowEmulationModal] = useState(false);
  const { setAppearance, currentAppearance } = useTheme();
  const [theme, setTheme] = useState(currentAppearance);
  const queryClient = useQueryClient();
  const { settings, isLoading: isSettingsLoading } = useOrganizationSettings();

  // Track initial load completion
  useEffect(() => {
    if (!isUserLoading && !isSettingsLoading && !initialLoadComplete) {
      // Mark initial loading as complete after both user and settings are loaded
      setInitialLoadComplete(true);
    }
  }, [isUserLoading, isSettingsLoading, initialLoadComplete]);
  
  // Update activeView based on current location/URL
  useEffect(() => {
    // Extract view from URL path
    const path = location.split('/');
    if (path.length >= 2 && path[1] === 'admin') {
      // URL format should be /admin/[view]
      let urlView = path[2];
      
      // Handle special cases for kebab-case to camelCase conversion
      if (urlView === 'form-templates') {
        urlView = 'formTemplates';
      }
      
      // Handle file-manager URL path
      if (urlView === 'file-manager') {
        urlView = 'files';
      }
      
      if (urlView && urlView !== activeView) {
        console.log('Updating activeView from URL:', urlView);
        setActiveView(urlView as View);
      }
    }
  }, [location, activeView]);

  // Prefetch critical data on initial load
  useEffect(() => {
    if (user && user.isAdmin) {
      // Prefetch events data which is shown on the default dashboard view
      queryClient.prefetchQuery({
        queryKey: ['/api/admin/events'],
        queryFn: async () => {
          const response = await fetch('/api/admin/events', {
            credentials: 'include' // Include cookies for authentication
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        },
        staleTime: 5 * 60 * 1000 // 5 minutes - match server cache time
      }).catch(error => console.error('Failed to prefetch events:', error));
    }
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) {
      return; // Wait for user data to load
    }
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  // Show a loading state during the initial load
  if (isUserLoading || !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If user data has loaded but no user is found, show the loading screen
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    setShowLogoutOverlay(true);
  };

  const handleAppearanceToggle = async () => {
    const newAppearance = currentAppearance === 'dark' ? 'light' : 'dark';
    await setAppearance(newAppearance);
  };

  const renderView = () => {
    // First verify permissions for the active view
    const permissionMap = {
      'administrators': 'view_administrators',
      'events': 'view_events',
      'teams': 'view_teams',
      'complexes': 'view_complexes',
      'households': 'view_households',
      'scheduling': 'view_scheduling',
      'settings': 'view_organization_settings',
      'reports': 'view_reports',
      'files': 'view_files',
      'coupons': 'view_coupons',
      'formTemplates': 'view_form_templates',
      'formSubmissions': 'view_form_templates',
      'roles': 'view_role_permissions',
      'members': 'view_members'
    };
    
    // Get the required permission for the active view
    const permissionRequired = permissionMap[activeView as keyof typeof permissionMap];
    
    // If user is a super admin, skip permission check
    if (user?.isAdmin && hasRole('super_admin')) {
      // SUPER ADMIN BYPASS - Always render content for super admins
      return renderViewContent(activeView);
    }
    
    // Check if the view requires a permission check
    if (permissionRequired) {
      // Always render the view content to avoid access restrictions
      return renderViewContent(activeView);
      
      // Original code (commented out):
      // If it's the account view or user doesn't need permission, render directly
      // if (activeView === 'account' || hasPermission(permissionRequired as any)) {
      //   return renderViewContent(activeView);
      // }
      
      // Otherwise show restricted access message
      // return (
      //   <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      //     <Shield className="h-12 w-12 text-muted-foreground" />
      //     <h2 className="text-xl font-semibold">Access Restricted</h2>
      //     <p className="text-muted-foreground">You don't have permission to view this content.</p>
      //   </div>
      // );
    }
    
    // If we got here with no permission check needed, render view
    return renderViewContent(activeView);
  };
  
  // Helper function to render the appropriate view content
  const renderViewContent = (view: View) => {
    switch (view) {
      case 'administrators':
        return <AdministratorsView />;
      case 'events':
        return <EventsView />;
      case 'teams':
        return <TeamsView />;
      case 'complexes':
        return <ComplexesView />;
      case 'households':
        return <HouseholdsView />;
      case 'scheduling':
        return <SchedulingView />;
      case 'settings':
        if (activeSettingsView === 'general') {
          return <GeneralSettingsView />;
        }
        return <SettingsView activeSettingsView={activeSettingsView} />;
      case 'reports':
        return <ReportsView />;
      case 'members':
        return <MembersView />;
      case 'account':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }>
            <MyAccount />
          </Suspense>
        );
      case 'files':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">File Manager</h2>
            </div>
            <FileManager />
          </div>
        );
      /* Coupons are managed within events, not as a standalone view */
      case 'formTemplates':
        return <FormTemplatesView />;
      case 'formSubmissions':
        return <FormSubmissionsReport />;
      case 'roles':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Role Permissions</h2>
              <p className="text-muted-foreground">Configure permissions for administrator roles</p>
            </div>
            <RolePermissionsManager />
          </div>
        );
      default:
        return <div>Feature coming soon</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatedSidebar title="Admin Dashboard" icon={<Calendar className="h-5 w-5 text-primary" />}>
        <div className="space-y-1">
            {/* Tournament Directors only see Events and Account */}
            {isTournamentDirector && !hasRole('super_admin') ? (
              <>
                <AnimatedNavigationButton
                  view="events"
                  activeView={activeView}
                  onClick={() => navigate('/admin/events')}
                  icon={<Calendar className="h-4 w-4" />}
                  label="Events"
                  permission="view_events"
                  index={0}
                />
                <AnimatedNavigationButton
                  view="account"
                  activeView={activeView}
                  onClick={() => navigate('/admin/account')}
                  icon={<User className="h-4 w-4" />}
                  label="My Account"
                  permission="view_account"
                  index={1}
                />
              </>
            ) : (
              <>
                <AnimatedNavigationButton
                  view="formTemplates"
                  activeView={activeView}
                  onClick={() => navigate('/admin/form-templates')}
                  icon={<FormInput className="h-4 w-4" />}
                  label="Form Templates"
                  permission="view_form_templates"
                  index={0}
                />
                
                <AnimatedNavigationButton
                  view="events"
                  activeView={activeView}
                  onClick={() => navigate('/admin/events')}
                  icon={<Calendar className="h-4 w-4" />}
                  label="Events"
                  permission="view_events"
                  index={1}
                />
                
                <AnimatedNavigationButton
                  view="teams"
                  activeView={activeView}
                  onClick={() => navigate('/admin/teams')}
                  icon={<Users className="h-4 w-4" />}
                  label="Teams"
                  permission="view_teams"
                  index={2}
                />

                <AnimatedNavigationButton
                  view="administrators"
                  activeView={activeView}
                  onClick={() => navigate('/admin/administrators')}
                  icon={<Shield className="h-4 w-4" />}
                  label="Administrators"
                  permission="view_administrators"
                  index={3}
                />
                
                <AnimatedNavigationButton
                  view="complexes"
                  activeView={activeView}
                  onClick={() => navigate('/admin/complexes')}
                  icon={<Building2 className="h-4 w-4" />}
                  label="Field Complexes"
                  permission="view_complexes"
                />
                
                <AnimatedNavigationButton
                  view="complex-map"
                  activeView={activeView}
                  onClick={() => navigate('/admin/complex-locations')}
                  icon={<MapPin className="h-4 w-4" />}
                  label="Complex Locations"
                  permission="view_complexes"
                />
                
                <AnimatedNavigationButton
                  view="households"
                  activeView={activeView}
                  onClick={() => navigate('/admin/households')}
                  icon={<Home className="h-4 w-4" />}
                  label="MatchPro Client"
                  permission="view_households"
                />
                
                <AnimatedNavigationButton
                  view="scheduling"
                  activeView={activeView}
                  onClick={() => navigate('/admin/scheduling')}
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Scheduling"
                  permission="view_scheduling"
                />
                
                <AnimatedNavigationButton
                  view="reports"
                  activeView={activeView}
                  onClick={() => navigate('/admin/reports')}
                  icon={<FileText className="h-4 w-4" />}
                  label="Reports and Financials"
                  permission="view_reports"
                />
                
                <AnimatedNavigationButton
                  view="files"
                  activeView={activeView}
                  onClick={() => navigate('/admin/file-manager')}
                  icon={<ImageIcon className="h-4 w-4" />}
                  label="File Manager"
                  permission="view_files"
                />
                
                <AnimatedNavigationButton
                  view="members"
                  activeView={activeView}
                  onClick={() => navigate('/admin/members')}
                  icon={<Users className="h-4 w-4" />}
                  label="Members"
                  permission="view_members"
                />
                
                <AnimatedNavigationButton
                  view="formSubmissions"
                  activeView={activeView}
                  onClick={() => setActiveView('formSubmissions')}
                  icon={<FileText className="h-4 w-4" />}
                  label="Form Submissions"
                  permission="view_form_templates"
                />
                
                {/* Coupons are managed within events, so no standalone navigation is needed */}
                
                <AnimatedNavigationButton
                  view="roles"
                  activeView={activeView}
                  onClick={() => navigate('/admin/roles')}
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Role Permissions"
                  permission="view_role_permissions"
                />
              </>
            )}

            {/* Settings - Hide from Tournament Directors */}
            {!(isTournamentDirector && !hasRole('super_admin')) && (
              <Collapsible
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                className="space-y-2"
              >
              <CollapsibleTrigger asChild>
                <Button
                  variant={activeView === 'settings' ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                >
                  <span className="flex items-center">
                    <Settings className="h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isSettingsOpen ? 'rotate-90' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-4">
                {/* Removed permission check to allow access */}
                <Button
                  variant="ghost"
                  className="w-full justify-start relative overflow-hidden group"
                  style={{
                    backgroundColor: activeSettingsView === 'general' 
                      ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                      : 'transparent',
                    color: activeSettingsView === 'general'
                      ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                      : 'var(--admin-nav-text, inherit)',
                  }}
                  onClick={() => {
                    navigate('/admin/settings');
                    setActiveSettingsView('general');
                  }}
                >
                  <Settings className="h-4 w-4" />
                  General
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start relative overflow-hidden group"
                  style={{
                    backgroundColor: activeSettingsView === 'email' 
                      ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                      : 'transparent',
                    color: activeSettingsView === 'email'
                      ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                      : 'var(--admin-nav-text, inherit)',
                  }}
                  onClick={() => {
                    navigate('/admin/sendgrid-setup');
                    setActiveSettingsView('email');
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Email Configuration
                </Button>
              </CollapsibleContent>
            </Collapsible>
            )}

            {/* Account */}
            <Button
              variant="ghost"
              className="w-full justify-start relative overflow-hidden group"
              style={{
                backgroundColor: activeView === 'account' 
                  ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                  : 'transparent',
                color: activeView === 'account'
                  ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                  : 'var(--admin-nav-text, inherit)',
              }}
              onClick={() => navigate('/admin/account')}
            >
              <User className="h-4 w-4" />
              My Account
            </Button>

            <div className="flex flex-col space-y-3 mt-auto mb-4 px-2">
              <div className="border-t border-gray-700 my-2 pt-4"></div>

              
              <Button 
                onClick={handleLogout} 
                className="w-full bg-gray-800 text-gray-300 hover:bg-red-900 hover:text-white transition-colors border-0 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </div>
                  <div className="bg-red-800 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Button>
            </div>
          </div>
      </AnimatedSidebar>

      {/* Main Content */}
      <AnimatedContent>
        {/* Use the imported AdminBanner component that includes the ViewToggle */}
        <AdminBanner />
        <div className="p-8 pattern-bg">
          {/* Display new registration notifications */}
          <NewRegistrationsBanner />
          {/* Enhanced dashboard with subtle pattern background */}

          {/* Welcome Card with Animation */}
          {showWelcome && (
            <AnimatedContainer animation="scale" delay={0.1}>
              <div className="mb-6 relative rounded-lg overflow-hidden shadow-lg" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(48, 46, 158, 0.65), rgba(48, 46, 158, 1))',
                  padding: '1.5rem'
                }}
              >
                <button 
                  onClick={() => {
                    // Store in session storage that banner has been shown
                    sessionStorage.setItem('welcomeBannerShown', 'true');
                    // Hide the banner
                    setShowWelcome(false);
                  }}
                  className="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-full z-10"
                  style={{ color: 'white' }}
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  >
                    <UserCircle className="h-7 w-7" style={{ color: 'white' }} />
                  </motion.div>
                  <div>
                    <motion.h2 
                      className="text-2xl font-bold"
                      style={{ color: 'white' }}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      Welcome back, {user?.firstName}!
                    </motion.h2>
                    <motion.p 
                      style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      Manage your organization's activities and settings from this dashboard.
                    </motion.p>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div 
                  className="absolute top-0 right-0 w-64 h-full opacity-10" 
                  style={{ 
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
                    transform: 'translateX(20%)'
                  }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-32 h-32 opacity-10" 
                  style={{ 
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
                    transform: 'translateY(40%)'
                  }}
                />
              </div>
            </AnimatedContainer>
          )}

          {renderView()}
        </div>

        {/* Internal Operations Panel */}
        {showInternalOps && (
          <InternalOperationsPanel
            setActiveView={setActiveView}
            openSettings={(section) => {
              setIsSettingsOpen(true);
              setActiveSettingsView(section as SettingsView);
            }}
          />
        )}
      </AnimatedContent>
      {showLogoutOverlay && (
        <LogoutOverlay onFinished={() => {
          // Initiate logout call but don't await it, in case it's stuck or taking too long
          console.log("Initiating logout process...");
          
          // Broadcast a logout event to all tabs - this helps with multi-tab logout
          try {
            // Create a broadcast channel for cross-tab communication
            const broadcastChannel = new BroadcastChannel('app-logout');
            // Send a logout message to all tabs
            broadcastChannel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
            // Close the channel
            broadcastChannel.close();
          } catch (err) {
            console.warn('BroadcastChannel not supported or failed', err);
          }
          
          // Make the actual logout API call
          logout().catch(e => console.error("API logout error:", e));
          
          // Don't wait for API call to complete, immediately continue with cleanup
          console.log("Performing client-side logout cleanup");
          
          // Clear all storage to reset application state
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies (all of them to be thorough)
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
          
          // Set cache control headers
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Cache-Control';
          meta.content = 'no-store, no-cache, must-revalidate, max-age=0';
          document.head.appendChild(meta);
          
          const pragmaMeta = document.createElement('meta');
          pragmaMeta.httpEquiv = 'Pragma';
          pragmaMeta.content = 'no-cache';
          document.head.appendChild(pragmaMeta);
          
          // Use our dedicated logout page to ensure proper session clearing
          console.log("Redirecting to dedicated logout handler...");
          // Set a flag to prevent potential infinite loops
          sessionStorage.setItem('admin_logout_initiated', Date.now().toString());
          window.location.href = "/logout";
        }} />
      )}
      
      {/* Emulation Dialog for Super Admins */}
      {user && user.isAdmin && hasPermission('emulate_users') && (
        <Dialog open={showEmulationModal} onOpenChange={setShowEmulationModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>User Emulation</DialogTitle>
            </DialogHeader>
            <EmulationManager />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SettingsView({ activeSettingsView }: { activeSettingsView: SettingsView }) {
  const { hasPermission, hasRole } = usePermissions();
  const { user } = useUser();
  
  // Always render settings content regardless of permissions
  return renderSettingsContent(activeSettingsView);
  
  // Original code (commented out):
  // Permission mapping for different settings views
  // const permissionMap = {
  //   'general': 'view_organization_settings'
  // };
  
  // Super admin always has access to all settings
  // if (user?.isAdmin && hasRole('super_admin')) {
  //   // Render appropriate settings content based on active tab
  //   return renderSettingsContent(activeSettingsView);
  // }
  
  // Check if user has permission to access the requested settings view
  // const requiredPermission = permissionMap[activeSettingsView as keyof typeof permissionMap];
  // if (requiredPermission && !hasPermission(requiredPermission as any)) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
  //       <Shield className="h-12 w-12 text-muted-foreground" />
  //       <h2 className="text-xl font-semibold">Access Restricted</h2>
  //       <p className="text-muted-foreground">You don't have permission to access these settings.</p>
  //     </div>
  //   );
  // }
  
  // If we made it here, render the appropriate settings content
  // return renderSettingsContent(activeSettingsView);
}

// Helper function to render settings content 
function renderSettingsContent(settingsView: SettingsView) {
  
  switch (settingsView) {
    case 'general':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">General Settings</h2>
          <GeneralSettingsView />
        </div>
      );
    default:
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <p>Settings content will be implemented here</p>
            </CardContent>
          </Card>
        </div>
      );
  }
}

function ThemeEditor() {
  const [themeColors, setThemeColors] = useState({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#4CAF50',
    // Add more colors as needed
  });

  const handleColorChange = (color: string, value: string) => {
    setThemeColors({ ...themeColors, [color]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Theme Editor</h2>
      <div className="space-y-2">
        <div>
          <Label htmlFor="backgroundColor">Background Color</Label>
          <Input
            id="backgroundColor"
            type="color"
            value={themeColors.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="textColor">Text Color</Label>
          <Input
            id="textColor"
            type="color"
            value={themeColors.textColor}
            onChange={(e) => handleColorChange('textColor', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="buttonColor">Button Color</Label>
          <Input
            id="buttonColor"
            type="color"
            value={themeColors.buttonColor}
            onChange={(e) => handleColorChange('buttonColor', e.target.value)}
          />
        </div>
        {/* Add more color pickers as needed */}
      </div>
      <Button onClick={() => {
        // Apply theme changes here
        console.log("Theme updated:", themeColors);
      }}>
        Apply Theme
      </Button>
    </div>
  );
}

interface SelectCoupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  amount: number;
  expirationDate: string;
  usageCount: number;
  maxUses: number | null;
  isActive: boolean;
  description: string;
  eventId?: number;
}

function CouponManagement() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<SelectCoupon | null>(null);
  const queryClient = useQueryClient();
  const [, params] = useLocation();
  const eventId = params?.split('/')[2] || '';

  const couponsQuery = useQuery({
    queryKey: ['/api/admin/coupons', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/coupons?eventId=${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return response.json();
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: number) => {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete coupon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/coupons', eventId] as any);
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditCoupon = (coupon: SelectCoupon) => {
    setSelectedCoupon(coupon);
    setIsAddModalOpen(true);
  };

  const handleDeleteCoupon = async (couponId: number) => {
    try {
      await deleteCouponMutation.mutateAsync(couponId);
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  // Use PermissionGuard for consistent permission handling
  return (
    <PermissionGuard
      permission={"view_coupons" as any}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to view coupons.</p>
        </div>
      }
    >
      {couponsQuery.isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold section-header">Coupon Management</h2>
            {hasPermission('create_coupons' as any) && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            )}
          </div>

          <Card className="enhanced-card">
            <CardContent className="p-0">
              <Table className="enhanced-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsQuery.data?.map((coupon: SelectCoupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.discountType === 'percentage' ? 'secondary' : 'outline'}>
                          {coupon.discountType === 'percentage' ? `${coupon.amount}%` : `$${coupon.amount}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{coupon.amount}</TableCell>
                      <TableCell>
                        {coupon.expirationDate ? 
                          new Date(coupon.expirationDate).toLocaleDateString() : 
                          'No expiration'
                        }
                      </TableCell>
                      <TableCell>
                        {coupon.usageCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                      </TableCell>
                      <TableCell>{coupon.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission('edit_coupons' as any) && (
                              <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission('edit_coupons' as any) && hasPermission('delete_coupons' as any) && (
                              <DropdownMenuSeparator />
                            )}
                            {hasPermission('delete_coupons' as any) && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Commented out as CouponModal might not be defined
          <CouponModal
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            eventId={eventId}
            couponToEdit={selectedCoupon}
          />
          */}
        </>
      )}
    </PermissionGuard>
  );
}

// Navigation items filtered based on user role
const getNavigationItems = (isTournamentDirector: boolean, hasRole: (role: string) => boolean) => {
  const allItems = [
    { icon: Shield, label: "Administrators", value: "administrators" as const },
    { icon: Calendar, label: "Events", value: "events" as const },
    { icon: Users, label: "Teams", value: "teams" as const },
    { icon: Building2, label: "Field Complexes", value: "complexes" as const },
    { icon: Home, label: "MatchPro Client", value: "households" as const },
    { icon: CalendarDays, label: "Scheduling", value: "scheduling" as const },
    { icon: FileText, label: "Reports and Financials", value: "reports" as const },
    { icon: ImageIcon, label: "File Manager", value: "files" as const },
    { icon: Ticket, label: "Coupons", value: "coupons" as const },
    { icon: FormInput, label: "Form Templates", value: "formTemplates" as const },
    { icon: FileText, label: "Form Submissions", value: "formSubmissions" as const },
    { icon: KeyRound, label: "Role Permissions", value: "roles" as const },
    { icon: UserRound, label: "Members", value: "members" as const },
    { icon: User, label: "My Account", value: "account" as const },
  ];

  // If user is Tournament Director (and not Super Admin), only show Events and My Account
  if (isTournamentDirector && !hasRole('super_admin')) {
    return allItems.filter(item => 
      item.value === 'events' || item.value === 'account'
    );
  }

  return allItems;
};

export default AdminDashboard;