import { useState, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { 
  LogOut, 
  User, 
  Home,
  CalendarDays,
  Users,
  Building2,
  MessageSquare,
  Settings,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";

// Lazy loaded components
const MyAccount = lazy(() => import("./my-account"));
const EventManager = lazy(() => import("@/components/events/EventManager"));
const TeamManager = lazy(() => import("@/components/teams/TeamManager"));
const ComplexManager = lazy(() => import("@/components/ComplexEditor"));
const ChatManager = lazy(() => import("./chat"));
const AdminModal = lazy(() => import("@/components/admin/AdminModal"));

type AdminView = 'organization' | 'account' | 'events' | 'teams' | 'complexes' | 'chat' | 'administrators';

function OrganizationBanner() {
  const { settings } = useOrganizationSettings();

  if (!settings?.logoUrl) {
    return null;
  }

  return (
    <div className="w-full bg-background border-b">
      <div className="container mx-auto py-4 px-4 flex items-center justify-center">
        <img 
          src={settings.logoUrl} 
          alt="Organization logo"
          className="h-16 object-contain"
        />
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [view, setView] = useState<AdminView>('organization');
  const { user } = useUser();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OrganizationBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r flex flex-col">
          <div className="p-4 flex flex-col h-full">
            <div className="space-y-2">
              <Button
                variant={view === 'organization' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('organization')}
              >
                <Home className="mr-2 h-4 w-4" />
                Organization
              </Button>

              <Button
                variant={view === 'events' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('events')}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Events
              </Button>

              <Button
                variant={view === 'teams' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('teams')}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Teams
              </Button>

              <Button
                variant={view === 'complexes' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('complexes')}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Complexes
              </Button>

              <Button
                variant={view === 'chat' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('chat')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Button>

              <Button
                variant={view === 'administrators' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('administrators')}
              >
                <Users className="mr-2 h-4 w-4" />
                Administrators
              </Button>

              <Button
                variant={view === 'account' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setView('account')}
              >
                <User className="mr-2 h-4 w-4" />
                My Account
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  window.location.href = '/api/auth/logout';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Suspense fallback={<div>Loading...</div>}>
              {view === 'organization' && <GeneralSettingsView />}
              {view === 'account' && <MyAccount />}
              {view === 'events' && <EventManager />}
              {view === 'teams' && <TeamManager />}
              {view === 'complexes' && <ComplexManager />}
              {view === 'chat' && <ChatManager />}
              {view === 'administrators' && <AdminModal />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;