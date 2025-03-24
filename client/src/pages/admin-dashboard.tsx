import { useState, useMemo, useEffect, lazy, Suspense, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Link2, X, Ticket, Plus, Mail, KeyRound } from "lucide-react";
import { EventsTable } from "@/components/events/EventsTable";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";
import EmulationManager from "@/components/admin/EmulationManager";
import FloatingEmulationButton from "@/components/admin/FloatingEmulationButton";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import {
  Calendar,
  Shield,
  UserPlus,
  Home,
  LogOut,
  FileText,
  User,
  Palette,
  ChevronRight,
  Loader2,
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
  Trash,
  Eye,
  Download,
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
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { BrandingPreviewProvider, useBrandingPreview } from "@/hooks/use-branding-preview";
import { BrandingPreview } from "@/components/BrandingPreview";
import { useExportProcess } from "@/hooks/use-export-process";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminModal } from "@/components/admin/AdminModal";
import { ComplexEditor } from "@/components/ComplexEditor";
import { FieldEditor } from "@/components/FieldEditor";
import { UpdatesLogModal } from "@/components/admin/UpdatesLogModal";
import { useDropzone } from 'react-dropzone';
import { FileManager } from "@/components/admin/FileManager.tsx";
import { FormTemplatesView } from "@/components/admin/FormTemplatesView"; // Import the component
import { AccountingCodeModal } from "@/components/admin/AccountingCodeModal";
import FormTemplateEditPage from "@/pages/form-template-edit";
import FormTemplateCreatePage from "@/pages/form-template-create";
import FormTemplatesPage from "@/pages/form-templates";
import { InternalOperationsPanel } from "@/components/admin/InternalOperationsPanel"; // Added import
import { StripeSettingsView } from "@/components/admin/StripeSettingsView"; // Added import
import RolePermissionsManager from "@/components/admin/RolePermissionsManager"; // Added import
import { Toggle } from '@/components/ui/toggle';


