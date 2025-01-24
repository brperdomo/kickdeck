import { useState, useMemo } from "react";
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
  Plus,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminModal } from "@/components/admin/AdminModal";
import { lazy, Suspense } from "react";

const MyAccount = lazy(() => import("./my-account"));

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling';
type SettingsView = 'branding' | 'general' | 'payments';

function AdministratorsView() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("super_admin");

  // Query to fetch all administrators
  const administratorsQuery = useQuery({
    queryKey: ['/api/admin/administrators'],
    queryFn: async () => {
      const response = await fetch('/api/admin/administrators');
      if (!response.ok) throw new Error('Failed to fetch administrators');
      return response.json();
    }
  });

  const administrators = useMemo(() => {
    if (!administratorsQuery.data) return {};
    return administratorsQuery.data.reduce((acc: Record<string, any[]>, admin: any) => {
      const type = admin.adminType || 'super_admin';
      if (!acc[type]) acc[type] = [];
      acc[type].push(admin);
      return acc;
    }, {});
  }, [administratorsQuery.data]);

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

        {Object.keys(administrators).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getTypeLabel(type)}
                  <Badge className={`ml-2 ${getBadgeColor(type)}`}>
                    {administrators[type]?.length || 0} Members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {administrators[type]?.map((admin: any) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.firstName} {admin.lastName}
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {admin.role}
                          </Badge>
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
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
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
        onOpenChange={setIsAddModalOpen}
      />
    </>
  );
}

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('administrators');
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isAdminUser(user)) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const renderView = () => {
    switch (activeView) {
      case 'administrators':
        return <AdministratorsView />;
      case 'settings':
        return <SettingsView activeSettingsView={activeSettingsView} />;
      case 'account':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <MyAccount />
          </Suspense>
        );
      default:
        return <div>Feature coming soon</div>;
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
              variant={activeView === 'administrators' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('administrators')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Administrators
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
        {renderView()}
      </div>
    </div>
  );
}

function SettingsView({ activeSettingsView }: { activeSettingsView: SettingsView }) {
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

export default AdminDashboard;