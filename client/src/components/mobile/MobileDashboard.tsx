import React from "react";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { MobileNavigation, MobileHeader } from "@/components/ui/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
  MessageSquare,
  Bookmark,
  ShieldCheck,
  FileSpreadsheet,
  Mail,
  Menu
} from "lucide-react";

interface MobileDashboardProps {
  toggleSidebar?: () => void;
}

export function MobileDashboard({ toggleSidebar }: MobileDashboardProps) {
  const { user } = useUser();
  const { settings } = useOrganizationSettings();
  
  // Quick Action Items
  const quickActions = [
    {
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      label: "Events",
      href: "/dashboard/events"
    },
    {
      icon: <FileText className="h-6 w-6 text-emerald-500" />,
      label: "Forms",
      href: "/dashboard/forms"
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-purple-500" />,
      label: "Teams",
      href: "/dashboard/teams"
    },
    {
      icon: <MapPin className="h-6 w-6 text-red-500" />,
      label: "Fields",
      href: "/dashboard/fields"
    }
  ];
  
  // Navigation items for the bottom bar
  const navItems = [
    {
      href: "/dashboard",
      label: "Home",
      icon: <Home className="h-6 w-6" />,
      exact: true
    },
    {
      href: "/dashboard/registrations",
      label: "Registrations",
      icon: <Calendar className="h-6 w-6" />
    },
    {
      href: "/dashboard/my-account",
      label: "Account",
      icon: <User className="h-6 w-6" />
    },
    // Only show Updates tab for admin users
    ...(user?.isAdmin ? [{
      href: "/product-updates",
      label: "Updates",
      icon: <Bell className="h-6 w-6" />
    }] : [])
  ];
  
  return (
    <div className="pb-20"> {/* Add bottom padding for the mobile nav */}
      <MobileHeader
        title={settings?.name || "KickDeck"}
        leftAction={toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        rightAction={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/my-account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        }
      />
      
      <div className="responsive-container">
        {/* Welcome Card */}
        <Card className="mb-6 overflow-hidden border-0 shadow-md">
          <div className="relative bg-primary pt-6 pb-6 px-6 text-white">
            <div className="relative z-10">
              <h1 className="text-xl font-bold mb-1">Welcome, {user?.firstName || "User"}!</h1>
              <p className="text-white/80 text-sm">
                Here's your KickDeck dashboard
              </p>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
          </div>
        </Card>
        
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
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
        
        {/* Upcoming Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/events">
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">Winter Tournament 2025</h3>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">Apr 20-25, 2025</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">Upcoming</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-md flex items-center justify-center mr-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">Spring Cup Series</h3>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">May 15-18, 2025</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">Registration Open</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Latest Updates Section - only visible to admins */}
        {user?.isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Latest Updates</h2>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/product-updates">
                  All Updates
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-muted-foreground">April 15, 2025</span>
                    </div>
                    <h3 className="text-sm font-medium mb-1">Mobile Responsive Update</h3>
                    <p className="text-xs text-muted-foreground">
                      KickDeck is now optimized for mobile devices! Access all features on your phone or tablet with improved layouts.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-muted-foreground">April 10, 2025</span>
                    </div>
                    <h3 className="text-sm font-medium mb-1">Tournament Scheduling Improvements</h3>
                    <p className="text-xs text-muted-foreground">
                      New features for tournament directors to manage scheduling more efficiently.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Mobile Navigation Bar */}
      <MobileNavigation items={navItems} />
    </div>
  );
}