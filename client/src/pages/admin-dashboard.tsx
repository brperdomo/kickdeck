import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  Edit,
  Eye,
  Link2,
  MoreHorizontal,
  Plus,
  Trash,
  Loader2,
  Search,
  Ticket
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Complex } from "@/types/complex";
import { Field } from "@/types/field";
import { ComplexFormValues } from "@/components/complex-editor";
import { FieldFormValues } from "@/components/field-editor";
import { useCreateComplexMutation, useUpdateComplexMutation } from "@/hooks/use-complex";
import { useCreateFieldMutation, useUpdateFieldMutation } from "@/hooks/use-field";
import { Loader2 } from "@/components/ui/loader";
import ComplexEditor from "@/components/complex-editor";
import FieldEditor from "@/components/field-editor";


type View = 'administrators' | 'events' | 'teams' | 'complexes' | 'households' | 'scheduling' | 'settings' | 'reports' | 'chat' | 'account' | 'files';
type SettingsView = 'general' | 'branding' | 'payments' | 'styling';

const AdministratorsView = () => <div>Administrators View</div>;
const ComplexesView = () => <div>Complexes View</div>;
const HouseholdsView = () => <div>Households View</div>;
const SchedulingView = () => <div>Scheduling View</div>;
const ReportsView = () => <div>Reports View</div>;
const MyAccount = () => <div>My Account</div>;
const FileManager = () => <div>FileManager</div>;
const GeneralSettingsView = () => <div>General Settings View</div>;
const BrandingPreviewProvider = ({children}: {children: React.ReactNode}) => <>{children}</>;
const OrganizationSettingsForm = () => <div>Organization Settings Form</div>;
const BrandingPreview = () => <div>Branding Preview</div>;


function isAdminUser(user: any): boolean {
  // Replace with your actual admin user check logic
  return user.role === 'admin';
}

function ComplexesView() {
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const { data: complexesQuery } = useQuery({
    queryKey: ['/api/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });
  const { data: fieldsQuery, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/fields', viewingComplexId],
    queryFn: async () => {
      if (!viewingComplexId) return [];
      const response = await fetch(`/api/fields?complexId=${viewingComplexId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: !!viewingComplexId
  });
  const updateComplexMutation = useUpdateComplexMutation();
  const createComplexMutation = useCreateComplexMutation();
  const updateFieldMutation = useUpdateFieldMutation();
  const createFieldMutation = useCreateFieldMutation();
  const { toast } = useToast();


  const handleUpdateFieldSuccess = () => {
    toast({
      title: "Success",
      description: "Field updated successfully",
    });
    setIsFieldModalOpen(false);
    setSelectedField(null);
  };

  useEffect(() => {
    if(updateFieldMutation.isSuccess){
      handleUpdateFieldSuccess()
    }
  }, [updateFieldMutation.isSuccess])

  const handleUpdateFieldError = (error: unknown) => {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to update field",
      variant: "destructive",
    });
  };

  useEffect(() => {
    if(updateFieldMutation.isError){
      handleUpdateFieldError(updateFieldMutation.error)
    }
  }, [updateFieldMutation.isError])


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
                  {fieldsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : fieldsQuery?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fields available</p>
                  ) : (
                    <div className="grid gap-2">
                      {fieldsQuery?.map((field: Field) => (
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

export function EventsView() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

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
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (!eventsQuery.data) return;
                  const filtered = eventsQuery.data.filter((event: any) =>
                    event.name.toLowerCase().includes(searchTerm)
                  );
                  setFilteredEvents(filtered);
                }}
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents(filteredEvents.map((event: any) => event.id));
                        } else {
                          setSelectedEvents([]);
                        }
                      }}
                    />
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
                            setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.startDate} - {event.endDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        (() => {
                          const now = new Date();
                          const start = new Date(event.startDate);
                          const end = new Date(event.endDate);
                          end.setHours(23, 59, 59, 999);

                          if (now > end) return "secondary";
                          if (now >= start && now <= end) return "default";
                          return "outline";
                        })()
                      }>
                        {(() => {
                          const now = new Date();
                          const start = new Date(event.startDate);
                          const end = new Date(event.endDate);
                          end.setHours(23, 59, 59, 999);

                          if (now > end) return "Past";
                          if (now >= start && now <= end) return "Active";
                          return "Upcoming";
                        })()}
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
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/coupons`)}>
                            <Ticket className="mr-2 h-4 w-4" />
                            Coupons
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
                            className="text-red-600 hover:text-red-700"
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

export default function AdminDashboard() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('events');
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUpdatesLog, setShowUpdatesLog] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

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
      default:
        return <div>Feature coming soon</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="w-64 bg-card border-r flex flex-col h-full">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">MatchPro Dashboard</h1>
          </div>

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

      <div className="flex-1 overflow-auto">
        <AdminBanner />
        <div className="p-8">
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
                    <p className="text-xs opacity-70">{new Date(message.timestamp).toLocaleString()}</p>
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
    case 'branding':      return (        <BrandingPreviewProvider>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <OrganizationSettingsForm />
            </div>
            <BrandingPreview />
          </div>
        <BrandingPreviewProvider>
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


export default AdminDashboard;