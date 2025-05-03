import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  Calendar, 
  Shield, 
  Users, 
  Settings, 
  Home, 
  User, 
  Building2, 
  CalendarDays, 
  FileText, 
  ImageIcon,
  FormInput,
  KeyRound,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNavigationBar } from "@/components/admin/AdminNavigationBar";

// Define view types
type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling' | 'files' | 'formTemplates' | 'roles' | 'members';

interface AdminDashboardProps {
  initialView?: string;
}

/**
 * Simplified Admin Dashboard component
 * This version eliminates the complex JSX structure that was causing errors
 */
export default function AdminDashboard({ initialView = 'events' }: AdminDashboardProps) {
  // Use the initialView prop as the initial state
  const [activeView, setActiveView] = useState<View>(initialView as View);
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useUser();
  const [theme, setTheme] = useState(() => {
    // Default to 'dark' theme or get from localStorage if available
    return localStorage.getItem('theme') || 'dark';
  });

  // Only admin users should access this page
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/login');
  };

  // Force show emergency mode for admin users
  const showEmergencyMode = user?.isAdmin || [
    'bperdomo@zoho.com', 
    'jesus.desantiagojr@gmail.com', 
    'bryan@matchpro.ai'
  ].includes(user?.email || '');

  const renderPlaceholder = () => (
    <div className="p-6 bg-white shadow-sm rounded-md">
      <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
      <p className="mb-2">Welcome to the administrator dashboard!</p>
      {showEmergencyMode && (
        <div className="p-3 mb-3 bg-red-100 text-red-800 rounded-md border border-red-300">
          🚨 <strong>Emergency Admin Mode Active</strong>
          <p className="text-sm mt-1">Admin permissions bypass is enabled for this session.</p>
        </div>
      )}
      <p>Select a section from the sidebar to manage your organization.</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <AdminNavigationBar 
            activeView={activeView}
            onNavigate={(path) => {
              const viewName = path.split('/').pop() as View;
              setActiveView(viewName);
              navigate(path);
            }}
          />
        </div>
        
        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleThemeToggle}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </h2>
          <div className="flex items-center space-x-2">
            {user && (
              <span className="text-sm">{user.firstName} {user.lastName}</span>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6">
          {renderPlaceholder()}
        </div>
      </div>
    </div>
  );
}