import { Link } from "wouter";
import { Home, User, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ViewToggle } from "@/components/ViewToggle";
import { useUser } from "@/hooks/use-user";

/**
 * UserBanner component displays a navigation bar at the top of user dashboard pages
 * for consistent navigation and access to common functions
 */
export function UserBanner() {
  const { user } = useUser();
  // Using local state for dark mode preference
  const [isDarkMode, setIsDarkMode] = useState(
    typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  
  // Toggle function that only updates the DOM and localStorage
  const toggleDarkMode = (e: React.MouseEvent) => {
    // Prevent default button behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle the state
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Update the document class directly
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update localStorage for persistence
    localStorage.setItem('theme-appearance', newMode ? 'dark' : 'light');
    
    // Silently update theme on the server
    setTimeout(() => {
      fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant: 'professional',
          primary: localStorage.getItem('theme-primary') || 'hsl(221.2 83.2% 53.3%)',
          appearance: newMode ? 'dark' : 'light',
          radius: 0.5
        })
      }).catch(err => console.error('Background theme update failed:', err));
    }, 500);
  };

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-800 dark:from-gray-900 dark:to-gray-950 text-white p-3 sticky top-0 z-10 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 rounded-full transition-all duration-200 px-4"
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 rounded-full transition-all duration-200 px-4"
          >
            <Link href="/household">
              <User className="mr-2 h-4 w-4" />
              My Household
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle Button - only shown for admin users who have both roles */}
          {user?.isAdmin && (
            <ViewToggle currentView="member" />
          )}

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