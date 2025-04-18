import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, User, Home, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

export function MemberSidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const { settings } = useOrganizationSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation links
  const navLinks = [
    {
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
    },
    {
      href: "/dashboard/my-household",
      icon: <Home className="h-5 w-5" />,
      label: "My Household",
    },
    {
      href: "/dashboard/my-account",
      icon: <User className="h-5 w-5" />,
      label: "My Account",
    },
    {
      href: "/dashboard/registrations",
      icon: <Calendar className="h-5 w-5" />,
      label: "My Registrations",
    },
    {
      href: "/product-updates",
      icon: <Bell className="h-5 w-5" />,
      label: "Product Updates",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // After logout is successful, redirect to login page
      window.location.href = "/?loggedOut=true";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Logo/header content for the sidebar
  const sidebarHeader = (
    <div className="flex items-center gap-2">
      <img
        src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
        alt={settings?.name || "MatchPro"}
        className="h-8"
      />
      {!isCollapsed && (
        <motion.span
          className="font-semibold text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Member
        </motion.span>
      )}
    </div>
  );

  return (
    <CollapsibleSidebar
      defaultCollapsed={false}
      headerContent={sidebarHeader}
      collapseBreakpoint="md"
      width="w-64"
      showToggleOnDesktop={true}
      togglePosition="right"
      sidebarStyles={{ 
        backgroundColor: "var(--background)",
        zIndex: 40
      }}
    >
      {/* Navigation Section */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scroll-container">
        <div className="space-y-1">
          {navLinks.map((link) => (
            <div key={link.href}>
              <Link 
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors touch-target",
                  location === link.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.icon}
                <span className="text-base">{link.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </CollapsibleSidebar>
  );
}