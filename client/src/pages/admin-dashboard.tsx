import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Building2, 
  Calendar, 
  Settings, 
  Shield, 
  Home, 
  LogOut, 
  FileText,
  User,
  ChevronRight,
  Plus,
  Loader2,
  Flag,
  Trash,
  Edit,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { SelectUser } from "@db/schema";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

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

interface Field {
  id: number;
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
  specialInstructions?: string;
  complexId: number;
}

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling';
type SettingsView = 'branding' | 'general' | 'payments';

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
      return response.json() as Promise<Complex[]>;
    }
  });

  // Query for fields data
  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/complexes', selectedComplexId, 'fields'],
    queryFn: async () => {
      if (!selectedComplexId) return null;
      const response = await fetch(`/api/admin/complexes/${selectedComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      const data = await response.json() as Field[];
      // If complex is closed, mark all fields as closed
      if (selectedComplex && !selectedComplex.isOpen) {
        return data.map(field => ({ ...field, isOpen: false }));
      }
      return data;
    },
    enabled: !!selectedComplexId && isViewFieldsModalOpen
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: Omit<Field, 'id'>) => {
      const response = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      fieldsQuery.refetch();
      complexesQuery.refetch();
      setIsFieldModalOpen(false);
      setFieldFormData({
        name: '',
        hasLights: false,
        hasParking: false,
        isOpen: true,
        specialInstructions: ''
      });
      toast({
        title: "Field created",
        description: "The field has been created successfully.",
      });
    }
  });

  // Toggle complex status mutation
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
      return { response: await response.json(), isOpen };
    },
    onSuccess: (data) => {
      complexesQuery.refetch();
      if (isViewFieldsModalOpen && selectedComplexId) {
        fieldsQuery.refetch();
      }
      toast({
        title: "Complex status updated",
        description: data.isOpen ?
          "Complex has been opened. You can now manage individual field statuses." :
          "Complex has been closed. All fields have been automatically closed.",
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

  // Toggle field status mutation
  const toggleFieldStatusMutation = useMutation({
    mutationFn: async ({ fieldId, isOpen }: { fieldId: number; isOpen: boolean }) => {
      const response = await fetch(`/api/admin/fields/${fieldId}/status`, {
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
      fieldsQuery.refetch();
      complexesQuery.refetch();
      toast({
        title: "Field status updated",
        description: "The field status has been updated successfully.",
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

  const handleViewFields = (complex: Complex) => {
    setSelectedComplexId(complex.id);
    setSelectedComplex(complex);
    setIsViewFieldsModalOpen(true);
  };

  // Render fields modal
  const renderFieldsModal = () => (
    <Dialog open={isViewFieldsModalOpen} onOpenChange={setIsViewFieldsModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Fields in {selectedComplex?.name}
            {!selectedComplex?.isOpen && (
              <span className="ml-2 text-sm text-red-500">
                (Complex Closed - All Fields Automatically Closed)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {fieldsQuery.isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !fieldsQuery.data?.length ? (
            <p className="text-center text-muted-foreground">No fields found in this complex.</p>
          ) : (
            <div className="space-y-4">
              {fieldsQuery.data
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="font-medium">{field.name}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {field.hasLights && <span>Has Lights</span>}
                        {field.hasParking && <span>Has Parking</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.isOpen}
                        disabled={!selectedComplex?.isOpen}
                        onCheckedChange={(checked) =>
                          toggleFieldStatusMutation.mutate({ fieldId: field.id, isOpen: checked })
                        }
                      />
                      <span className={field.isOpen ? "text-green-600" : "text-red-600"}>
                        {field.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
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

      {/* Complex List */}
      <Card>
        <CardContent className="p-0">
          {complexesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
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
                  <TableHead className="text-center">Complex Status</TableHead>
                  <TableHead className="text-center">Fields</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complexesQuery.data?.map((complex) => (
                  <TableRow key={complex.id}>
                    <TableCell className="font-medium">{complex.name}</TableCell>
                    <TableCell>
                      {complex.address}, {complex.city}, {complex.state}
                    </TableCell>
                    <TableCell>
                      {complex.openTime} - {complex.closeTime}
                    </TableCell>
                    <TableCell className="text-center">
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
                    <TableCell className="text-center">
                      <span className="text-green-600">{complex.openFields} Open</span>
                      {" / "}
                      <span className="text-red-600">{complex.closedFields} Closed</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          <TooltipContent>View Fields</TooltipContent>
                        </Tooltip>
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
                          <TooltipContent>Add Field</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Render field creation modal */}
      <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="name"
                  value={fieldFormData.name}
                  onChange={(e) =>
                    setFieldFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter field name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLights"
                  checked={fieldFormData.hasLights}
                  onCheckedChange={(checked) =>
                    setFieldFormData((prev) => ({ ...prev, hasLights: !!checked }))
                  }
                />
                <Label htmlFor="hasLights">Has Lights</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasParking"
                  checked={fieldFormData.hasParking}
                  onCheckedChange={(checked) =>
                    setFieldFormData((prev) => ({ ...prev, hasParking: !!checked }))
                  }
                />
                <Label htmlFor="hasParking">Has Parking</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={fieldFormData.specialInstructions}
                  onChange={(e) =>
                    setFieldFormData((prev) => ({
                      ...prev,
                      specialInstructions: e.target.value,
                    }))
                  }
                  placeholder="Enter special instructions"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFieldModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFieldMutation.isPending}>
                {createFieldMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {renderFieldsModal()}
    </>
  );
}

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<View>('complexes');
  const [currentSettingsView, setCurrentSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const renderContent = () => {
    switch (currentView) {
      case 'complexes':
        return <ComplexesView />;
      // Other views will be added back as needed
      default:
        return <div>Select a view from the sidebar</div>;
    }
  };

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
              variant={currentView === 'events' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('events')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
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
              variant={currentView === 'reports' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>

            <Button
              variant={currentView === 'complexes' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('complexes')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Field Complexes
            </Button>

            <Collapsible
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={currentView === 'settings' ? 'secondary' : 'ghost'}
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
                  variant={currentSettingsView === 'branding' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentView('settings');
                    setCurrentSettingsView('branding');
                  }}
                >
                  Settings options will be added here
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant={currentView === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('account')}
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