import { useState, useMemo, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Link2, X, Ticket, Plus, Mail, KeyRound, Check, RefreshCcw, UserMinus, RotateCcw, 
  Pencil, PlusCircle, CalendarRange, UserRoundPlus, ClipboardX, ArrowLeft,
  Upload
} from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import { LogoutOverlay } from "@/components/ui/logout-overlay";

// Format currency values in dollars with 2 decimal places
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  // Convert cents to dollars and format with 2 decimal places
  return `$${(amount / 100).toFixed(2)}`;
}

import {
  Calendar,
  Shield,
  UserPlus,
  Home,
  LogOut,
  AlertTriangle,
  User,
  UserRound,
  Palette,
  ChevronRight,
  CreditCard,
  Search,
  ClipboardList,
  MoreHorizontal,
  Building2,
  MessageSquare,
  Trophy,
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
  CalendarDays,
  ImageIcon,
  FormInput,
  Bell,
  Moon,
  Sun,
  Trash2,
  WandSparkles,
  Sparkles,
  Wand2,
  CalendarIcon,
  Map,
  Download,
  Trash,
  FileUp,
  FileText,
  Loader2
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
import ScheduleVisualization from "@/components/ScheduleVisualization";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminModal } from "@/components/admin/AdminModal";
import { ComplexEditor } from "@/components/ComplexEditor";
import { FieldEditor } from "@/components/FieldEditor";
import { UpdatesLogModal } from "@/components/admin/UpdatesLogModal";
import { useDropzone } from 'react-dropzone';
import { FileManager } from "@/components/admin/FileManager.tsx";
import Members from "@/components/admin/Members";
import { FormTemplatesView } from "@/components/admin/FormTemplatesView"; // Import the component
import { AccountingCodeModal } from "@/components/admin/AccountingCodeModal";
import FormTemplateEditPage from "@/pages/form-template-edit";
import FormTemplateCreatePage from "@/pages/form-template-create";
import { InternalOperationsPanel } from "@/components/admin/InternalOperationsPanel"; // Added import
import { StripeSettingsView } from "@/components/admin/StripeSettingsView"; // Added import
import RolePermissionsManager from "@/components/admin/RolePermissionsManager"; // Added import
import { AdminBanner } from "@/components/admin/AdminBanner"; // Import the AdminBanner component
import { Toggle } from '@/components/ui/toggle';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'files' | 'formTemplates' | 'roles' | 'members';
type SettingsView = 'branding' | 'general' | 'payments' | 'styling';
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
              <Button variant="outline" onClick={() => navigate("/admin/events/preview")}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Registration
              </Button>
            </motion.div>
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
      const response = await fetch('/api/admin/administrators');
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
  const { isExporting, startExport } = useExportProcess();
  const [isAccountingCodeModalOpen, setIsAccountingCodeModalOpen] = useState(false);
  const [selectedAccountingCode, setSelectedAccountingCode] = useState<{
    id: number;
    code: string;
    name: string;
    description?: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const accountingCodesQuery = useQuery({
    queryKey: ['/api/admin/accounting-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    }
  });

  const deleteAccountingCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/accounting-codes/${id}`, {
        method: 'DELETE',
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
          </div>
        );
      case 'manager':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manager Reports</h3>
              <Button
                onClick={() => startExport('manager')}
                disabled={isExporting !== 'manager'}
              >
                {isExporting === 'manager' ? (
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
                <p className="text-muted-foreground">Manager report content will be implemented here</p>
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

      <div className="grid grid-cols-4 gap-6">
        {/* Report Navigation */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Button
                variant={selectedReport === 'financial' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('financial')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Financial Reports
              </Button>
              <Button
                variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('manager')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manager Reports
              </Button>
              <Button
                variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('player')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Player Reports
              </Button>
              <Button
                variant={selectedReport === 'schedule' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('schedule')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Schedule Reports
              </Button>
              <Button
                variant={selectedReport === 'guest-player' ? 'secondary' : 'ghost'}
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
      const response = await fetch('/api/admin/complexes');
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
      const response = await fetch(`/api/admin/complexes/${complexId}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      const response = await fetch(`/api/admin/complexes/${complexId}/fields/${fieldId}`, {
        method: 'PATCH',
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
            onViewFields={handleViewFields}
            isViewingFields={viewingComplexId === complex.id}
            onAddField={viewingComplexId === complex.id ? handleAddField : undefined}
            fields={viewingComplexId === complex.id ? fieldsQuery.data || [] : []}
            fieldsLoading={fieldsQuery.isLoading && viewingComplexId === complex.id}
            onEditField={handleEditField}
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
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [aiSchedulingModalOpen, setAiSchedulingModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [scheduleQuality, setScheduleQuality] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  // Mock data until we implement the backend
  const mockGames: any[] = [];
  const mockAgeGroups: any[] = [];
  
  // Fetch events for dropdown
  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      
      // Ensure we handle different response formats and always return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.events)) {
          return data.events;
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
        const formattedGames = scheduleData.games.map((game: any) => ({
          id: game.id.toString(),
          homeTeam: {
            id: 1, // We need actual team IDs here
            name: game.homeTeam,
            status: 'approved' // We should get actual status from backend
          },
          awayTeam: {
            id: 2, // We need actual team IDs here
            name: game.awayTeam,
            status: 'approved' // We should get actual status from backend
          },
          field: game.fieldName,
          startTime: game.startTime,
          endTime: game.endTime,
          status: game.status || 'scheduled'
        }));
        
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
  
  // Function to generate AI schedule
  const generateSchedule = async (constraints: any) => {
    setIsGenerating(true);
    try {
      if (!selectedEvent) {
        throw new Error("No event selected");
      }
      
      // Call the actual API endpoint
      const response = await fetch(`/api/admin/events/${selectedEvent}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gamesPerDay: constraints.maxGamesPerDay || 3,
          minutesPerGame: 60,
          breakBetweenGames: 15,
          minRestPeriod: constraints.minRest || 2,
          resolveCoachConflicts: constraints.resolveCoachConflicts,
          optimizeFieldUsage: constraints.optimizeFieldUsage,
          tournamentFormat: constraints.tournamentFormat || 'round_robin_knockout'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to generate schedule: ${response.status}`);
      }
      
      // After success, automatically set a quality score and sample conflicts
      // In a real implementation, the API would return these
      setScheduleQuality(80);
      setConflicts([
        { type: 'coach_conflict', description: 'Coach John Smith has teams playing at the same time', severity: 'high' },
        { type: 'field_overbooked', description: 'Field A3 has two games scheduled at 2 PM', severity: 'critical' },
        { type: 'rest_period', description: 'Team Dragons has less than 2 hours between games', severity: 'medium' }
      ]);
      
      // Refresh games data
      gamesQuery.refetch();
      
      toast({
        title: "Success",
        description: "Schedule generation framework created. Refreshing data...",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate schedule",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
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
      
      // Set a higher quality score to reflect improvement 
      setScheduleQuality(95);
      // Update conflicts - typically should be fewer after optimization
      setConflicts([
        { type: 'rest_period', description: 'Team Dragons has less than 2 hours between games', severity: 'medium' }
      ]);
      
      // Refresh games data
      gamesQuery.refetch();
      
      toast({
        title: "Success",
        description: "Schedule optimized successfully",
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
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI-Powered Scheduling</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setAiSchedulingModalOpen(true)}
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
                  games={gamesQuery.data.games}
                  ageGroups={gamesQuery.data.ageGroups || []}
                  selectedAgeGroup={selectedAgeGroup}
                  onAgeGroupChange={setSelectedAgeGroup}
                  isLoading={gamesQuery.isLoading}
                  date={selectedDate}
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
                  <Button onClick={() => setAiSchedulingModalOpen(true)}>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Schedule Generator</DialogTitle>
            <DialogDescription>
              Configure settings for the AI to generate an optimal tournament schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Schedule Constraints</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-rest">Minimum Rest Period</Label>
                  <div className="flex items-center space-x-2">
                    <Input id="min-rest" type="number" defaultValue="2" min="1" max="12" />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum time between games for the same team</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-games">Max Games Per Day</Label>
                  <Input id="max-games" type="number" defaultValue="3" min="1" max="6" />
                  <p className="text-xs text-muted-foreground">Maximum number of games a team can play in one day</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Coach Conflict Resolution</h4>
              <div className="flex items-center space-x-2">
                <Checkbox id="resolve-coach-conflicts" defaultChecked />
                <Label htmlFor="resolve-coach-conflicts">Automatically resolve coach conflicts</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                The AI will ensure coaches with multiple teams don't have overlapping games
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Field Utilization</h4>
              <div className="flex items-center space-x-2">
                <Checkbox id="field-optimization" defaultChecked />
                <Label htmlFor="field-optimization">Optimize field usage</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Distribute games evenly across available fields to minimize downtime
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Tournament Format</h4>
              <RadioGroup defaultValue="round-robin-knockout">
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiSchedulingModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setAiSchedulingModalOpen(false);
                generateSchedule({
                  minRest: 2,
                  maxGamesPerDay: 3,
                  resolveCoachConflicts: true,
                  optimizeFieldUsage: true,
                  tournamentFormat: 'round-robin-knockout'
                });
              }}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isDeletePlayerDialogOpen, setIsDeletePlayerDialogOpen] = useState(false);
  const [isCsvUploadDialogOpen, setIsCsvUploadDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isAddPlayerMode, setIsAddPlayerMode] = useState(false);
  const { toast } = useToast();
  
  // DialogDescription is already imported at the top of the file
  
  // Fetch events for dropdown
  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
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
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      console.log('Teams data received:', data);
      return data;
    }
  });

  // Mutation for approving/rejecting team registration
  const updateTeamStatusMutation = useMutation({
    mutationFn: async ({ teamId, status, notes }: { teamId: number, status: string, notes?: string }) => {
      try {
        console.log('Sending status update with data:', { teamId, status, notes });
        
        const response = await fetch(`/api/admin/teams/${teamId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes })
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

  // Mutation for processing refunds
  const processRefundMutation = useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: number, reason: string }) => {
      const response = await fetch(`/api/admin/teams/${teamId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
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
        throw new Error(errorData.error || 'Failed to add player');
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

  // Handle team status update
  const handleStatusUpdate = (team: any, status: 'registered' | 'approved' | 'rejected' | 'withdrawn' | 'refunded') => {
    const statusDisplayMap = {
      'registered': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn',
      'refunded': 'Refunded'
    };
    
    // Set appropriate dialog message based on status transition
    let dialogTitle = `Update Team Status`;
    let dialogMessage = `Are you sure you want to change the status of team "${team.name}" from "${statusDisplayMap[team.status]}" to "${statusDisplayMap[status]}"?`;
    
    // Special messaging for specific status transitions
    if (team.status === 'registered' && status === 'approved') {
      dialogMessage = `Approve team "${team.name}" for participation in the event?`;
    } else if (team.status === 'registered' && status === 'rejected') {
      dialogMessage = `Reject team "${team.name}" from participating in the event?`;
    } else if (status === 'withdrawn') {
      dialogMessage = `Mark team "${team.name}" as withdrawn from the event? This indicates the team has voluntarily withdrawn their registration.`;
    } else if (team.status !== 'registered' && status === 'registered') {
      dialogMessage = `Reset team "${team.name}" status to pending review? This will remove any previous approval or rejection decisions.`;
    }
    
    setSelectedTeam({ 
      ...team, 
      status,
      dialogTitle,
      dialogMessage
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
      notes
    });
  };

  // Confirm refund
  const confirmRefund = () => {
    if (!selectedTeam) return;
    
    processRefundMutation.mutate({
      teamId: selectedTeam.id,
      reason: refundReason
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
                  <Input
                    placeholder="Search teams..."
                    className="w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Select 
                    value={selectedEvent} 
                    onValueChange={setSelectedEvent}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {Array.isArray(eventsQuery.data) 
                        ? eventsQuery.data.map((event: any) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))
                        : Array.isArray(eventsQuery.data?.events)
                          ? eventsQuery.data.events.map((event: any) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.name}
                            </SelectItem>
                          ))
                          : (<SelectItem value="none" disabled>No events available</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Registration Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="registered">Registered (Pending)</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>

              <Tabs defaultValue="registered">
                <TabsList className="mb-4">
                  <TabsTrigger value="registered">Pending Review</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                
                <TabsContent value="registered">
                  <div className="border rounded-md">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Name</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Age Group</TableHead>
                          <TableHead>Submitter</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Coach</TableHead>
                          <TableHead>Registration Fee</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                        ) : filteredTeams.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'registered')
                            .map((team: any) => (
                              <TableRow key={team.id}>
                                <TableCell className="font-medium">{team.name}</TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{team.managerEmail}</TableCell>
                                <TableCell>{getCoachName(team.coach)}</TableCell>
                                <TableCell>{formatCurrency(team.registrationFee || 0)}</TableCell>
                                <TableCell>
                                  <Badge variant={team.paymentStatus === 'paid' ? 'default' : 'outline'}>
                                    {team.paymentStatus || 'Unpaid'}
                                  </Badge>
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
                  <div className="border rounded-md">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Name</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Age Group</TableHead>
                          <TableHead>Submitter</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Coach</TableHead>
                          <TableHead>Registration Fee</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                        ) : filteredTeams.filter((team: any) => team && team.status === 'approved').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No approved teams found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeams
                            .filter((team: any) => team && team.status === 'approved')
                            .map((team: any) => (
                              <TableRow key={team.id}>
                                <TableCell className="font-medium">{team.name}</TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{team.managerEmail}</TableCell>
                                <TableCell>{getCoachName(team.coach)}</TableCell>
                                <TableCell>{formatCurrency(team.registrationFee || 0)}</TableCell>
                                <TableCell>
                                  <Badge variant={team.paymentStatus === 'paid' ? 'default' : 'outline'}>
                                    {team.paymentStatus || 'Unpaid'}
                                  </Badge>
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
                  <div className="border rounded-md">
                    <Table className="team-list">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Name</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Age Group</TableHead>
                          <TableHead>Submitter</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Coach</TableHead>
                          <TableHead>Rejection Reason</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                            .map((team: any) => (
                              <TableRow key={team.id}>
                                <TableCell className="font-medium">{team.name}</TableCell>
                                <TableCell>{team.event?.name || "N/A"}</TableCell>
                                <TableCell>{team.ageGroup?.ageGroup || "N/A"}</TableCell>
                                <TableCell>{team.submitterEmail || team.managerEmail}</TableCell>
                                <TableCell>{team.managerEmail}</TableCell>
                                <TableCell>{getCoachName(team.coach)}</TableCell>
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
              This will process a refund for {selectedTeam?.name}'s registration payment of {selectedTeam ? formatCurrency(selectedTeam.registrationFee || 0) : '$0.00'}.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea 
            placeholder="Reason for refund (for internal records)"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRefund}
              disabled={processRefundMutation.isPending}
              className="team-status-button team-edit-button"
            >
              {processRefundMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Refund
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
                      <div className="font-medium">Payment Status:</div>
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
                      <div className="font-medium">Registration Fee:</div>
                      <div className="col-span-2">{formatCurrency(selectedTeam.registrationFee || 0)}</div>
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
                  <CardHeader>
                    <CardTitle>Team Information</CardTitle>
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
                      <div className="col-span-2">{selectedTeam.managerPhone || 'N/A'}</div>
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
                      <div className="col-span-2">{selectedTeam.coachData?.headCoachPhone || 'N/A'}</div>
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
                      <div className="col-span-2">{selectedTeam.coachData?.assistantCoachPhone || 'N/A'}</div>
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
                        // Initialize a new blank player
                        setSelectedPlayer({
                          id: 0,
                          teamId: selectedTeam.id,
                          firstName: '',
                          lastName: '',
                          dateOfBirth: '',
                          jerseyNumber: '',
                          position: '',
                          medicalNotes: '',
                          parentGuardianName: '',
                          parentGuardianEmail: '',
                          parentGuardianPhone: '',
                          emergencyContactName: '',
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
                          <TableHead>Position</TableHead>
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
                            <TableCell>{player.position || 'N/A'}</TableCell>
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
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Total Amount:</div>
                      <div className="col-span-2 font-semibold text-blue-700">
                        {selectedTeam.totalAmount 
                          ? formatCurrency(selectedTeam.totalAmount) 
                          : selectedTeam.registrationFee 
                            ? formatCurrency(selectedTeam.registrationFee) 
                            : 'Not available'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <div className="font-medium">Payment Status:</div>
                      <div className="col-span-2">
                        <Badge variant={selectedTeam.paymentStatus === 'paid' 
                          ? 'success' 
                          : selectedTeam.paymentStatus === 'refunded' 
                            ? 'outline' 
                            : 'secondary'}>
                          {selectedTeam.paymentStatus || 'Unpaid'}
                        </Badge>
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
                          
                          <DetailedFeeBreakdown teamId={selectedTeam.id} selectedFeeIds={selectedTeam.selectedFeeIds} />
                          
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
                {/* For teams in registered (pending) status */}
                {selectedTeam.status === 'registered' && (
                  <>
                    <Button 
                      variant="outline"
                      className="team-status-button"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleStatusUpdate(selectedTeam, 'rejected');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject Team
                    </Button>
                    <Button
                      className="team-status-button"
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
                      className="team-status-button"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleStatusUpdate(selectedTeam, 'withdrawn');
                      }}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Mark Withdrawn
                    </Button>
                  </>
                )}
                
                {/* For teams in rejected status */}
                {selectedTeam.status === 'rejected' && (
                  <>
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
                        handleStatusUpdate(selectedTeam, 'registered');
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset to Pending
                    </Button>
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
                  </>
                )}
                
                {/* For teams in approved status */}
                {selectedTeam.status === 'approved' && (
                  <>
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
                      variant="outline"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleStatusUpdate(selectedTeam, 'registered');
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset to Pending
                    </Button>
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
                  </>
                )}
                
                {/* For teams in withdrawn status */}
                {selectedTeam.status === 'withdrawn' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleStatusUpdate(selectedTeam, 'registered');
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset to Pending
                    </Button>
                  </>
                )}
                
                {/* For teams in refunded status */}
                {selectedTeam.status === 'refunded' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      handleStatusUpdate(selectedTeam, 'registered');
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset to Pending
                  </Button>
                )}
                
                {/* For paid teams - show refund option */}
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
                <Button 
                  variant="outline" 
                  onClick={handleEditTeam}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Team
                </Button>
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
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  value={selectedPlayer.position || ''}
                  onChange={(e) => setSelectedPlayer({
                    ...selectedPlayer,
                    position: e.target.value
                  })}
                />
              </div>
              
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
                <h3 className="text-sm font-medium">Parent/Guardian Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="parentGuardianName">Name</Label>
                  <Input 
                    id="parentGuardianName" 
                    value={selectedPlayer.parentGuardianName || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      parentGuardianName: e.target.value
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentGuardianEmail">Email</Label>
                    <Input 
                      id="parentGuardianEmail" 
                      type="email"
                      value={selectedPlayer.parentGuardianEmail || ''}
                      onChange={(e) => setSelectedPlayer({
                        ...selectedPlayer,
                        parentGuardianEmail: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentGuardianPhone">Phone</Label>
                    <Input 
                      id="parentGuardianPhone" 
                      value={selectedPlayer.parentGuardianPhone || ''}
                      onChange={(e) => setSelectedPlayer({
                        ...selectedPlayer,
                        parentGuardianPhone: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Emergency Contact</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Name</Label>
                  <Input 
                    id="emergencyContactName" 
                    value={selectedPlayer.emergencyContactName || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      emergencyContactName: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Phone</Label>
                  <Input 
                    id="emergencyContactPhone" 
                    value={selectedPlayer.emergencyContactPhone || ''}
                    onChange={(e) => setSelectedPlayer({
                      ...selectedPlayer,
                      emergencyContactPhone: e.target.value
                    })}
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
  
  if (!hasPermission(permission)) {
    return null;
  }
  
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
  const { hasPermission } = usePermissions();
  const [location, navigate] = useLocation();
  const [activeView, setActiveView] = useState<View>(initialView);
  const [showWelcome, setShowWelcome] = useState(true);
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
      const urlView = path[2] as View;
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
      'roles': 'view_role_permissions',
      'members': 'view_members'
    };
    
    // Check if user has permission to access the active view
    const permissionRequired = permissionMap[activeView as keyof typeof permissionMap];
    if (permissionRequired && !hasPermission(permissionRequired)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to view this content.</p>
        </div>
      );
    }
    
    // If user has permission, render the appropriate view
    switch (activeView) {
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
            <AnimatedNavigationButton
              view="formTemplates"
              activeView={activeView}
              onClick={() => navigate('/admin/form-templates')}
              icon={<FormInput className="mr-2 h-4 w-4" />}
              label="Form Templates"
              permission="view_form_templates"
              index={0}
            />
            
            <AnimatedNavigationButton
              view="events"
              activeView={activeView}
              onClick={() => navigate('/admin/events')}
              icon={<Calendar className="mr-2 h-4 w-4" />}
              label="Events"
              permission="view_events"
              index={1}
            />
            
            <AnimatedNavigationButton
              view="teams"
              activeView={activeView}
              onClick={() => navigate('/admin/teams')}
              icon={<Users className="mr-2 h-4 w-4" />}
              label="Teams"
              permission="view_teams"
              index={2}
            />

            <AnimatedNavigationButton
              view="administrators"
              activeView={activeView}
              onClick={() => navigate('/admin/administrators')}
              icon={<Shield className="mr-2 h-4 w-4" />}
              label="Administrators"
              permission="view_administrators"
              index={3}
            />
            
            <AnimatedNavigationButton
              view="complexes"
              activeView={activeView}
              onClick={() => navigate('/admin/complexes')}
              icon={<Building2 className="mr-2 h-4 w-4" />}
              label="Field Complexes"
              permission="view_complexes"
            />
            
            <AnimatedNavigationButton
              view="households"
              activeView={activeView}
              onClick={() => navigate('/admin/households')}
              icon={<Home className="mr-2 h-4 w-4" />}
              label="MatchPro Client"
              permission="view_households"
            />
            
            <AnimatedNavigationButton
              view="scheduling"
              activeView={activeView}
              onClick={() => navigate('/admin/scheduling')}
              icon={<CalendarDays className="mr-2 h-4 w-4" />}
              label="Scheduling"
              permission="view_scheduling"
            />
            
            <AnimatedNavigationButton
              view="reports"
              activeView={activeView}
              onClick={() => navigate('/admin/reports')}
              icon={<FileText className="mr-2 h-4 w-4" />}
              label="Reports and Financials"
              permission="view_reports"
            />
            
            <AnimatedNavigationButton
              view="files"
              activeView={activeView}
              onClick={() => navigate('/admin/file-manager')}
              icon={<ImageIcon className="mr-2 h-4 w-4" />}
              label="File Manager"
              permission="view_files"
            />
            
            <AnimatedNavigationButton
              view="members"
              activeView={activeView}
              onClick={() => navigate('/admin/members')}
              icon={<Users className="mr-2 h-4 w-4" />}
              label="Members"
              permission="view_members"
            />
            
            {/* Coupons are managed within events, so no standalone navigation is needed */}
            
            <AnimatedNavigationButton
              view="roles"
              activeView={activeView}
              onClick={() => setLocation('/admin/roles')}
              icon={<KeyRound className="mr-2 h-4 w-4" />}
              label="Role Permissions"
              permission="view_role_permissions"
            />

            {/* Settings */}
            {hasPermission('view_organization_settings') && (
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
                      <Settings className="mr-2 h-4 w-4" />
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
                  {hasPermission('edit_organization_settings') && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative overflow-hidden group"
                      style={{
                        backgroundColor: activeSettingsView === 'branding' 
                          ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                          : 'transparent',
                        color: activeSettingsView === 'branding'
                          ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                          : 'var(--admin-nav-text, inherit)',
                      }}
                      onClick={() => {
                        setLocation('/admin/settings');
                        setActiveSettingsView('branding');
                      }}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Branding
                    </Button>
                  )}
                  
                  {hasPermission('process_payments') && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative overflow-hidden group"
                      style={{
                        backgroundColor: activeSettingsView === 'payments' 
                          ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                          : 'transparent',
                        color: activeSettingsView === 'payments'
                          ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                          : 'var(--admin-nav-text, inherit)',
                      }}
                      onClick={() => {
                        setLocation('/admin/settings');
                        setActiveSettingsView('payments');
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payments
                    </Button>
                  )}
                  
                  {hasPermission('view_organization_settings') && (
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
                        setLocation('/admin/settings');
                        setActiveSettingsView('general');
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      General
                    </Button>
                  )}
                  
                  {hasPermission('edit_organization_settings') && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative overflow-hidden group"
                      style={{
                        backgroundColor: activeSettingsView === 'styling' 
                          ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
                          : 'transparent',
                        color: activeSettingsView === 'styling'
                          ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
                          : 'var(--admin-nav-text, inherit)',
                      }}
                      onClick={() => {
                        setLocation('/admin/settings');
                        setActiveSettingsView('styling');
                      }}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Theme
                    </Button>
                  )}
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
              onClick={() => setLocation('/admin/account')}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>

            <div className="flex flex-col space-y-3 mt-auto mb-4 px-2">
              <div className="border-t border-gray-700 my-2 pt-4"></div>
              <Button 
                onClick={handleAppearanceToggle} 
                className="w-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-0 shadow-sm" 
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {theme === 'dark' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <div className="bg-indigo-600 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={handleLogout} 
                className="w-full bg-gray-800 text-gray-300 hover:bg-red-900 hover:text-white transition-colors border-0 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
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
        <div className="p-8">
          {/* This dashboard now includes animations directly */}

          {/* Welcome Card with Animation */}
          {showWelcome && (
            <AnimatedContainer animation="scale" delay={0.1}>
              <Card className="mb-6 relative">
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-2 right-2 p-2 hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                    >
                      <UserCircle className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <motion.h2 
                        className="text-2xl font-bold"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        Welcome back, {user?.firstName}!
                      </motion.h2>
                      <motion.p 
                        className="text-muted-foreground"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      >
                        Manage your organization's activities and settings from this dashboard.
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          logout().catch(e => console.error("API logout error:", e));
          
          // Don't wait for API call to complete, immediately continue with cleanup
          console.log("Performing client-side logout cleanup");
          
          // Clear all storage and force page reload to completely reset the application state
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies
          document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          
          // Set cache control headers
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Cache-Control';
          meta.content = 'no-store, no-cache, must-revalidate, max-age=0';
          document.head.appendChild(meta);
          
          const pragmaMeta = document.createElement('meta');
          pragmaMeta.httpEquiv = 'Pragma';
          pragmaMeta.content = 'no-cache';
          document.head.appendChild(pragmaMeta);
          
          // Force navigation to auth page explicitly
          console.log("Redirecting to login screen...");
          window.location.href = "/auth?logged_out=true";
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
  const { hasPermission } = usePermissions();
  
  // Permission mapping for different settings views
  const permissionMap = {
    'branding': 'edit_organization_settings',
    'general': 'view_organization_settings',
    'styling': 'edit_organization_settings',
    'payments': 'process_payments'
  };
  
  // Check if user has permission to access the requested settings view
  const requiredPermission = permissionMap[activeSettingsView as keyof typeof permissionMap];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground">You don't have permission to access these settings.</p>
      </div>
    );
  }
  
  switch (activeSettingsView) {
    case 'branding':
      return (
        <BrandingPreviewProvider>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <OrganizationSettingsForm />
            </div>
            <BrandingPreview />
          </div>
        </BrandingPreviewProvider>
      );
    case 'general':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">General Settings</h2>
          <GeneralSettingsView />
        </div>
      );
    case 'styling':
      return <GeneralSettingsView />;
    case 'payments':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Payments Settings</h2>
          <StripeSettingsView />
        </div>
        );
    default:
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Card>
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
  discountType: 'percentage' | 'amount';
  amount: number;
  expirationDate: string;
  usageCount: number;
  maxUses: number | null;
  isActive: boolean;
  description: string;
}

function CouponManagement() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<SelectCoupon | null>(null);
  const queryClient = useQueryClient();
  const [, params] = useLocation();
  const eventId = params.split('/')[2];

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
      queryClient.invalidateQueries(['/api/admin/coupons', eventId]);
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

  // Check for view permission first
  if (!hasPermission('view_coupons')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground">You don't have permission to view coupons.</p>
      </div>
    );
  }

  if (couponsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        {hasPermission('create_coupons') && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
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
                    <Badge variant={coupon.isActive ? 'success' : 'secondary'}>
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
                        {hasPermission('edit_coupons') && (
                          <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {hasPermission('edit_coupons') && hasPermission('delete_coupons') && (
                          <DropdownMenuSeparator />
                        )}
                        {hasPermission('delete_coupons') && (
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

      <CouponModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        eventId={eventId}
        couponToEdit={selectedCoupon}
      />
    </>
  );
}

const navigationItems = [
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
  { icon: KeyRound, label: "Role Permissions", value: "roles" as const },
  { icon: UserRound, label: "Members", value: "members" as const },
  { icon: User, label: "My Account", value: "account" as const },
];

export default AdminDashboard;