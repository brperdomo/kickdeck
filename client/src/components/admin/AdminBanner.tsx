import { Link } from "wouter";
import { Home, Settings, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";

/**
 * AdminBanner component displays a navigation bar at the top of admin pages
 * for consistent navigation and access to common admin functions
 */
export function AdminBanner() {
  const { updateTheme, currentAppearance } = useTheme();
  
  // Using the current appearance from the theme hook instead of local state
  // This ensures we always show the correct icon without a hard refresh
  const isDarkMode = currentAppearance === 'dark';
  
  // Toggle between light and dark mode without causing a page reload
  const toggleDarkMode = () => {
    // Simply call updateTheme with the new appearance
    // The theme hook will handle updating localStorage and document classes
    updateTheme({ 
      appearance: isDarkMode ? 'light' : 'dark' 
    }).catch(err => {
      console.error('Failed to update theme:', err);
    });
  };

  return (
    <div className="bg-gradient-to-r from-primary-700 to-primary-900 dark:from-gray-900 dark:to-gray-950 text-white p-3 sticky top-0 z-10 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 rounded-full transition-all duration-200 px-4"
          >
            <Link href="/admin">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 rounded-full transition-all duration-200 px-4"
          >
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full w-9 h-9 p-0 text-white hover:bg-white/10"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 rounded-full transition-all duration-200 px-4"
          >
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}