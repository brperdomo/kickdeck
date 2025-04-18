import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { MobileNavigation, MobileHeader, MobileBottomSheet } from "@/components/ui/mobile-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import {
  Home,
  User,
  Calendar,
  Bell,
  Settings,
  ChevronRight,
  FileText,
  Clock,
  MapPin,
  Building2,
  Shield,
  Users,
  Menu,
  LogOut,
  BarChart3,
  Grid3X3,
  Search
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface MobileAdminDashboardProps {
  toggleSidebar?: () => void;
}

export function MobileAdminDashboard({ toggleSidebar }: MobileAdminDashboardProps) {
  const { user, logout } = useUser();
  const { settings } = useOrganizationSettings();
  const { hasPermission } = usePermissions();
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Admin navigation items for quick access  
  const quickActions = [
    {
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      label: "Events",
      href: "/admin/events",
      permission: "view_events"
    },
    {
      icon: <Users className="h-6 w-6 text-emerald-500" />,
      label: "Teams",
      href: "/admin/teams",
      permission: "view_teams"
    },
    {
      icon: <Building2 className="h-6 w-6 text-purple-500" />,
      label: "Complexes",
      href: "/admin/complexes",
      permission: "view_complexes"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-500" />,
      label: "Reports",
      href: "/admin/reports",
      permission: "view_reports"
    }
  ];
  
  // Filter quick actions based on permissions
  const filteredQuickActions = quickActions.filter(
    action => hasPermission(action.permission as any)
  );
  
  // Bottom navigation items
  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: <Home className="h-6 w-6" />,
      exact: true
    },
    {
      href: "/admin/events",
      label: "Events",
      icon: <Calendar className="h-6 w-6" />,
      permission: "view_events"
    },
    {
      href: "/admin/teams",
      label: "Teams",
      icon: <Users className="h-6 w-6" />,
      permission: "view_teams"
    },
    {
      href: "#menu",
      label: "More",
      icon: <Grid3X3 className="h-6 w-6" />,
      onClick: () => setIsMenuOpen(true)
    }
  ];
  
  // Filter bottom nav items based on permissions
  const filteredNavItems = navItems.filter(
    item => !item.permission || hasPermission(item.permission as any)
  );
  
  // All admin menu items for the bottom sheet
  const allMenuItems = [
    {
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      label: "Administrators",
      href: "/admin/administrators",
      permission: "view_administrators"
    },
    {
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      label: "Events",
      href: "/admin/events",
      permission: "view_events"
    },
    {
      icon: <Users className="h-5 w-5 text-emerald-500" />,
      label: "Teams",
      href: "/admin/teams",
      permission: "view_teams"
    },
    {
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
      label: "Field Complexes",
      href: "/admin/complexes",
      permission: "view_complexes"
    },
    {
      icon: <Home className="h-5 w-5 text-indigo-500" />,
      label: "Member Dashboard",
      href: "/dashboard"
    },
    {
      icon: <Calendar className="h-5 w-5 text-orange-500" />,
      label: "Scheduling",
      href: "/admin/scheduling",
      permission: "view_scheduling"
    },
    {
      icon: <FileText className="h-5 w-5 text-teal-500" />,
      label: "Reports",
      href: "/admin/reports",
      permission: "view_reports"
    },
    {
      icon: <Bell className="h-5 w-5 text-pink-500" />,
      label: "Updates",
      href: "/product-updates"
    },
    {
      icon: <User className="h-5 w-5 text-gray-500" />,
      label: "My Account",
      href: "/admin/account"
    },
    {
      icon: <LogOut className="h-5 w-5 text-red-500" />,
      label: "Logout",
      onClick: async () => {
        await logout();
        navigate("/?loggedOut=true");
      }
    }
  ];
  
  // Filter all menu items based on permissions
  const filteredMenuItems = allMenuItems.filter(
    item => !item.permission || hasPermission(item.permission as any)
  );
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/?loggedOut=true");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <div className="pb-20"> {/* Add bottom padding for the mobile nav */}
      <MobileHeader
        title={settings?.name || "MatchPro Admin"}
        leftAction={toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        rightAction={
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        }
      />
      
      <div className="responsive-container">
        {/* Welcome Card */}
        <Card className="mb-6 overflow-hidden border-0 shadow-md">
          <div className="relative bg-primary pt-6 pb-6 px-6 text-white">
            <div className="relative z-10">
              <h1 className="text-xl font-bold mb-1">Welcome, {user?.firstName || "Admin"}!</h1>
              <p className="text-white/80 text-sm">
                MatchPro Admin Dashboard
              </p>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
          </div>
        </Card>
        
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search events, teams, or fields..."
            className="w-full pl-10 pr-4 py-3 touch-friendly-input rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {filteredQuickActions.map((action, i) => (
              <Link 
                key={i} 
                href={action.href}
                className="flex flex-col items-center justify-center p-3 bg-card rounded-lg border border-border shadow-sm text-center"
              >
                <div className="mb-2">{action.icon}</div>
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">Mobile Responsive Update</h3>
                  <p className="text-xs text-muted-foreground">
                    Mobile responsiveness has been implemented across the entire platform.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">New Team Registration</h3>
                  <p className="text-xs text-muted-foreground">
                    2 new teams registered for Spring Cup Series tournament.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-xs text-muted-foreground">Yesterday</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">New Field Complex Added</h3>
                  <p className="text-xs text-muted-foreground">
                    Metro Sports Center with 8 fields added to the database.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <MobileNavigation items={filteredNavItems} />
      
      {/* Full Menu Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu"
      >
        <div className="grid grid-cols-1 gap-2">
          {filteredMenuItems.map((item, index) => (
            <div key={index}>
              {item.href ? (
                <Link 
                  href={item.href}
                  className="flex items-center p-3 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto font-medium"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    setIsMenuOpen(false);
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      </MobileBottomSheet>
    </div>
  );
}