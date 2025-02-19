import { useState, useMemo, useEffect, lazy, Suspense, useCallback } from "react";
import { useLocation } from "wouter";
import { Link2, X, Ticket } from "lucide-react";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";
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
  Plus,
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
import { FileManager } from "@/components/admin/FileManager";


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

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'chat' | 'files' | 'coupons' | 'formTemplates';
type SettingsView = 'branding' | 'general' | 'payments' | 'styling';
type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';
type RoleType = 'super_admin' | 'tournament_admin' | 'score_admin' | 'finance_admin';

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

    // Initialize with empty arrays for each role type
    const groupedAdmins: RoleGroup = {
      super_admin: [],
      tournament_admin: [],
      score_admin: [],
      finance_admin: []
    };

    // Group administrators by their roles
    administratorsQuery.data.forEach((admin: any) => {
      // If admin has no roles or roles is null/undefined, add to super_admin
      if (!admin.roles || !Array.isArray(admin.roles) || admin.roles.length === 0 || admin.roles[0] === null) {
        if (!groupedAdmins.super_admin.some(a => a.id === admin.id)) {
          groupedAdmins.super_admin.push({ ...admin, roles: ['super_admin'] });
        }
        return;
      }

      // Add admin to each role group they belong to
      admin.roles.forEach((role: string) => {
        if (role === null) return; // Skip null roles

        // Only add if it's a valid role group
        if (role in groupedAdmins) {
          // Avoid duplicate entries
          if (!groupedAdmins[role].some((a: any) => a.id === admin.id)) {
            groupedAdmins[role].push(admin);
          }
        } else {
          // If role is not recognized, add to super_admin
          if (!groupedAdmins.super_admin.some(a => a.id === admin.id)) {
            groupedAdmins.super_admin.push(admin);
          }
        }
      });
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
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        adminToEdit={selectedAdmin}
      />
    </>
  );
}

function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('financial');
  const { isExporting, startExport } = useExportProcess();

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'financial':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Event Financial Reports</h3>
              <Button
                onClick={() => startExport('financial')}
                disabled={isExporting !== 'financial'}
              >
                {isExporting === 'financial' ? (
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
                <p className="text-muted-foreground">Financial report content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      // ... other report types ...
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
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
                Event Financial Reports
              </Button>
              {/* ... other report type buttons ... */}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderReportContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function BrandingPreview() {
  const { preview } = useBrandingPreview();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Logo Preview */}
          {preview.logoUrl && (
            <div className="flex justify-center p-4 bg-background rounded-lg">
              <img
                src={preview.logoUrl}
                alt="Organization logo"
                className="h-20 w-20 object-contain"
              />
            </div>
          )}
          {/* Color Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: preview.primaryColor }}
              />
              <span className="text-sm">Primary Color</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: preview.secondaryColor }}
              />
              <span className="text-sm">Secondary Color</span>
            </div>
          </div>
        </div>
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

      // Get the palette with error handling
      const palette = await v.getPalette();

      // Set primary color from the Vibrant swatch
      if (palette.Vibrant) {
        setPrimaryColor(palette.Vibrant.hex);
        console.log('Primary color extracted:', palette.Vibrant.hex);
      }

      // Set secondary color from the LightVibrant or Muted swatch
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
    },
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

function EventsView() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]); // Add state for selected events
  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  useEffect(() => {
    if (eventsQuery.data) {
      setFilteredEvents(eventsQuery.data);
    }
  }, [eventsQuery.data]);

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const adminName = user ? `${user.firstName}'s` : 'All';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{adminName} Events</h2>
        <Button onClick={() => navigate("/admin/events/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {selectedEvents.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/events/bulk', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ eventIds: selectedEvents }),
                        });

                        if (!response.ok) throw new Error('Failed to delete events');

                        setSelectedEvents([]);
                        eventsQuery.refetch();
                        toast({
                          title: "Success",
                          description: `${selectedEvents.length} events deleted successfully`,
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to delete events",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedEvents.length})
                  </Button>
                )}
                <Input
                  placeholder="Search events..."
                  className="w-[300px]"
                />
                <Select defaultValue="all" onValueChange={(value) => {
                  if (!eventsQuery.data) return;
                  const now = new Date();
                  const events = eventsQuery.data.filter((event: any) => {
                    if (value === 'all') return true;

                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    end.setHours(23, 59, 59, 999);

                    if (value === 'past' && now > end) return true;
                    if (value === 'active' && now >= start && now <= end) return true;
                    if (value === 'upcoming' && now < start) return true;

                    return false;
                  });
                  setFilteredEvents(events);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input type="checkbox" onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents(filteredEvents.map((event: any) => event.id));
                      } else {
                        setSelectedEvents([]);
                      }
                    }} />
                  </TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((id) => id !== event.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.startDate} - {event.endDate}</TableCell>
                    <TableCell>
                      {(() => {
                        const now = new Date();
                        const start = new Date(event.startDate);
                        const end = new Date(event.endDate);
                        end.setHours(23, 59, 59, 999);

                        let status = "Upcoming";
                        let colorClass = "bg-yellow-50 text-yellow-700";

                        if (now > end) {
                          status = "Past";
                          colorClass = "bg-red-50 text-red-700";
                        } else if (now >= start && now <= end) {
                          status = "Active";
                          colorClass = "bg-green-50 text-green-700";
                        }

                        return (
                          <Badge variant="outline" className={colorClass}>
                            {status}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/coupons`)}>
                            <Ticket className="mr-2 h-4 w-4" />
                            Create Coupons
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/application-form`)}>
                            <FormInput className="mr-2 h-4 w-4" />
                            Application Form
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const registrationUrl = `${window.location.origin}/register/event/${event.id}`;
                              navigator.clipboard.writeText(registrationUrl);
                              toast({
                                title: "Registration Link Generated",
                                description: (
                                  <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                                    {registrationUrl}
                                  </div>
                                ),
                                duration: 5000,
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Link2 className="mr-2 h-4 w-4" />
                            Generate Registration Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/admin/events/${event.id}`, {
                                  method: 'DELETE',
                                });

                                if (!response.ok) throw new Error('Failed to delete event');

                                eventsQuery.refetch();
                                toast({
                                  title: "Success",
                                  description: "Event deleted successfully",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete event",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function HouseholdsView() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">MatchPro Client</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Client management coming soon</p>
        </CardContent>
      </Card>
    </>
  );
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

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('events');
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUpdatesLog, setShowUpdatesLog] = useState(false);

  useEffect(() => {
    if (!user) {
      return; // Wait for user data to load
    }
    if (!isAdminUser(user)) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
    }, 1500);
  };

  const renderView = () => {
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
      case 'chat':
        return <ChatView />;
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
      case 'coupons':
        return <CouponManagement />;
      case 'formTemplates':
        return <FormTemplatesView />; // Add this line
      default:
        return <div>Feature coming soon</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col h-full">
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">MatchPro Dashboard</h1>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <Button
              variant={activeView === 'administrators' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('administrators')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Administrators
            </Button>

            <Button
              variant={activeView === 'events' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('events')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </Button>

            <Button
              variant={activeView === 'teams' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('teams')}
            >
              <Users className="mr-2 h-4 w-4" />
              Teams
            </Button>

            <Button
              variant={activeView === 'complexes' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('complexes')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Field Complexes
            </Button>

            <Button
              variant={activeView === 'households' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('households')}
            >
              <Home className="mr-2 h-4 w-4" />
              MatchPro Client
            </Button>

            <Button
              variant={activeView === 'scheduling' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('scheduling')}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Scheduling
            </Button>

            <Button
              variant={activeView === 'reports' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>

            <Button
              variant={activeView === 'chat' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('chat')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={activeView === 'files' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('files')}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              File Manager
            </Button>

            {/* Settings */}
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
              </CollapsibleContent>
            </Collapsible>

            {/* Account */}
            <Button
              variant={activeView === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('account')}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
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
      </div>

      <UpdatesLogModal
        open={showUpdatesLog}
        onOpenChange={setShowUpdatesLog}
      />
      {showLogoutOverlay && (
        <LogoutOverlay onFinished={() => setShowLogoutOverlay(false)} />
      )}
    </div>
  );
}

