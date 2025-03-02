import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "@/hooks/use-location";
import { 
  Shield, 
  Calendar, 
  Users, 
  Building2, 
  Home, 
  CalendarDays, 
  FileText, 
  MessageSquare, 
  ImageIcon, 
  Ticket, 
  FormInput, 
  User, 
  Settings,
  UserCircle,
  X,
  MoreHorizontal,
  Edit,
  Trash,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminBanner from "@/components/admin/AdminBanner";
import { UpdatesLogModal } from "@/components/admin/UpdatesLogModal";
import LogoutOverlay from "@/components/LogoutOverlay";

type View = 'administrators' | 'events' | 'teams' | 'complexes' | 'households' | 
  'scheduling' | 'reports' | 'chat' | 'files' | 'coupons' | 'formTemplates' | 'account' | 'settings';

type SettingsView = 'general' | 'email' | 'appearance' | 'integrations' | 'billing' | 'security';

const isAdminUser = (user: any) => {
  return user?.role === 'admin' || user?.isAdmin;
};

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
        return (
          <div>
            <Card>
              <CardContent className="p-6">
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
                    {[
                      {
                        id: 1,
                        name: "Jane Smith",
                        email: "jane@example.com",
                        roles: ["Admin", "Manager"],
                      },
                      {
                        id: 2,
                        name: "John Doe",
                        email: "john@example.com",
                        roles: ["Admin"],
                      },
                    ].map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {admin.roles.map((role) => (
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
                              <DropdownMenuItem>
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
          </div>
        );
      case 'events':
        return (
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
                <div className="grid gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Summer Soccer Tournament</h3>
                    <p className="text-sm text-muted-foreground">July 15-20, 2023</p>
                    <div className="flex mt-2">
                      <Badge className="mr-2">Soccer</Badge>
                      <Badge variant="outline">32 Teams</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Fall Basketball League</h3>
                    <p className="text-sm text-muted-foreground">September 5-October 30, 2023</p>
                    <div className="flex mt-2">
                      <Badge className="mr-2">Basketball</Badge>
                      <Badge variant="outline">16 Teams</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'chat':
        return (
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Chat Dashboard</h2>
                <p>Chat functionality will be displayed here.</p>
                <Button 
                  className="mt-4"
                  onClick={() => setLocation("/admin/chat")}
                >
                  Open Chat Interface
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
                <p>This section is currently under development.</p>
              </CardContent>
            </Card>
          </div>
        );
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
              variant={activeView === 'formTemplates' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('formTemplates')}
            >
              <FormInput className="mr-2 h-4 w-4" />
              Form Templates
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
              variant={activeView === 'chat' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('chat')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
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
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-red-500"
              onClick={handleLogout}
            >
              <User className="mr-2 h-4 w-4" />
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