function AdminBanner() {
  const { settings } = useOrganizationSettings();

  return (
    <div className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
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

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'files' | 'formTemplates' | 'roles';
type SettingsView = 'branding' | 'general' | 'payments' | 'styling';
type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';
type RoleType = 'super_admin' | 'tournament_admin' | 'score_admin' | 'finance_admin';

function EventsView() {
  const navigate = useLocation()[1];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/events/preview")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Registration
          </Button>
          <Button onClick={() => navigate("/admin/events/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>
      <EventsTable />
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

  const administrators = useMemo(() => {
    if (!administratorsQuery.data) {
      return {
        super_admin: [],
        tournament_admin: [],
        score_admin: [],
        finance_admin: []
      };
    }

    // Log the full administrator data to console for debugging
    console.log("Full administrator data:", administratorsQuery.data);

    // Initialize with empty arrays for each role type
    const groupedAdmins: RoleGroup = {
      super_admin: [],
      tournament_admin: [],
      score_admin: [],
      finance_admin: []
    };

    // Hard-code a role map based on the database table
    const roleIdToName: Record<number, string> = {
      1: 'super_admin',
      2: 'tournament_admin',
      3: 'score_admin',
      4: 'finance_admin'
    };

    // Group administrators by their roles
    administratorsQuery.data.forEach((admin: any) => {
      console.log(`Processing admin ${admin.email}:`, admin);
      
      // The admin object might have multiple formats, let's check both
      // 1. Using roles array from API if it exists
      if (admin.roles && Array.isArray(admin.roles) && admin.roles.length > 0) {
        // Filter out null roles and process each role
        const validRoles = admin.roles.filter((role: any) => role !== null);
        
        validRoles.forEach((role: string) => {
          if (role in groupedAdmins) {
            if (!groupedAdmins[role].some((a) => a.id === admin.id)) {
              console.log(`Adding ${admin.email} to ${role} group based on roles array`);
              groupedAdmins[role].push(admin);
            }
          }
        });
      } 
      // 2. Using roles array based on raw database
      else if (admin.rolesRaw && Array.isArray(admin.rolesRaw)) {
        const roleNames = admin.rolesRaw
          .filter((r: any) => r !== null && r.role_id)
          .map((r: any) => roleIdToName[r.role_id])
          .filter((r: string) => r); // Remove undefined values
        
        if (roleNames.length > 0) {
          // Add the mapped role names to the admin object for display
          const adminWithRoles = { ...admin, roles: roleNames };
          
          roleNames.forEach((roleName: string) => {
            if (roleName in groupedAdmins) {
              if (!groupedAdmins[roleName].some((a) => a.id === admin.id)) {
                console.log(`Adding ${admin.email} to ${roleName} group based on role_id mapping`);
                groupedAdmins[roleName].push(adminWithRoles);
              }
            }
          });
        } else if (admin.isAdmin) {
          // If admin has isAdmin flag but no valid roles, default to super_admin
          if (!groupedAdmins.super_admin.some(a => a.id === admin.id)) {
            console.log(`Admin ${admin.email} has isAdmin flag but no valid roles, assigning to super_admin`);
            groupedAdmins.super_admin.push({ ...admin, roles: ['super_admin'] });
          }
        }
      }
      // 3. Fallback for missing roles data but isAdmin flag is true
      else if (admin.isAdmin === true) {
        if (!groupedAdmins.super_admin.some(a => a.id === admin.id)) {
          console.log(`Admin ${admin.email} has isAdmin flag but missing roles data, assigning to super_admin`);
          groupedAdmins.super_admin.push({ ...admin, roles: ['super_admin'] });
        }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Administrators</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Administrator
        </Button>
      </div>

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

        {Object.entries(administrators).map(([type, admins]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getTypeLabel(type)}
                  <Badge className={`ml-2 ${getBadgeColor(type)}`}>
                    {admins?.length || 0} Members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map((admin: any) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.firstName} {admin.lastName}
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {admin.roles?.map((role: string) => (
                            <Badge key={role} variant="outline" className="mr-1">
                              {role}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteAdminMutation.mutate(admin.id)}
                                  disabled={deleteAdminMutation.isPending}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

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
          <Card key={complex.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{complex.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {complex.address}, {complex.city}, {complex.state}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEditComplex(complex)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewFields(complex.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Fields
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Operating Hours</Label>
                  <p className="text-sm">
                    {complex.openTime} - {complex.closeTime}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={complex.isOpen ? "success" : "destructive"}>
                    {complex.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>

              {viewingComplexId === complex.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Fields</h3>
                    <Button onClick={handleAddField} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                  {fieldsQuery.isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : fieldsQuery.data?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fields available</p>
                  ) : (
                    <div className="grid gap-2">
                      {fieldsQuery.data?.map((field: Field) => (
                        <div key={field.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{field.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {field.hasLights ? "Has lights" : "No lights"} •
                              {field.hasParking ? "Parking available" : "No parking"}
                            </p>
                            {field.specialInstructions && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Note: {field.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={field.isOpen ? "success" : "destructive"}>
                              {field.isOpen ? "Open" : "Closed"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Scheduling</h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Game scheduling interface coming soon</p>
        </CardContent>
      </Card>
    </>
  );
}


function TeamsView() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search teams..."
                  className="w-[300px]"
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    <SelectItem value="u10">Under 10</SelectItem>
                    <SelectItem value="u12">Under 12</SelectItem>
                    <SelectItem value="u14">Under 14</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Team rows will be populated from the database */}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
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

function AdminDashboard() {
  const { user, logout, isLoading: isUserLoading } = useUser();
  const { hasPermission } = usePermissions();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('events');
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
      setLocation("/");
    }
  }, [user, setLocation]);

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
      'roles': 'view_role_permissions'
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
      <div className="w-64 bg-card border-r flex flex-col h-full text-foreground">
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">MatchPro Dashboard</h1>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <NavigationButton
              view="administrators"
              activeView={activeView}
              onClick={() => setActiveView('administrators')}
              icon={<Shield className="mr-2 h-4 w-4" />}
              label="Administrators"
              permission="view_administrators"
            />
            
            <NavigationButton
              view="formTemplates"
              activeView={activeView}
              onClick={() => setActiveView('formTemplates')}
              icon={<FormInput className="mr-2 h-4 w-4" />}
              label="Form Templates"
              permission="view_form_templates"
            />
            
            <NavigationButton
              view="events"
              activeView={activeView}
              onClick={() => setActiveView('events')}
              icon={<Calendar className="mr-2 h-4 w-4" />}
              label="Events"
              permission="view_events"
            />
            
            <NavigationButton
              view="teams"
              activeView={activeView}
              onClick={() => setActiveView('teams')}
              icon={<Users className="mr-2 h-4 w-4" />}
              label="Teams"
              permission="view_teams"
            />
            
            <NavigationButton
              view="complexes"
              activeView={activeView}
              onClick={() => setActiveView('complexes')}
              icon={<Building2 className="mr-2 h-4 w-4" />}
              label="Field Complexes"
              permission="view_complexes"
            />
            
            <NavigationButton
              view="households"
              activeView={activeView}
              onClick={() => setActiveView('households')}
              icon={<Home className="mr-2 h-4 w-4" />}
              label="MatchPro Client"
              permission="view_households"
            />
            
            <NavigationButton
              view="scheduling"
              activeView={activeView}
              onClick={() => setActiveView('scheduling')}
              icon={<CalendarDays className="mr-2 h-4 w-4" />}
              label="Scheduling"
              permission="view_scheduling"
            />
            
            <NavigationButton
              view="reports"
              activeView={activeView}
              onClick={() => setActiveView('reports')}
              icon={<FileText className="mr-2 h-4 w-4" />}
              label="Reports and Financials"
              permission="view_reports"
            />
            
            <NavigationButton
              view="files"
              activeView={activeView}
              onClick={() => setActiveView('files')}
              icon={<ImageIcon className="mr-2 h-4 w-4" />}
              label="File Manager"
              permission="view_files"
            />
            
            {/* Coupons are managed within events, so no standalone navigation is needed */}
            
            <NavigationButton
              view="roles"
              activeView={activeView}
              onClick={() => setActiveView('roles')}
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
                      variant={activeSettingsView === 'branding' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView('settings');
                        setActiveSettingsView('branding');
                      }}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Branding
                    </Button>
                  )}
                  
                  {hasPermission('process_payments') && (
                    <Button
                      variant={activeSettingsView === 'payments' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView('settings');
                        setActiveSettingsView('payments');
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payments
                    </Button>
                  )}
                  
                  {hasPermission('view_organization_settings') && (
                    <Button
                      variant={activeSettingsView === 'general' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView('settings');
                        setActiveSettingsView('general');
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      General
                    </Button>
                  )}
                  
                  {hasPermission('edit_organization_settings') && (
                    <Button
                      variant={activeSettingsView === 'styling' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView('settings');
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
              variant={activeView === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('account')}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>

            <div className="flex flex-col space-y-2 mb-2">
              <Button onClick={handleLogout} className="w-full" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
            <Button 
              onClick={handleAppearanceToggle} 
              className="w-full" 
              variant="outline"
            >
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <AdminBanner />
        <div className="p-8">
          {/* Welcome Card */}
          {showWelcome && (
            <Card className="mb-6 relative">
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-2 right-2 p-2 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h2>
                    <p className="text-muted-foreground">
                      Manage your organization's activities and settings from this dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
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
          
          // Force navigation to root which shows login for unauthenticated users
          console.log("Redirecting to login screen...");
          window.location.replace("/");
        }} />
      )}
      
      {/* Floating Emulation Button for Super Admins */}
      {user && user.isAdmin && hasPermission('emulate_users') && <FloatingEmulationButton />}
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
  { icon: User, label: "My Account", value: "account" as const },
];

export default AdminDashboard;