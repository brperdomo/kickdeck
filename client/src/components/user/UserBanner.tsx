import { Link } from "wouter";
import { Home, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { ViewToggle } from "@/components/ViewToggle";
import { useUser } from "@/hooks/use-user";
import { motion } from "framer-motion";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";

/**
 * UserBanner component displays a navigation bar at the top of user dashboard pages
 * for consistent navigation and access to common functions
 */
export function UserBanner() {
  const { user } = useUser();
  const { settings } = useOrganizationSettings();
  
  // Ensure light mode is always applied
  useEffect(() => {
    // Always remove dark mode class
    document.documentElement.classList.remove('dark');
    
    // Always store light mode in localStorage
    localStorage.setItem('theme-appearance', 'light');
    
    // Silently update theme on the server to light mode
    setTimeout(() => {
      fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant: 'professional',
          primary: localStorage.getItem('theme-primary') || 'hsl(221.2 83.2% 53.3%)',
          appearance: 'light',
          radius: 0.5
        })
      }).catch(err => console.error('Background theme update failed:', err));
    }, 500);
  }, []);

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm p-4 border-b sticky top-0 z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              title="Home"
              asChild
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
          
          {/* Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <img 
              src={settings?.logoUrl || "/uploads/KickDeck_Linear_Black.png"}
              alt={settings?.name || "KickDeck"} 
              className="h-8 mr-2"
            />
            <motion.h2 
              className="text-xl font-semibold hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Member Dashboard
            </motion.h2>
          </motion.div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Button 
              variant="ghost" 
              asChild 
              className="rounded-full transition-all duration-200 px-4"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              asChild 
              className="rounded-full transition-all duration-200 px-4"
            >
              <Link href="/dashboard/my-household">
                <User className="mr-2 h-4 w-4" />
                My Household
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle Button - only shown for admin users who have both roles */}
          {user?.isAdmin && (
            <ViewToggle />
          )}
          
          <Button 
            variant="ghost" 
            asChild 
            className="rounded-full transition-all duration-200 px-4"
          >
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}