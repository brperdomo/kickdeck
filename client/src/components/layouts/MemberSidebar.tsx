import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, User, Home, Calendar, Bell, UserPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      icon: <UserPlus className="h-5 w-5" />,
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
      href: "/dashboard/account-settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
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
    <div className="flex items-center gap-2 px-2">
      <img
        src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
        alt={settings?.name || "MatchPro"}
        className="h-8"
      />
      {!isCollapsed && (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="font-semibold text-lg text-primary">Member</span>
          <span className="text-xs text-muted-foreground">Portal</span>
        </motion.div>
      )}
    </div>
  );

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return "M";
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  return (
    <CollapsibleSidebar
      defaultCollapsed={false}
      headerContent={sidebarHeader}
      collapseBreakpoint="md"
      width="w-64"
      showToggleOnDesktop={true}
      togglePosition="right"
      sidebarStyles={{ 
        background: "var(--card)",
        boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)",
        zIndex: 40
      }}
      className="member-sidebar border-r"
    >
      {/* Navigation Section */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scroll-container">
        <div className="space-y-1">
          {navLinks.map((link) => (
            <div key={link.href}>
              <Link 
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-all touch-target",
                  location === link.href
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.icon}
                </motion.div>
                <span className="text-base">{link.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border/30 bg-card/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive touch-target transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </CollapsibleSidebar>
  );
}