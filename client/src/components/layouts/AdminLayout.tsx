import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from 'wouter';
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/use-mobile";

// Add CSS to use admin dashboard variables
const sidebarStyles = {
  background: 'var(--admin-nav-bg, #FFFFFF)',
  color: 'var(--admin-nav-text, #000000)',
};

const sidebarItemStyles = {
  "&:hover": {
    backgroundColor: 'var(--admin-nav-hover, #f3f4f6)',
  },
  "&.active": {
    backgroundColor: 'var(--admin-nav-active, #164e87)',
    color: '#FFFFFF',
  }
};

interface StyleSettings {
    adminNavBackground: string;
    adminNavText: string;
    adminNavHover: string;
    adminNavActive: string;
}

function StyleSettingsView() {
    const [styles, setStyles] = useState<StyleSettings>({
        adminNavBackground: '#FFFFFF',
        adminNavText: '#000000',
        adminNavHover: '#f3f4f6',
        adminNavActive: '#164e87',
        // Add other styles here...
    });

    const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStyles(prevStyles => ({ ...prevStyles, [name]: value }));
    };

    return (
        <div>
            {/* Style settings inputs */}
            <label>
                Admin Nav Background:
                <input type="color" name="adminNavBackground" value={styles.adminNavBackground} onChange={handleStyleChange} />
            </label>
            <label>
                Admin Nav Text:
                <input type="color" name="adminNavText" value={styles.adminNavText} onChange={handleStyleChange} />
            </label>
            <label>
                Admin Nav Hover:
                <input type="color" name="adminNavHover" value={styles.adminNavHover} onChange={handleStyleChange} />
            </label>
            <label>
                Admin Nav Active:
                <input type="color" name="adminNavActive" value={styles.adminNavActive} onChange={handleStyleChange} />
            </label>
            {/* Add other style settings inputs as needed */}
        </div>
    );
}

// Type definitions for AdminLayout props
interface AdminLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  styles?: {
    adminNavBackground?: string;
    adminNavText?: string;
    adminNavHover?: string;
    adminNavActive?: string;
  };
}

export function AdminLayout({ children, sidebar, styles = {} }: AdminLayoutProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  // Close sidebar when changing routes on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  // Check if we're on the main admin dashboard page
  const isMainAdminDashboard = location === "/admin" || location === "/admin/";
  
  // If it's the main admin dashboard and we're on mobile, use the dedicated mobile layout
  if (isMobile && isMainAdminDashboard) {
    // We'll disable this for now to fix loading issues
    /*
    const MobileAdminDashboard = React.lazy(() => 
      import('@/components/mobile/MobileAdminDashboard')
        .then(mod => ({ default: mod.MobileAdminDashboard }))
    );
    
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      }>
        <MobileAdminDashboard toggleSidebar={() => setIsSidebarOpen(true)} />
      </React.Suspense>
    );
    */
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: styles?.adminNavBackground || '#FFFFFF'}}> 
      {/* Mobile Header */}
      {(isMobile || isTablet) && (
        <div className="flex items-center justify-between px-4 py-3 border-b shadow-sm" style={{ backgroundColor: styles?.adminNavBackground || '#FFFFFF' }}>
          <div className="text-lg font-semibold">Admin Dashboard</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="touch-target"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      )}
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Desktop Sidebar - Always visible on desktop */}
        {!isMobile && !isTablet && (
          <div className="w-64 border-r shrink-0 h-full" style={sidebarStyles}>
            {sidebar}
          </div>
        )}
        
        {/* Mobile Sidebar - Conditionally visible */}
        <AnimatePresence>
          {(isMobile || isTablet) && isSidebarOpen && (
            <>
              {/* Backdrop for mobile sidebar */}
              <motion.div 
                className="fixed inset-0 bg-black/50 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
              />
              
              {/* Mobile sliding sidebar */}
              <motion.div 
                className="fixed top-0 left-0 z-40 h-full w-64 shadow-xl"
                style={sidebarStyles}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="font-semibold">Menu</div>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                    <X size={20} />
                  </Button>
                </div>
                {sidebar}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto scroll-container">
          {/* On mobile, add padding to the content */}
          <div className={isMobile || isTablet ? "p-4" : ""}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  children: React.ReactNode;
  styles?: {
    adminNavBackground?: string;
    adminNavText?: string;
    adminNavHover?: string;
    adminNavActive?: string;
  };
}

export function AdminSidebar({ children, styles = {} }: AdminSidebarProps) {
  return (
    <div className="h-full p-4 overflow-y-auto scroll-container" style={{ ...sidebarStyles, backgroundColor: styles?.adminNavBackground || '#FFFFFF' }}> 
      {children}
    </div>
  );
}

interface SidebarItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminSidebarItemProps {
  activePath: string;
  item: SidebarItem;
  styles?: {
    adminNavBackground?: string;
    adminNavText?: string;
    adminNavHover?: string;
    adminNavActive?: string;
  };
  [key: string]: any;
}

export function AdminSidebarItem({ activePath, item, styles = {}, ...props }: AdminSidebarItemProps) {
  const { isMobile } = useBreakpoint();
  
  return (
    <Link
      href={item.path}
      key={item.path}
      className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-colors touch-target`}
      style={{
        backgroundColor: activePath === item.path ? (styles?.adminNavActive || '#E6F7FF') : 'transparent',
        color: activePath === item.path ? (styles?.adminNavText || '#000000') : (styles?.adminNavText || '#666666'),
        fontWeight: activePath === item.path ? 'medium' : 'normal',
      }}
      onMouseOver={(e) => {
        if (activePath !== item.path) {
          e.currentTarget.style.backgroundColor = styles?.adminNavHover || '#f3f4f6';
        }
      }}
      onMouseOut={(e) => {
        if (activePath !== item.path) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      {...props}
    >
      {item.icon && <span className="mr-2">{item.icon}</span>}
      <span className={isMobile ? "text-base" : ""}>{item.label}</span>
    </Link>
  );
}

export { StyleSettingsView };