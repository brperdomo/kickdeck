import { useState, lazy, Suspense, useEffect } from "react";
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
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser, SelectComplex, SelectField, InsertField } from "@db/schema";
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
  Activity,
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
import { BrandingPreviewProvider, useBrandingPreview } from "@/hooks/use-branding-preview";
import { OrganizationSettingsProvider, useOrganizationSettings } from "@/hooks/use-organization-settings";
import { useExportProcess } from "@/hooks/use-export-process";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Add Fields Management Dialog
type FieldFormData = {
  name: string;
  type: 'soccer' | 'football' | 'baseball' | 'multipurpose';
  surfaceType: 'grass' | 'turf' | 'indoor';
  dimensions?: string;
  notes?: string;
};

function FieldsManagementDialog({ complex, isOpen, onClose }: {
  complex: SelectComplex;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<SelectField[]>([]);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldData, setNewFieldData] = useState<FieldFormData>({
    name: '',
    type: 'soccer',
    surfaceType: 'grass',
    dimensions: '',
    notes: ''
  });

  // Fetch fields data
  const { data: complexFields, refetch: refetchFields } = useQuery<SelectField[]>({
    queryKey: [`/api/admin/complexes/${complex?.id}/fields`],
    enabled: isOpen && !!complex?.id,
  });

  useEffect(() => {
    if (complexFields) {
      setFields(complexFields);
    }
  }, [complexFields]);

  // Add field mutation
  const addFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData): Promise<SelectField> => {
      const response = await fetch(`/api/admin/complexes/${complex.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          complexId: complex.id
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create field');
      }

      return response.json();
    },
    onSuccess: () => {
      refetchFields();
      setIsAddFieldModalOpen(false);
      setNewFieldData({
        name: '',
        type: 'soccer',
        surfaceType: 'grass',
        dimensions: '',
        notes: ''
      });
    }
  });

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldData.name || !newFieldData.type || !newFieldData.surfaceType) {
      return;
    }
    addFieldMutation.mutate(newFieldData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Fields - {complex?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Fields</h3>
            <Button onClick={() => setIsAddFieldModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Field
            </Button>
          </div>

          {fields.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No fields added yet</h3>
                <p className="text-muted-foreground">
                  Click 'Add New Field' to add fields to this complex
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{field.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {field.type} - {field.surfaceType}
                        </p>
                        {field.dimensions && (
                          <p className="text-sm text-muted-foreground">
                            Dimensions: {field.dimensions}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isAddFieldModalOpen} onOpenChange={setIsAddFieldModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddField}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="fieldName" className="flex items-center gap-2">
                    Field Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fieldName"
                    value={newFieldData.name}
                    onChange={(e) => setNewFieldData({ ...newFieldData, name: e.target.value })}
                    placeholder="e.g., Field 1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fieldType" className="flex items-center gap-2">
                    Field Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newFieldData.type}
                    onValueChange={(value: 'soccer' | 'football' | 'baseball' | 'multipurpose') =>
                      setNewFieldData({ ...newFieldData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soccer">Soccer</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="baseball">Baseball</SelectItem>
                      <SelectItem value="multipurpose">Multipurpose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="surfaceType" className="flex items-center gap-2">
                    Surface Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newFieldData.surfaceType}
                    onValueChange={(value: 'grass' | 'turf' | 'indoor') =>
                      setNewFieldData({ ...newFieldData, surfaceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select surface type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grass">Natural Grass</SelectItem>
                      <SelectItem value="turf">Artificial Turf</SelectItem>
                      <SelectItem value="indoor">Indoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={newFieldData.dimensions}
                    onChange={(e) => setNewFieldData({ ...newFieldData, dimensions: e.target.value })}
                    placeholder="e.g., 100x60 yards"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newFieldData.notes}
                    onChange={(e) => setNewFieldData({ ...newFieldData, notes: e.target.value })}
                    placeholder="Additional information about the field"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddFieldModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addFieldMutation.isPending}>
                  {addFieldMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Field'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Update ComplexesView component types
type ComplexFormData = {
  name: string;
  openTime: string;
  closeTime: string;
  address: string;
  city: string;
  state: string;
  country: string;
  rules?: string;
  directions?: string;
};

function ComplexesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [selectedComplex, setSelectedComplex] = useState<SelectComplex | null>(null);
  const [formData, setFormData] = useState<ComplexFormData>({
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

  // Query for complexes data
  const complexesQuery = useQuery<SelectComplex[]>({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  // Query for complex analytics
  type ComplexAnalytics = {
    totalComplexes: number;
    totalFields: number;
    eventsToday: number;
    averageUsage: number;
    mostActiveComplex: {
      id: number;
      name: string;
      address: string;
      fieldsCount: number;
    } | null;
  };

  const analyticsQuery = useQuery<ComplexAnalytics>({
    queryKey: ['/api/admin/complexes/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const createComplexMutation = useMutation({
    mutationFn: async (data: ComplexFormData): Promise<SelectComplex> => {
      const response = await fetch('/api/admin/complexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create complex');
      }
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
      setIsModalOpen(false);
      // Reset form data after successful creation
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

  const updateComplexMutation = useMutation({
    mutationFn: async (data: ComplexFormData & { id: number }) => {
      const response = await fetch(`/api/admin/complexes/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update complex');
      }
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
      setIsEditModalOpen(false);
      setSelectedComplex(null);
    }
  });

  const deleteComplexMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/complexes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete complex');
      }
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
      setIsDeleteDialogOpen(false);
      setSelectedComplex(null);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedComplex) {
        // Handle edit
        await updateComplexMutation.mutateAsync({
          id: selectedComplex.id,
          ...formData
        });
        setIsEditModalOpen(false);
      } else {
        // Handle create
        await createComplexMutation.mutateAsync(formData);
        setIsModalOpen(false);
      }

      // Reset form
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

      // Refetch complexes and analytics
      await Promise.all([
        complexesQuery.refetch(),
        analyticsQuery.refetch()
      ]);
    } catch (error) {
      console.error('Error submitting complex:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedComplex) return;

    try {
      await deleteComplexMutation.mutateAsync(selectedComplex.id);
      setIsDeleteDialogOpen(false);
      setSelectedComplex(null);

      // Refetch complexes and analytics after deletion
      await Promise.all([
        complexesQuery.refetch(),
        analyticsQuery.refetch()
      ]);
    } catch (error) {
      console.error('Error deleting complex:', error);
    }
  };

  const handleViewComplex = (complex: SelectComplex) => {
    setSelectedComplex(complex);
    setIsViewModalOpen(true);
  };

  const handleEditComplex = (complex: SelectComplex) => {
    setSelectedComplex(complex);
    setFormData(complex);
    setIsEditModalOpen(true);
  };

  const handleDeleteComplex = (complex: SelectComplex) => {
    setSelectedComplex(complex);
    setIsDeleteDialogOpen(true);
  };

  const handleManageFields = (complex: SelectComplex) => {
    setSelectedComplex(complex);
    setIsFieldsModalOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complexes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsQuery.data?.totalComplexes ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsQuery.data?.totalFields ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Complex</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsQuery.data?.mostActiveComplex?.name ?? 'N/A'}
            </div>
            {analyticsQuery.data?.mostActiveComplex && (
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsQuery.data.mostActiveComplex.fieldsCount} fields
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complex List */}
      <Card>
        <CardContent className="p-6">
          {complexesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : complexesQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No complexes found</h3>
              <p className="text-muted-foreground">
                Click 'Add New Complex' to see it here
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complexesQuery.data?.map((complex: SelectComplex) => (
                    <TableRow key={complex.id}>
                      <TableCell>{complex.name}</TableCell>
                      <TableCell>
                        {complex.address}, {complex.city}, {complex.state}
                      </TableCell>
                      <TableCell>
                        {complex.openTime} - {complex.closeTime}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewComplex(complex)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditComplex(complex)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleManageFields(complex)}>
                            <Flag className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteComplex(complex)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Complex Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Complex</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Complex Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter complex name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="openTime" className="flex items-center gap-2">
                  Open Time
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="closeTime" className="flex items-center gap-2">
                  Close Time
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  Address
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city" className="flex items-center gap-2">
                  City
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state" className="flex items-center gap-2">
                  State
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>

              <div className="col-span-2">
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

              <div className="col-span-2">
                <Label htmlFor="rules">Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Complex rules and regulations"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="directions">Directions</Label>
                <Textarea
                  id="directions"
                  value={formData.directions}
                  onChange={handleInputChange}
                  placeholder="Directions to the complex"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createComplexMutation.isPending}
              >
                {createComplexMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Complex'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the complex and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComplexMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Complex'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Complex Details</DialogTitle>
          </DialogHeader>
          {selectedComplex && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-lg font-medium">{selectedComplex.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Open Time</Label>
                  <p className="text-lg">{selectedComplex.openTime}</p>
                </div>
                <div>
                  <Label>Close Time</Label>
                  <p className="text-lg">{selectedComplex.closeTime}</p>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <p className="text-lg">
                  {selectedComplex.address}, {selectedComplex.city}, {selectedComplex.state}
                </p>
              </div>
              {selectedComplex.rules && (
                <div>
                  <Label>Rules</Label>
                  <p className="text-lg">{selectedComplex.rules}</p>
                </div>
              )}
              {selectedComplex.directions && (
                <div>
                  <Label>Directions</Label>
                  <p className="text-lg">{selectedComplex.directions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Fields Management Dialog */}
      {selectedComplex && (
        <FieldsManagementDialog
          complex={selectedComplex}
          isOpen={isFieldsModalOpen}
          onClose={() => {
            setIsFieldsModalOpen(false);
            setSelectedComplex(null);
          }}
        />
      )}
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
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Schedule Management</h3>
            <p className="text-muted-foreground">
              Manage game schedules, field assignments, and time slots
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AdminDashboard() {
  const [view, setView] = useState<View>('complexes');
  const [settingsView, setSettingsView] = useState<SettingsView>('branding');
  const { user } = useUser();
  const [, navigate] = useLocation();

  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  const renderView = () => {
    switch (view) {
      case 'events':
        return <div>Events view will be implemented here</div>;
      case 'teams':
        return <div>Teams view will be implemented here</div>;
      case 'administrators':
        return <div>Administrators view will be implemented here</div>;
      case 'settings':
        return (
          <OrganizationSettingsProvider>
            <BrandingPreviewProvider>
              {settingsView === 'branding' && <OrganizationSettingsForm />}
              {settingsView === 'payments' && <PaymentsSettingsView />}
            </BrandingPreviewProvider>
          </OrganizationSettingsProvider>
        );
      case 'households':
        return <div>Households view will be implemented here</div>;
      case 'reports':
        return <ReportsView />;
      case 'account':
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <MyAccount />
          </Suspense>
        );
      case 'complexes':
        return <ComplexesView />;
      case 'scheduling':
        return <SchedulingView/>;
      default:
        return <div>Select a view from the sidebar</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
              variant={view === 'events' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('events')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </Button>

            <Button
              variant={view === 'households' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('households')}
            >
              <Home className="mr-2 h-4 w-4" />
              Households
            </Button>

            <Button
              variant={view === 'administrators' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('administrators')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Administrators
            </Button>

            <Button
              variant={view === 'reports' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant={view === 'complexes' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('complexes')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Field Complexes
            </Button>
            <Button
                variant={view === 'scheduling' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('scheduling')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Scheduling
              </Button>
            <Collapsible
              open={false}
              onOpenChange={(open) => {}}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={view === 'settings' ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                >
                  <span className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-4">
                <Button
                  variant={settingsView === 'branding' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setView('settings');
                    setSettingsView('branding');
                  }}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Branding
                </Button>
                <Button
                  variant={settingsView === 'payments' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setView('settings');
                    setSettingsView('payments');
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant={view === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setView('account')}
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
              onClick={() => {}}
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
      <main className="flex-1 overflow-auto p-6">
        {renderView()}
      </main>
    </div>
  );
}

export default AdminDashboard;