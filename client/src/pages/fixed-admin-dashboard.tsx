import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { 
  Calendar, Shield, Home, LogOut, FileText, AlertTriangle, User, UserRound,
  Settings, Users, ChevronRight, Building2, MessageSquare, Sparkles,
  Moon, Sun, CalendarDays, ImageIcon, FormInput, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import { AnimatedSidebar, AnimatedContent } from "@/components/admin/AnimatedSidebar";
import { AnimatedNavigationButton } from "@/components/admin/AnimatedNavigationButton";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBanner } from "@/components/admin/AdminBanner";

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
      <AnimatedSidebar>
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
            
            {/* You would render your actual content here based on activeView */}
            {/* For example: {renderView()} */}
          </motion.div>
        </div>
      </AnimatedContent>
    </div>
  );
}