import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { 
  Calendar, Home, Settings, Users, Building2,
  Moon, Sun, CalendarDays, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { AnimatedSidebar } from "@/components/admin/AnimatedSidebar";
import { AnimatedContent } from "@/components/ui/animation";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

/**
 * Special version of the admin dashboard for direct access
 * This version doesn't rely on authentication checks and is only 
 * accessible from the dev bypass route
 */
function AdminDirectDashboard() {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState('events');
  const { setAppearance, currentAppearance } = useTheme();
  const [theme, setTheme] = useState(currentAppearance);
  
  // State for tracking the authentication status
  const [authStatus, setAuthStatus] = useState({
    checked: false,
    isAuthenticated: false,
    adminEmail: '',
    isAdmin: false
  });
  
  // Attempt to fetch admin status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status for direct dashboard...');
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.log('Direct dashboard: Not authenticated (status code: ' + response.status + ')');
          setAuthStatus({
            checked: true,
            isAuthenticated: false,
            adminEmail: '',
            isAdmin: false
          });
          return;
        }
        
        const data = await response.json();
        
        if (!data || !data.isAdmin) {
          console.log('Direct dashboard: Authenticated but not as admin, showing anyway');
          setAuthStatus({
            checked: true,
            isAuthenticated: true,
            adminEmail: data?.email || '',
            isAdmin: false
          });
        } else {
          console.log('Direct dashboard: Authenticated as admin', data.email);
          setAuthStatus({
            checked: true,
            isAuthenticated: true,
            adminEmail: data.email,
            isAdmin: true
          });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus(prev => ({
          ...prev,
          checked: true
        }));
      }
    };
    
    checkAuthStatus();
  }, []);

  // Handle appearance toggle
  const handleAppearanceToggle = async () => {
    const newAppearance = currentAppearance === 'dark' ? 'light' : 'dark';
    await setAppearance(newAppearance);
    setTheme(newAppearance);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Animated Sidebar */}
      <AnimatedSidebar title="Admin Dashboard (Direct)" icon={<Calendar className="h-5 w-5 text-primary" />}>
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant={activeView === 'events' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('events')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Events
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant={activeView === 'teams' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('teams')}
          >
            <Users className="mr-2 h-4 w-4" />
            Teams
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant={activeView === 'complexes' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('complexes')}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Field Complexes
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant={activeView === 'scheduling' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('scheduling')}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Scheduling
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant={activeView === 'households' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('households')}
          >
            <Home className="mr-2 h-4 w-4" />
            Households
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant={activeView === 'settings' ? 'default' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveView('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </motion.div>

        {/* Theme toggle and logout */}
        <motion.div 
          className="mt-auto pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Separator className="mb-4" />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="mb-2"
          >
            <Button 
              onClick={handleAppearanceToggle} 
              className="w-full" 
              variant="outline"
            >
              {theme === 'dark' ? 
                <Sun className="mr-2 h-4 w-4" /> : 
                <Moon className="mr-2 h-4 w-4" />
              }
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleLogout} 
              className="w-full" 
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </motion.div>
      </AnimatedSidebar>

      {/* Main content */}
      <AnimatedContent>
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-6 flex items-center">
              <span className="mr-3">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</span>
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Development Mode</span>
            </h1>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium mb-1">Admin Dashboard (Direct Access)</h2>
                  <p className="text-sm text-muted-foreground">
                    This is a special version of the admin dashboard for development purposes.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setLocation('/admin/events/create')}
                    className="px-4 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Create Event
                  </Button>
                  
                  <Button
                    onClick={() => setLocation('/admin')} 
                    variant="outline"
                    className="px-4"
                  >
                    Go to Standard Admin
                  </Button>
                </div>
              </div>
              
              <motion.div
                className="rounded-md border p-6 bg-card"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
                  <h3 className="text-lg font-medium mb-2">Development Mode Notice</h3>
                  <p>
                    You are viewing the admin dashboard in development mode through the direct access route.
                    This bypasses regular authentication checks for testing purposes.
                  </p>
                  {authStatus.checked && (
                    <div className="mt-2 p-2 bg-white/50 rounded border border-yellow-100">
                      <h4 className="font-medium">Session Status:</h4>
                      <ul className="mt-1 text-sm">
                        <li>
                          <strong>Authentication:</strong> {authStatus.isAuthenticated 
                            ? <span className="text-green-600">Authenticated</span> 
                            : <span className="text-red-600">Not Authenticated</span>}
                        </li>
                        {authStatus.isAuthenticated && (
                          <>
                            <li><strong>Email:</strong> {authStatus.adminEmail}</li>
                            <li>
                              <strong>Admin Status:</strong> {authStatus.isAdmin 
                                ? <span className="text-green-600">Admin</span> 
                                : <span className="text-orange-500">Not Admin</span>}
                            </li>
                          </>
                        )}
                      </ul>
                      {!authStatus.isAuthenticated && (
                        <div className="mt-2">
                          <Button size="sm" onClick={() => window.location.href = "/dev-auth"}>
                            Go to Dev Auth
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-medium mb-3">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Events', path: '/admin/events', icon: <Calendar className="h-5 w-5" /> },
                    { name: 'Teams', path: '/admin/teams', icon: <Users className="h-5 w-5" /> },
                    { name: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
                    { name: 'Field Complexes', path: '/admin/complexes', icon: <Building2 className="h-5 w-5" /> },
                    { name: 'Scheduling', path: '/admin/scheduling', icon: <CalendarDays className="h-5 w-5" /> },
                    { name: 'Households', path: '/admin/households', icon: <Home className="h-5 w-5" /> },
                  ].map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      className="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setLocation(item.path)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 text-primary">{item.icon}</div>
                        <div>{item.name}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedContent>
    </div>
  );
}

export default AdminDirectDashboard;