import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectUser } from "@db/schema";
import {
  Loader2,
  Search,
  Plus,
  Settings,
  Users,
  Calendar,
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
  FileSpreadsheet,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { BrandingPreviewProvider, useBrandingPreview } from "@/hooks/use-branding-preview";
import { useExportProcess } from "@/hooks/use-export-process"; // Added import
import React from 'react';


// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account';
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
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
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

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<View>('events');
  const { currentColor, setColor, isLoading: isThemeLoading } = useTheme();

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["/api/admin/events"],
    enabled: isAdminUser(user) && currentView === 'events',
    staleTime: 30000,
    gcTime: 3600000,
  });

  const { data: administrators, isLoading: adminsLoading, error: adminsError } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/administrators"],
    enabled: isAdminUser(user) && currentView === 'administrators',
    staleTime: 30000,
    gcTime: 3600000,
  });

  const { data: households, isLoading: householdsLoading, error: householdsError } = useQuery<any[]>({
    queryKey: ["/api/admin/households"],
    enabled: isAdminUser(user) && currentView === 'households',
    staleTime: 30000,
    gcTime: 3600000,
  });


  const renderContent = () => {
    switch (currentView) {
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
                        <TableHead>Last Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Primary Email</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created At</TableHead>
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
                          <TableCell colSpan={6} className="h-24 text-center text-destructive">
                            Error loading households: {householdsError instanceof Error ? householdsError.message : 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ) : !households || households.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No households found
                          </TableCell>
                        </TableRow>
                      ) : (
                        households.map((household:any) => (
                          <TableRow key={household.id}>
                            <TableCell>{household.lastName}</TableCell>
                            <TableCell>
                              {household.address}, {household.city}, {household.state} {household.zipCode}
                            </TableCell>
                            <TableCell>{household.primaryEmail}</TableCell>
                            <TableCell>
                              {/* This will be populated once we implement the relationship query */}
                              <Badge variant="secondary">2 members</Badge>
                            </TableCell>
                            <TableCell>{new Date(household.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Administrators</h2>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Administrator User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Full Admin Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : adminsError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-destructive">
                            Error loading administrators: {adminsError instanceof Error ? adminsError.message : 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ) : !administrators || administrators.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No administrators found
                          </TableCell>
                        </TableRow>
                      ) : (
                        administrators.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </TableCell>
                            <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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

      case 'events':
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-9 w-[300px]"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Existing events table content */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Date
                            <div className="flex flex-col">
                              <ChevronUp className="h-3 w-3" />
                              <ChevronDown className="h-3 w-3" />
                            </div>
                          </div>
                        </TableHead>
                        <TableHead># of Applications</TableHead>
                        <TableHead># of Accepted Teams</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : eventsError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-destructive">
                            Error loading events: {eventsError instanceof Error ? eventsError.message : 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ) : !events || events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No events found
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map((event:any) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.name}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>{event.applications}</TableCell>
                            <TableCell>{event.acceptedTeams}</TableCell>
                            <TableCell>
                              <span className={
                                `px-2 py-1 rounded-full text-xs font-medium ${
                                  event.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`
                              }>
                                {event.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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

      case 'settings':
        return (
          <BrandingPreviewProvider>
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Settings</h2>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Primary Color
                      </Label>
                      <Select
                        value={currentColor}
                        onValueChange={setColor}
                        disabled={isThemeLoading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slate">Slate</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="violet">Violet</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Choose the primary color for the dashboard interface.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <OrganizationSettingsForm />
              </div>
            </>
          </BrandingPreviewProvider>
        );
      case 'reports':
        return <ReportsView />;
      case 'account':
        const MyAccount = React.lazy(() => import('./my-account'));
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }>
            <MyAccount />
          </React.Suspense>
        );
      default:
        return null;
    }
  };

  if (!isAdminUser(user)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <h1 className="font-semibold text-lg">Admin Dashboard</h1>
          </div>
        </div>

        <nav className="space-y-2">
          <Button
            variant={currentView === 'events' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('events')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Events
          </Button>
          <Button
            variant={currentView === 'teams' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('teams')}
          >
            <Users className="mr-2 h-4 w-4" />
            Teams
          </Button>
          <Button
            variant={currentView === 'households' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('households')}
          >
            <Home className="mr-2 h-4 w-4" />
            Households
          </Button>
          <Button
            variant={currentView === 'administrators' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('administrators')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Administrators
          </Button>
          <Button
            variant={currentView === 'account' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('account')}
          >
            <User className="mr-2 h-4 w-4" />
            My Account
          </Button>
          <Button
            variant={currentView === 'settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            variant={currentView === 'reports' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('reports')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-border px-8 flex items-center justify-end bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;