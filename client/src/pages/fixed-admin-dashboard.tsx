import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { 
  Calendar, Shield, Home, LogOut, FileText, AlertTriangle, User, UserRound,
  Settings, Users, ChevronRight, Building2, MessageSquare, Sparkles,
  Moon, Sun, CalendarDays, ImageIcon, FormInput, KeyRound
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { useUser } from "../hooks/use-user";
import { usePermissions } from "../hooks/use-permissions";
import { useTheme } from "../hooks/use-theme";
// { SelectUser } // Database import disabled for build
import { AnimatedSidebar } from "../components/admin/AnimatedSidebar";
import { AnimatedContent } from "../components/ui/animation";
import { AnimatedNavigationButton } from "../components/admin/AnimatedNavigationButton";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBanner } from "../components/admin/AdminBanner";

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'files' | 'formTemplates' | 'roles' | 'members';

/**
 * Enhanced AdminDashboard component with animations
 */
export function AdminDashboard() {
  const { user, isLoading: isUserLoading } = useUser();
  const { hasPermission } = usePermissions();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>('events');
  const { setAppearance, currentAppearance } = useTheme();
  const [theme, setTheme] = useState(currentAppearance);
  const [showInternalOps, setShowInternalOps] = useState(false);
  const [showUpdatesLog, setShowUpdatesLog] = useState(false);

  // Show a loading state during initial load
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
            }}
          >
            <Calendar className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect if not admin
  useEffect(() => {
    if (!user) return;
    if (!isAdminUser(user)) setLocation("/");
  }, [user, setLocation]);

  // Handle appearance toggle
  const handleAppearanceToggle = async () => {
    const newAppearance = currentAppearance === 'dark' ? 'light' : 'dark';
    await setAppearance(newAppearance);
    setTheme(newAppearance);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Animated Sidebar */}
      <AnimatedSidebar title="Admin Dashboard" icon={<Calendar className="h-5 w-5 text-primary" />}>
        {/* Navigation - using staggered animation with map and indexes */}
        {[
          {
            view: "administrators",
            onClick: () => setActiveView('administrators'),
            icon: <Shield className="h-4 w-4" />,
            label: "Administrators",
            permission: "view_administrators"
          },
          {
            view: "formTemplates",
            onClick: () => setActiveView('formTemplates'),
            icon: <FormInput className="h-4 w-4" />,
            label: "Form Templates",
            permission: "view_form_templates"
          },
          {
            view: "events",
            onClick: () => setActiveView('events'),
            icon: <Calendar className="h-4 w-4" />,
            label: "Events",
            permission: "view_events"
          },
          {
            view: "teams",
            onClick: () => setActiveView('teams'),
            icon: <Users className="h-4 w-4" />,
            label: "Teams",
            permission: "view_teams"
          },
          {
            view: "complexes",
            onClick: () => setActiveView('complexes'),
            icon: <Building2 className="h-4 w-4" />,
            label: "Field Complexes",
            permission: "view_complexes"
          },
          {
            view: "households",
            onClick: () => setActiveView('households'),
            icon: <Home className="h-4 w-4" />,
            label: "MatchPro Client",
            permission: "view_households"
          },
          {
            view: "scheduling",
            onClick: () => setActiveView('scheduling'),
            icon: <CalendarDays className="h-4 w-4" />,
            label: "Scheduling",
            permission: "view_scheduling"
          },
          {
            view: "reports",
            onClick: () => setActiveView('reports'),
            icon: <FileText className="h-4 w-4" />,
            label: "Reports",
            permission: "view_reports"
          },
          {
            view: "files",
            onClick: () => setActiveView('files'),
            icon: <ImageIcon className="h-4 w-4" />,
            label: "File Manager",
            permission: "view_files"
          },
          {
            view: "roles",
            onClick: () => setActiveView('roles'),
            icon: <KeyRound className="h-4 w-4" />,
            label: "Role Permissions",
            permission: "manage_roles"
          },
          {
            view: "members",
            onClick: () => setActiveView('members'),
            icon: <UserRound className="h-4 w-4" />,
            label: "Members",
            permission: "view_members"
          },
          {
            view: "settings",
            onClick: () => setActiveView('settings'),
            icon: <Settings className="h-4 w-4" />,
            label: "Settings",
            permission: "view_settings"
          },
          {
            view: "account",
            onClick: () => setActiveView('account'),
            icon: <User className="h-4 w-4" />,
            label: "My Account"
          }
        ].map((item, index) => (
          <AnimatedNavigationButton
            key={item.view}
            view={item.view}
            activeView={activeView}
            onClick={item.onClick}
            icon={item.icon}
            label={item.label}
            permission={item.permission}
            index={index}
          />
        ))}

        {/* Special admin-only buttons */}
        {hasPermission('manage_webhooks') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Separator className="my-4" />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowInternalOps(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Internal Operations
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowUpdatesLog(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Updates Log
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Theme toggle */}
        <motion.div 
          className="mt-auto pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Separator className="mb-4" />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleAppearanceToggle} 
              className="w-full" 
              variant="outline"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mr-2"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatedSidebar>

      {/* Main content with animated transitions */}
      <AnimatedContent>
        {/* Top banner */}
        <AdminBanner />
        
        {/* Content area */}
        <div className="p-8">
          {/* This is where you'd render your different views based on activeView */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-6">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h1>
            
            {/* Render actual view content based on active view */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Import and include all views from the original admin dashboard */}
                {(() => {
                  // This approach lets us dynamically render the appropriate component
                  // based on the active view while maintaining the original functionality
                  switch (activeView) {
                    case 'events':
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-medium mb-1">Manage your events</h2>
                              <p className="text-sm text-muted-foreground">
                                Create, edit, and manage all your tournaments and events.
                              </p>
                            </div>
                            <Button
                              onClick={() => setLocation('/admin/events/create')}
                              className="px-4 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Create Event
                            </Button>
                          </div>
                          
                          {/* Note: This is a placeholder - in the actual implementation 
                              you would use the original EventsTable component */}
                          <motion.div
                            className="rounded-md border p-5 bg-card"
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="text-center py-10">
                              <Calendar className="w-12 h-12 mx-auto text-primary mb-4" />
                              <h3 className="text-lg font-medium mb-2">Events Table</h3>
                              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Please click "Events" in the sidebar to see the full Events 
                                dashboard with all functionality.
                              </p>
                              <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => setLocation('/admin/events')}
                              >
                                Go to Full Events Dashboard
                              </Button>
                            </div>
                          </motion.div>
                        </div>
                      );
                    // Add other cases for different views as needed
                    default:
                      return (
                        <div className="flex flex-col items-center justify-center py-10">
                          <motion.div 
                            className="rounded-md border p-8 bg-card max-w-lg w-full text-center"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <h3 className="text-lg font-medium mb-2">Feature Coming Soon</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              This dashboard section is being enhanced with new animations and features.
                            </p>
                            <Button 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => setLocation('/admin')}
                            >
                              Return to Standard Dashboard
                            </Button>
                          </motion.div>
                        </div>
                      );
                  }
                })()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </AnimatedContent>
    </div>
  );
}