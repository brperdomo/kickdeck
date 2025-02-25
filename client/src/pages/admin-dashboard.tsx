import { useState, lazy, Suspense } from "react";
import { 
  Menu, Calendar, Shield, Building2, LogOut, FileText, 
  User, Settings, Users, CalendarDays, ImageIcon, 
  FormInput, MessageSquare, Plus, Ticket, Loader2
} from "lucide-react";
import { AdminBanner } from "@/components/admin/AdminBanner";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { SelectUser } from "@db/schema";
import { LogoutOverlay } from "@/components/ui/logout-overlay";

// Import views
import { EventsView } from "@/views/events";
import { TeamsView } from "@/views/teams";
import { AdministratorsView } from "@/views/administrators";
import { ComplexesView } from "@/views/complexes";
import { HouseholdsView } from "@/views/households";
import { SchedulingView } from "@/views/scheduling";
import { SettingsView } from "@/views/settings";
import { ReportsView } from "@/views/reports";
import { ChatView } from "@/views/chat";
import { CouponManagement } from "@/views/coupons";
import { FileManager } from "@/components/FileManager";
import { FormTemplatesView } from "@/views/form-templates";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";


// Lazy load other components
const MyAccount = lazy(() => import("./my-account"));

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'chat' | 'files' | 'coupons' | 'formTemplates';
type SettingsView = 'branding' | 'general' | 'payments' | 'styling';

function AdminDashboard() {
  const [selectedView, setSelectedView] = useState<View>('events');
  const [selectedSettingsView, setSelectedSettingsView] = useState<SettingsView>('general');
  const { user, logout } = useUser();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
      toast({
        title: "Success",
        description: "Successfully Logged Out",
      });
    }, 1500);
  };

  if (!isAdminUser(user)) {
    return <div>Access Denied</div>;
  }

  const NavigationItem = ({
    icon: Icon,
    label,
    view,
    onClick
  }: {
    icon: any;
    label: string;
    view: View;
    onClick: () => void;
  }) => (
    <Button
      variant={selectedView === view ? "secondary" : "ghost"}
      className="w-full justify-start text-base py-4"
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mr-3" />
      {label}
    </Button>
  );

  const MobileNavigation = () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>
            <div className="flex items-center justify-center">
              <img
                src="/attached_assets/MatchPro.ai_Stacked_Color.png"
                alt="MatchPro Logo"
                className="h-8 w-auto"
              />
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-1">
              <NavigationItem
                icon={Calendar}
                label="Events"
                view="events"
                onClick={() => setSelectedView('events')}
              />
              <NavigationItem
                icon={Users}
                label="Teams"
                view="teams"
                onClick={() => setSelectedView('teams')}
              />
              <NavigationItem
                icon={Shield}
                label="Administrators"
                view="administrators"
                onClick={() => setSelectedView('administrators')}
              />
              <NavigationItem
                icon={Building2}
                label="Complexes"
                view="complexes"
                onClick={() => setSelectedView('complexes')}
              />
              <NavigationItem
                icon={CalendarDays}
                label="Scheduling"
                view="scheduling"
                onClick={() => setSelectedView('scheduling')}
              />
              <NavigationItem
                icon={MessageSquare}
                label="Chat"
                view="chat"
                onClick={() => setSelectedView('chat')}
              />
              <NavigationItem
                icon={FileText}
                label="Reports"
                view="reports"
                onClick={() => setSelectedView('reports')}
              />
              <NavigationItem
                icon={Ticket}
                label="Coupons"
                view="coupons"
                onClick={() => setSelectedView('coupons')}
              />
              <NavigationItem
                icon={FormInput}
                label="Form Templates"
                view="formTemplates"
                onClick={() => setSelectedView('formTemplates')}
              />
              <NavigationItem
                icon={Settings}
                label="Settings"
                view="settings"
                onClick={() => setSelectedView('settings')}
              />
              <NavigationItem
                icon={User}
                label="My Account"
                view="account"
                onClick={() => setSelectedView('account')}
              />
            </div>
          </div>

          <div className="p-4 border-t mt-auto">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );

  function renderView() {
    switch (selectedView) {
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
        if (selectedSettingsView === 'general') {
          return <GeneralSettingsView />;
        }
        return <SettingsView activeSettingsView={selectedSettingsView} />;
      case 'reports':
        return <ReportsView />;
      case 'chat':
        return <ChatView />;
      case 'account':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
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
        return <FormTemplatesView />;
      default:
        return (
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground">This feature is under development</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <AdminBanner />}

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
          <MobileNavigation />
          <h1 className="text-lg font-semibold text-primary">
            {getViewTitle(selectedView)}
          </h1>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </header>
      )}

      <div className={`${isMobile ? 'pt-14' : ''} container mx-auto px-4 py-6`}>
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row gap-6'}`}>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <NavigationItem
                      icon={Calendar}
                      label="Events"
                      view="events"
                      onClick={() => setSelectedView('events')}
                    />
                    <NavigationItem
                      icon={Users}
                      label="Teams"
                      view="teams"
                      onClick={() => setSelectedView('teams')}
                    />
                    <NavigationItem
                      icon={Shield}
                      label="Administrators"
                      view="administrators"
                      onClick={() => setSelectedView('administrators')}
                    />
                    <NavigationItem
                      icon={Building2}
                      label="Complexes"
                      view="complexes"
                      onClick={() => setSelectedView('complexes')}
                    />
                    <NavigationItem
                      icon={CalendarDays}
                      label="Scheduling"
                      view="scheduling"
                      onClick={() => setSelectedView('scheduling')}
                    />
                    <NavigationItem
                      icon={MessageSquare}
                      label="Chat"
                      view="chat"
                      onClick={() => setSelectedView('chat')}
                    />
                    <NavigationItem
                      icon={FileText}
                      label="Reports"
                      view="reports"
                      onClick={() => setSelectedView('reports')}
                    />
                    <NavigationItem
                      icon={Ticket}
                      label="Coupons"
                      view="coupons"
                      onClick={() => setSelectedView('coupons')}
                    />
                    <NavigationItem
                      icon={FormInput}
                      label="Form Templates"
                      view="formTemplates"
                      onClick={() => setSelectedView('formTemplates')}
                    />
                    <NavigationItem
                      icon={Settings}
                      label="Settings"
                      view="settings"
                      onClick={() => setSelectedView('settings')}
                    />
                    <NavigationItem
                      icon={User}
                      label="My Account"
                      view="account"
                      onClick={() => setSelectedView('account')}
                    />
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          {/* Main Content */}
          <main className={`flex-1 ${isMobile ? 'mt-4' : ''}`}>
            <div className="space-y-6">
              {renderView()}
            </div>
          </main>
        </div>
      </div>

      {showLogoutOverlay && (
        <LogoutOverlay onFinished={() => setShowLogoutOverlay(false)} />
      )}
    </div>
  );
}

function getViewTitle(view: View): string {
  const titles: Record<View, string> = {
    events: 'Events',
    teams: 'Teams',
    administrators: 'Administrators',
    settings: 'Settings',
    households: 'Households',
    reports: 'Reports',
    account: 'Account',
    complexes: 'Complexes',
    scheduling: 'Scheduling',
    chat: 'Chat',
    files: 'Files',
    coupons: 'Coupons',
    formTemplates: 'Form Templates'
  };
  return titles[view];
}

export default AdminDashboard;