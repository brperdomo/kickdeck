import { useState } from "react";
import { useLocation, Link } from "wouter";
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
import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Search,
  Plus,
  Settings,
  Users,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash,
  Copy,
  Eye,
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
  Download,
  ClipboardList,
  UserCircle,
  Percent,
  Printer,
  Flag,
  MoreHorizontal,
  Building2,
  MessageSquare,
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
import { lazy } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScheduleVisualization } from "@/components/ScheduleVisualization";
import { format } from 'date-fns';
import { AdminModal } from "@/components/admin/AdminModal";
import { DatePicker } from "@/components/ui/date-picker";
import { Suspense } from "react";

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

const MyAccount = lazy(() => import("./my-account"));

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling';
type SettingsView = 'branding' | 'general' | 'payments';
type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';

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
                disabled={isExporting !== null}
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
      case 'manager':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manager Export</h3>
              <Button
                onClick={() => startExport('manager')}
                disabled={isExporting !== null}
              >
                {isExporting === 'manager' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Manager export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Player Export</h3>
              <Button
                onClick={() => startExport('player')}
                disabled={isExporting !== null}
              >
                {isExporting === 'player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Player export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Schedule Export</h3>
              <Button
                onClick={() => startExport('schedule')}
                disabled={isExporting !== null}
              >
                {isExporting === 'schedule' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Schedule export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'guest-player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Guest Player Export</h3>
              <Button
                onClick={() => startExport('guest-player')}
                disabled={isExporting !== null}
              >
                {isExporting === 'guest-player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Guest player export content will be implemented here</p>
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
                {isExporting === 'financial' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('manager')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Manager Export
                {isExporting === 'manager' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('player')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Player Export
                {isExporting === 'player' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'schedule' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('schedule')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Schedule Export
                {isExporting === 'schedule' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'guest-player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('guest-player')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Guest Player Export
                {isExporting === 'guest-player' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
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

          {/* Organization Name Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Organization Name</h3>
            <div className="p-4 rounded-lg bg-card">
              <span
                className="text-xl font-bold"
                style={{ color: preview.primaryColor }}
              >
                {preview.name || "Your Organization Name"}
              </span>
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Brand Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg flex flex-col items-center justify-center">
                <span
                  className="text-white text-sm font-medium"
                  style={{ backgroundColor: preview.primaryColor }}
                >
                  Primary
                </span>
              </div>
              <div className="p-4 rounded-lg flex flex-col items-center justify-center border">
                <span
                  className="text-sm font-medium"
                  style={{ backgroundColor: preview.secondaryColor }}
                >
                  Secondary
                </span>
              </div>
            </div>
          </div>

          {/* Sample UI Elements */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Sample Elements</h3>
            <div className="space-y-2">
              <Button
                className="w-full"
                style={{
                  backgroundColor: preview.primaryColor,
                  color: 'white',
                }}
              >
                Sample Button
              </Button>
              <div className="p-4 rounded-lg">
                <p
                  className="text-sm"
                  style={{
                    backgroundColor: preview.secondaryColor,
                    color: preview.primaryColor
                  }}
                >
                  Sample text with your brand colors
                </p>
              </div>
            </div>
          </div>
        </div>

        {preview.isDraft && (
          <p className="text-sm text-muted-foreground italic text-center">
            * Preview mode - changes are not saved
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizationSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useOrganizationSettings();
  const { updatePreview } = useBrandingPreview();
  const [name, setName] = useState(settings?.name || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor || '#ffffff');
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(settings?.logoUrl);

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setPrimaryColor(settings.primaryColor || '#000000');
      setSecondaryColor(settings.secondaryColor || '#ffffff');
      setPreviewUrl(settings.logoUrl);
    }
  }, [settings]);

  // Update preview whenever form values change
  useEffect(() => {
    updatePreview({
      name,
      primaryColor,
      secondaryColor,
      logoUrl: previewUrl,
      isDraft: true,
    });
  }, [name, primaryColor, secondaryColor, previewUrl, updatePreview]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      updatePreview({ logoUrl: url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        name,
        primaryColor,
        secondaryColor,
        logoUrl: previewUrl,
      });
      updatePreview({ isDraft: false });
    } catch (error) {
      console.error('Error updating organization settings:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Organization Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#ffffff"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Organization Logo</Label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    onChange={handleLogoChange}
                    accept="image/*"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recommended size: 200x200px. Max file size: 2MB
                  </p>
                </div>
                {previewUrl && (
                  <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <BrandingPreview />
    </div>
  );
}

function PaymentsSettingsView() {
  const [stripeAccount, setStripeAccount] = useState({
    businessName: '',
    displayName: '',
    accountStatus: 'Not Connected',
    bankAccountLast4: '',
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payment Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <p className="text-lg font-medium">{stripeAccount.businessName || 'Not set'}</p>
            </div>
            <div>
              <Label>Display Name</Label>
              <p className="text-lg font-medium">{stripeAccount.displayName || 'Not set'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account Status</Label>
              <Badge variant={stripeAccount.accountStatus === 'Active' ? 'default' : 'secondary'}>
                {stripeAccount.accountStatus}
              </Badge>
            </div>
            <div>
              <Label>Bank Account</Label>
              <p className="text-lg font-medium">
                {stripeAccount.bankAccountLast4
                  ? `****${stripeAccount.bankAccountLast4}`
                  : 'Not connected'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline">
              Disconnect
            </Button>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Connect with Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ComplexesView() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isViewFieldsModalOpen, setIsViewFieldsModalOpen] = useState(false);
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    openTime: '',
    closeTime: '',
    address: '',
    city: '',
    state: '',
    country: 'US',
    rules: '',
    directions: ''
  });
  const [fieldFormData, setFieldFormData] = useState({
    name: '',
    hasLights: false,
    hasParking: false,
    isOpen: true,
    specialInstructions: ''
  });

  // Query for complexes data
  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  // Query for complex analytics
  const analyticsQuery = useQuery({
    queryKey: ['/api/admin/complexes/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const createComplexMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/complexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create complex');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      setIsModalOpen(false);
      setFormData({
        name: '',
        openTime: '',
        closeTime: '',
        address: '',
        city: '',
        state: '',
        country: 'US',
        rules: '',
        directions: ''
      });
    }
  });

  // Add update complex mutation
  const updateComplexMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/admin/complexes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Failed to update complex');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      setIsEditModalOpen(false);
      setSelectedComplex(null);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComplex) {
      updateComplexMutation.mutate({ ...formData, id: selectedComplex.id });
    } else {
      createComplexMutation.mutate(formData);
    }
  };

  const handleEdit = (complex: Complex) => {
    setSelectedComplex(complex);
    setFormData({
      name: complex.name,
      openTime: complex.openTime,
      closeTime: complex.closeTime,
      address: complex.address,
      city: complex.city,
      state: complex.state,
      country: complex.country,
      rules: complex.rules || '',
      directions: complex.directions || ''
    });
    setIsEditModalOpen(true);
  };

  // Render the create/edit modal
  const renderComplexModal = (isEdit: boolean = false) => (
    <Dialog open={isEdit ? isEditModalOpen : isModalOpen} onOpenChange={isEdit ? setIsEditModalOpen : setIsModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Complex' : 'Add New Complex'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Complex Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter complex name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="openTime">Opening Time</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closeTime">Closing Time</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  maxLength={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rules">Complex Rules</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={handleInputChange}
                placeholder="Enter any rules or guidelines for this complex"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="directions">Directions</Label>
              <Textarea
                id="directions"
                value={formData.directions}
                onChange={handleInputChange}
                placeholder="Enter directions or special instructions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createComplexMutation.isPending || updateComplexMutation.isPending}>
              {(createComplexMutation.isPending || updateComplexMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? 'Save Changes' : 'Create Complex'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Add field creation mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: { name: string; hasLights: boolean; hasParking: boolean; isOpen: boolean; specialInstructions: string; complexId: number; }) => {
      const response = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both the complexes list and the fields for this complex
      complexesQuery.refetch();
      fieldsQuery.refetch();
      setIsFieldModalOpen(false);
      setFieldFormData({
        name: '',
        hasLights: false,
        hasParking: false,
        isOpen: true,
        specialInstructions: ''
      });
    }
  });

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplexId) return;

    createFieldMutation.mutate({
      ...fieldFormData,
      complexId: selectedComplexId
    });
  };

  const handleFieldModalOpen = (complexId: number) => {
    setSelectedComplexId(complexId);
    setIsFieldModalOpen(true);
  };

  // Add query for fetching fields
  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/complexes', selectedComplexId, 'fields'],
    queryFn: async () => {
      if (!selectedComplexId) return null;
      const response = await fetch(`/api/admin/complexes/${selectedComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: !!selectedComplexId && isViewFieldsModalOpen
  });

  const handleViewFields = (complex: Complex) => {
    setSelectedComplexId(complex.id);
    setSelectedComplex(complex);
    setIsViewFieldsModalOpen(true);
  };

  // Add field deletion mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete field');
      return response.json();
    },
    onSuccess: () => {
      // Refetch      fieldsQuery.refetch;
    }
  });

  const toggleFieldStatusMutation = useMutation({
    mutationFn: async ({fieldId, isOpen }: { fieldId: number; isOpen: boolean }) => {
      const response = await fetch(`/api/admin/fields/${fieldId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle field status');
      }

      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      fieldsQuery.refetch();
      toast({
        title: "Success",
        description: "Field status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update field status",
        variant: "destructive",
      });
    },
  });

  // Add delete complex mutation
  const deleteComplexMutation = useMutation({
    mutationFn: async (complexId: number) => {
      const response = await fetch(`/api/admin/complexes/${complexId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete complex');
      return response.json();
    },
    onSuccess: () => {
      // Refetch both queries after deletion
      complexesQuery.refetch();
      analyticsQuery.refetch();
    }
  });

  const toggleComplexStatusMutation = useMutation({
    mutationFn: async ({ complexId, isOpen }: { complexId: number; isOpen: boolean }) => {
      const response = await fetch(`/api/admin/complexes/${complexId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      // Refetch both queries after status update
      complexesQuery.refetch();
      analyticsQuery.refetch();
      toast({
        title: "Complex status updated",
        description: "All fields have been updated accordingly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update complex status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // In the table actions cell, update to include Add Field button
  const renderActionButtons = (complex: Complex) => (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleFieldModalOpen(complex.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new field</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewFields(complex)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View fields in this complex</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(complex)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit complex information</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this complex? This will also delete all fields associated with it.')) {
                deleteComplexMutation.mutate(complex.id);
              }
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete this complex</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  // Add the fields view modal with updated controls
  const renderFieldsModal = () => (
    <Dialog open={isViewFieldsModalOpen} onOpenChange={setIsViewFieldsModalOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Fields in {selectedComplex?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {fieldsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fieldsQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No fields found</h3>
              <p className="text-muted-foreground mb-4">
                This complex doesn't have any fields yet
              </p>
              <Button onClick={() => {
                setIsViewFieldsModalOpen(false);
                handleFieldModalOpen(selectedComplexId!);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Field
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Special Instructions</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldsQuery.data?.map((field: any) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {field.hasLights && (
                            <Badge variant="outline">Lights</Badge>
                          )}
                          {field.hasParking && (
                            <Badge variant="outline">Parking</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.isOpen}
                            onCheckedChange={(checked) =>
                              toggleFieldStatusMutation.mutate({
                                fieldId: field.id,
                                isOpen: checked
                              })
                            }
                          />
                          <span className={field.isOpen ? "text-green-600" : "text-red-600"}>
                            {field.isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{field.specialInstructions || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this field?')) {
                              deleteFieldMutation.mutate(field.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsViewFieldsModalOpen(false)}>
            Close
          </Button>
          <Button onClick={() => {
            setIsViewFieldsModalOpen(false);
            handleFieldModalOpen(selectedComplexId!);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Field Complexes</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Complex
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complexes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsQuery.data?.totalComplexes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsQuery.data?.totalFields || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsQuery.data?.eventsToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsQuery.data?.averageUsage || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {analyticsQuery.data?.message && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Flag className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{analyticsQuery.data.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsQuery.data?.mostActiveComplex && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Most Active Complex</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold">{analyticsQuery.data.mostActiveComplex.name}</h3>
              <p className="text-sm text-muted-foreground">{analyticsQuery.data.mostActiveComplex.address}</p>
              <p className="text-sm">
                Total Fields: <span className="font-medium">{analyticsQuery.data.mostActiveComplex.fieldCount}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complex List */}
      <Card>
        <CardContent className="p-0">
          {complexesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !complexesQuery.data?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No complexes found. Add your first complex to get started!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Fields Status</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complexesQuery.data?.map((complex: Complex) => (
                  <TableRow key={complex.id}>
                    <TableCell className="font-medium">
                      {complex.name}
                    </TableCell>
                    <TableCell>
                      {complex.address}, {complex.city}, {complex.state}
                    </TableCell>
                    <TableCell>
                      {complex.openTime} - {complex.closeTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={complex.isOpen}
                          onCheckedChange={(checked) =>
                            toggleComplexStatusMutation.mutate({
                              complexId: complex.id,
                              isOpen: checked
                            })
                          }
                        />
                        <span className={complex.isOpen ? "text-green-600" : "text-red-600"}>
                          {complex.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-4">
                        <Badge variant="secondary">
                          {complex.openFields} Open
                        </Badge>
                        <Badge variant="outline" className="text-red-500">
                          {complex.closedFields} Closed
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderActionButtons(complex)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Render both create and edit modals */}
      {renderComplexModal(false)} {/* Create modal */}
      {renderComplexModal(true)}  {/* Edit modal */}

      {/* Field modals remain unchanged */}
      <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  value={fieldFormData.name}
                  onChange={(e) => setFieldFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Enter field name"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-lights"
                  checked={fieldFormData.hasLights}
                  onCheckedChange={(checked) =>
                    setFieldFormData(prev => ({
                      ...prev,
                      hasLights: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="has-lights">Has Lights?</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-parking"
                  checked={fieldFormData.hasParking}
                  onCheckedChange={(checked) =>
                    setFieldFormData(prev => ({
                      ...prev,
                      hasParking: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="has-parking">Has Parking?</Label>
              </div>

              <div>
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea
                  id="special-instructions"
                  value={fieldFormData.specialInstructions}
                  onChange={(e) => setFieldFormData(prev => ({
                    ...prev,
                    specialInstructions: e.target.value
                  }))}
                  placeholder="Enter any special instructions"
                  className="h-20"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={createFieldMutation.isPending}
              >
                {createFieldMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {renderFieldsModal()}
    </>
  );
}

function SchedulingView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [scheduleParams, setScheduleParams] = useState({
    gamesPerDay: 6,
    minutesPerGame: 60,
    breakBetweenGames: 15,
  });
  const { toast } = useToast();

  // Query for events
  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  // Query for age groups
  const ageGroupsQuery = useQuery({
    queryKey: ['/api/admin/events', selectedEvent, 'age-groups'],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const response = await fetch(`/api/admin/events/${selectedEvent}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
    enabled: !!selectedEvent
  });

  // Query for schedule
  const scheduleQuery = useQuery({
    queryKey: ['/api/admin/events', selectedEvent, 'schedule', selectedAgeGroup],
    queryFn: async () => {
      if (!selectedEvent) return { games: [] };
      const url = new URL(`/api/admin/events/${selectedEvent}/schedule`, window.location.origin);
      if (selectedAgeGroup) {
        url.searchParams.append('ageGroup', selectedAgeGroup);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return response.json();
    },
    enabled: !!selectedEvent
  });

  // Mutation for generating schedule
  const generateScheduleMutation = useMutation({
    mutationFn: async (data: {
      eventId: number,
      ageGroup: string,
      gamesPerDay: number,
      minutesPerGame: number,
      breakBetweenGames: number
    }) => {
      const response = await fetch(`/api/admin/events/${data.eventId}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }

      return response.json();
    },
    onSuccess: () => {
      scheduleQuery.refetch();
      toast({
        title: "Success",
        description: "Schedule generated successfully!",
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

  const handleGenerateSchedule = (eventId: number) => {
    if (!selectedAgeGroup) {
      toast({
        title: "Error",
        description: "Please select an age group",
        variant: "destructive"
      });
      return;
    }

    generateScheduleMutation.mutate({
      eventId,
      ageGroup: selectedAgeGroup,
      ...scheduleParams
    });
  };

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Game Scheduling</h2>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Event</Label>
              <Select
                value={selectedEvent?.toString()}
                onValueChange={(value) => {
                  setSelectedEvent(parseInt(value));
                  setSelectedAgeGroup(""); // Reset age group when event changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {eventsQuery.data?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <>
                <div>
                  <Label>Age Group</Label>
                  <Select
                    value={selectedAgeGroup}
                    onValueChange={setSelectedAgeGroup}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Age Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroupsQuery.data?.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.ageGroup} ({group.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Games Per Day</Label>
                  <Input
                    type="number"
                    value={scheduleParams.gamesPerDay}
                    onChange={(e) =>
                      setScheduleParams({
                        ...scheduleParams,
                        gamesPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minutes Per Game</Label>
                  <Input
                    type="number"
                    value={scheduleParams.minutesPerGame}
                    onChange={(e) =>
                      setScheduleParams({
                        ...scheduleParams,
                        minutesPerGame: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Break Between Games (minutes)</Label>
                  <Input
                    type="number"
                    value={scheduleParams.breakBetweenGames}
                    onChange={(e) =>
                      setScheduleParams({
                        ...scheduleParams,
                        breakBetweenGames: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleGenerateSchedule(selectedEvent)}
                  disabled={generateScheduleMutation.isPending}
                >
                  {generateScheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Schedule"
                  )}
                </Button>

                <div>
                  <Label>Select Date</Label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3">
          <ScheduleVisualization
            games={scheduleQuery.data?.games || []}
            ageGroups={ageGroupsQuery.data || []}
            selectedAgeGroup={selectedAgeGroup}
            onAgeGroupChange={setSelectedAgeGroup}
            isLoading={scheduleQuery.isLoading}
            date={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}

function EventsView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [handleDuplicateEvent, setHandleDuplicateEvent] = useState(() => () => { });
  const [handleDeleteEvent, setHandleDeleteEvent] = useState(() => () => { });

  // Query for events list
  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  // Query for selected event details
  const eventDetailsQuery = useQuery({
    queryKey: ['/api/admin/events', selectedEvent, 'edit'],
    queryFn: async () => {
      if (!selectedEvent) return null;
      const response = await fetch(`/api/admin/events/${selectedEvent}/edit`);
      if (!response.ok) throw new Error('Failed to fetch event details');
      return response.json();
    },
    enabled: !!selectedEvent
  });

  // Mutation for updating event
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/events/${selectedEvent}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    onSuccess: () => {
      eventsQuery.refetch();
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive"
      });
    }
  });

  const handleEditClick = (eventId: number) => {
    setSelectedEvent(eventId);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (formData: any) => {
    updateEventMutation.mutate(formData);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button onClick={() => setLocation("/create-event")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {eventsQuery.isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : eventsQuery.data?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No events found. Create your first event to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsQuery.data?.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>
                          {format(new Date(event.startDate), 'MMM d, yyyy')} -
                          {format(new Date(event.endDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* Event Actions */}
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/admin/events/${event.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 hover:bg-secondary"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit Details</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 hover:bg-secondary"
                              onClick={() => handleDuplicateEvent(event)}
                            >
                              <Copy className="h-4 w-4" />
                              <span>Duplicate</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteEvent(event)}
                            >
                              <Trash className="h-4 w-4" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {eventDetailsQuery.isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : eventDetailsQuery.data ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Add form handling
              handleUpdate(eventDetailsQuery.data);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    defaultValue={eventDetailsQuery.data.name}
                    placeholder="Enter event name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      defaultValue={eventDetailsQuery.data.startDate.split('T')[0]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      defaultValue={eventDetailsQuery.data.endDate.split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="details">Event Details</Label>
                  <Textarea
                    id="details"
                    defaultValue={eventDetailsQuery.data.details || ''}
                    placeholder="Enter event details"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('events');
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { currentColor, setColor, isLoading: isThemeLoading } = useTheme();
  const { toast } = useToast();
  useEffect(() => {
    if (!isAdminUser(user)) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["/api/admin/events"],
    enabled: isAdminUser(user) && activeView === 'events',
    staleTime: 30000,
    gcTime: 3600000,
  });

  const adminsQuery = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/administrators"],
    enabled: isAdminUser(user) && activeView=== 'administrators',    staleTime: 30000,
    gcTime: 3600000,
  });

  const { data: households, isLoading: householdsLoading, error: householdsError } = useQuery<any[]>({
    queryKey: ["/api/admin/households"],
    enabled: isAdminUser(user) && activeView === 'households',
    staleTime: 30000,
    gcTime: 3600000,
  });


  function renderContent() {
    switch (activeView) {
      case 'complexes':
        return <ComplexesView />;
      case 'households':
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search households..."
                  className="pl-9 w-[300px]"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Household
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Households</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {householdsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : householdsError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-muted-foreground">
                            Failed to load households
                          </TableCell>
                        </TableRow>
                      ) : households?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No households found
                          </TableCell>
                        </TableRow>
                      ) : (
                        households?.map((household) => (
                          <TableRow key={household.id}>
                            <TableCell>{household.name}</TableCell>
                            <TableCell>{household.address}</TableCell>
                            <TableCell>{household.phone}</TableCell>
                            <TableCell>{household.email}</TableCell>
                            <TableCell>
                              <Badge variant={household.status === 'active' ? 'default' : 'secondary'}>
                                {household.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );
      case 'administrators':
        return <AdministratorsView />;
      case 'events':
        return <EventsView />;
      case 'settings':
        if (activeSettingsView === 'branding') {
          return (
            <BrandingPreviewProvider>
              <OrganizationSettingsForm />
            </BrandingPreviewProvider>
          );
        }
        if (activeSettingsView === 'payments') {
          return <PaymentsSettingsView />;
        }
        if (activeSettingsView === 'general') {
          return (
            <div>
              General Settings Content Here
            </div>
          );
        }
        return null;
      case 'reports':
        return <ReportsView />;
      case 'account':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <MyAccount />
          </Suspense>
        );
      case 'complexes':
        return <ComplexesView />;
      case 'scheduling':
        return <SchedulingView />;
      case 'teams':
        return <TeamsView />;
      default:
        return null;
    }
  }

  if (!isAdminUser(user)) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col h-full">
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">Admin Dashboard</h1>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <Button
              variant={activeView === 'events' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('events')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </Button>

            <Button
              variant={activeView === 'households' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('households')}
            >
              <Home className="mr-2 h-4 w-4" />
              Households
            </Button>

            <Button
              variant={activeView === 'administrators' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('administrators')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Administrators
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
              variant={activeView === 'complexes' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('complexes')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Field Complexes
            </Button>
            <Button
              variant={activeView === 'scheduling' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('scheduling')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Scheduling
            </Button>
            <Button
              variant={activeView === 'teams' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('teams')}
            >
              <Users className="mr-2 h-4 w-4" />
              Teams
            </Button>

            {/* Add Chat Button */}
            <Link href="/chat">
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Button>
            </Link>

            {/* Settings Collapsible */}
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
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant={activeView === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('account')}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>
          </div>
          {/* Footer */}
          <div className="mt-auto space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-4 border-t">
              Powered by MatchPro
            </p>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default AdminDashboard;

function TeamsView() {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const { toast } = useToast();

  // Query for events
  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  // Query for age groups of selected event
  const ageGroupsQuery = useQuery({
    queryKey: ['/api/admin/events', selectedEvent, 'age-groups'],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const response = await fetch(`/api/admin/events/${selectedEvent}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
    enabled: !!selectedEvent
  });

  // Query for teams in selected event and age group
  const teamsQuery = useQuery({
    queryKey: ['/api/admin/teams', selectedEvent, selectedAgeGroup],
    queryFn: async () => {
      if (!selectedEvent || !selectedAgeGroup) return [];
      const response = await fetch(`/api/admin/teams?eventId=${selectedEvent}&ageGroup=${selectedAgeGroup}`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!selectedEvent && !!selectedAgeGroup
  });

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const addTeamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          eventId: selectedEvent,
          ageGroup: selectedAgeGroup
        })
      });
      if (!response.ok) throw new Error('Failed to add team');
      return response.json();
    },
    onSuccess: () => {
      teamsQuery.refetch();
      setNewTeamName("");
      setIsAddTeamModalOpen(false);
      toast({ title: "Success", description: "Team added successfully!" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add team",
        variant: "destructive"
      });
    }
  });

  const handleAddTeam = () => {
    if (!newTeamName || !selectedEvent || !selectedAgeGroup) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    addTeamMutation.mutate();
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Teams Management</h2>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Event</Label>
              <Select
                value={selectedEvent?.toString()}
                onValueChange={(value) => {
                  setSelectedEvent(parseInt(value));
                  setSelectedAgeGroup(""); // Reset age group when event changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {eventsQuery.data?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div>
                <Label>Age Group</Label>
                <Select
                  value={selectedAgeGroup}
                  onValueChange={setSelectedAgeGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroupsQuery.data?.map((group: any) => (
                      <SelectItem key={group.ageGroup} value={group.ageGroup}>
                        {group.ageGroup} ({group.gender}) - {group.teamCount} teams
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedEvent && selectedAgeGroup && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Teams ({teamsQuery.data?.length || 0})
              </h3>
              <Button onClick={() => setIsAddTeamModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && selectedAgeGroup && (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : teamsQuery.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No teams found for this age group.
                    </TableCell>
                  </TableRow>
                ) : (
                  teamsQuery.data?.map((team: any) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>
                        {new Date(team.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddTeamModalOpen} onOpenChange={setIsAddTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTeamModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTeam}
              disabled={addTeamMutation.isPending}
            >
              {addTeamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdministratorsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: administrators, isLoading } = useQuery({
    queryKey: ['/api/admin/administrators'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!administrators?.length) {
    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Administrators</h2>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Administrators</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first administrator
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        </Card>

        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Administrators</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px] pl-6">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">Added</TableHead>
                  <TableHead className="w-[60px] pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {administrators?.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium pl-6">
                      {admin.firstName} {admin.lastName}
                    </TableCell>
                    <TableCell className="break-all">
                      {admin.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(admin.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Remove Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}