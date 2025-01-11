import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
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
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households';

export default function AdminDashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<View>('events');

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<any[]>({
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


  if (!isAdminUser(user)) {
    return null;
  }

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

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a menu item from the sidebar</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="h-6 w-6" />
          <h1 className="font-semibold text-lg">Soccer Events</h1>
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
            variant={currentView === 'settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}