function ChatView() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesQuery = useQuery({
    queryKey: ['/api/admin/messages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    }
  });

  if (messagesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center minh-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Support Chat</h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              {messagesQuery.data?.map((message: any) => (
                <div key={message.id} className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.isAdmin
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm font-medium">{message.sender}</p>
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70">{new Date(message.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button>
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function SettingsView({ activeSettingsView }: { activeSettingsView: SettingsView }) {
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
      return <GeneralSettingsView />;
    case 'styling':
      return <ThemeEditor />;
    case 'payments':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Payments Settings</h2>
          <Card>
            <CardContent className="p-6">
              <p>Payments settings content will be implemented here</p>
            </CardContent>
          </Card>
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
  const [theme, setTheme] = useState({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#4CAF50',
    // Add more colors as needed
  });

  const handleColorChange = (color: string, value: string) => {
    setTheme({ ...theme, [color]: value });
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
            value={theme.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="textColor">Text Color</Label>
          <Input
            id="textColor"
            type="color"
            value={theme.textColor}
            onChange={(e) => handleColorChange('textColor', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="buttonColor">Button Color</Label>
          <Input
            id="buttonColor"
            type="color"
            value={theme.buttonColor}
            onChange={(e) => handleColorChange('buttonColor', e.target.value)}
          />
        </div>
        {/* Add more color pickers as needed */}
      </div>
      <Button onClick={() => {
        // Apply theme changes here
        console.log("Theme updated:", theme);
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
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
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
                        <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
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
  { icon: FileText, label: "Reports", value: "reports" as const },
  { icon: MessageSquare, label: "Chat", value: "chat" as const },
  { icon: ImageIcon, label: "File Manager", value: "files" as const },
  { icon: Ticket, label: "Coupons", value: "coupons" as const },
  { icon: FormInput, label: "Form Templates", value: "formTemplates" as const },
  { icon: User, label: "My Account", value: "account" as const },
];

export default AdminDashboard;