import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, User, Home, Calendar, Bell, UserPlus, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { usePermissions } from "@/hooks/use-permissions";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Animation variants for nav items — Phase 2: dramatic neon overhaul
const navItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    filter: "blur(8px)"
  },
  visible: (index = 0) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.1 + (index * 0.05),
      duration: 0.5,
      type: "spring",
      stiffness: 180,
      damping: 12
    }
  }),
  hover: {
    x: 8,
    transition: {
      duration: 0.25,
      type: "spring",
      stiffness: 500,
      damping: 12
    }
  },
  tap: {
    scale: 0.92,
    transition: {
      duration: 0.06
    }
  }
};

// Shine effect for active nav items
const shineVariants = {
  initial: {
    x: "-120%",
    opacity: 0.05,
    skewX: "-20deg"
  },
  animate: {
    x: "120%",
    opacity: 0.15,
    skewX: "-20deg",
    transition: {
      duration: 1.8,
      ease: "easeInOut"
    }
  }
};

// Pulse animation for active indicator dot
const pulseVariants = {
  initial: {
    scale: 1,
    opacity: 0.8
  },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const
    }
  }
};

export function MemberSidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const { settings } = useOrganizationSettings();
  const { hasPermission } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = user?.isAdmin;

  // Navigation links
  const navLinks = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      href: "/dashboard/my-household",
      icon: <UserPlus className="h-4 w-4" />,
      label: "My Household",
    },
    {
      href: "/dashboard/registrations",
      icon: <Calendar className="h-4 w-4" />,
      label: "My Registrations",
    },
    {
      href: "/dashboard/my-account",
      icon: <Settings className="h-4 w-4" />,
      label: "Account Settings",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/?loggedOut=true";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return "M";
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  // Logo/header content for the sidebar
  const sidebarHeader = (
    <div className="flex flex-col items-center px-2 w-full relative">
      {/* Header backdrop glow */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-violet-600/5 blur-xl rounded-full pointer-events-none"></div>

      <div className="w-full flex justify-center mb-2 relative">
        <img
          src={settings?.logoUrl || "/uploads/KickDeck_Linear_White.png"}
          alt={settings?.name || "KickDeck"}
          className="w-full max-h-10 object-contain"
          style={{ filter: 'drop-shadow(0 0 15px rgba(124, 58, 237, 0.2))' }}
        />
      </div>
      {!isCollapsed && (
        <motion.div
          className="flex flex-col items-center mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center">
            <span className="font-semibold text-lg bg-gradient-to-r from-violet-300 via-purple-200 to-violet-300 bg-clip-text text-transparent">
              Member
            </span>
            <span className="font-medium text-lg text-gray-400 ml-1">Portal</span>
          </div>
          {/* Subtle underline */}
          <motion.div
            className="h-[1px] w-20 mt-1 bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        </motion.div>
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
        background: "linear-gradient(180deg, rgba(9, 9, 26, 0.98) 0%, rgba(16, 12, 42, 0.98) 50%, rgba(20, 16, 52, 0.96) 100%)",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(124, 58, 237, 0.05)",
        borderRight: "1px solid rgba(124, 58, 237, 0.15)",
        zIndex: 40,
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
      className="member-sidebar text-white"
    >
      {/* Neon edge glow */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-violet-500/0 via-cyan-500/20 to-violet-500/0 pointer-events-none" />

      {/* Ambient glow elements */}
      <div className="absolute top-10 right-0 w-full h-32 bg-violet-600/4 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-20 right-0 w-full h-32 bg-purple-600/4 blur-[80px] rounded-full pointer-events-none"></div>

      {/* Navigation Section */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scroll-container relative">
        <div className="space-y-1">
          {navLinks.map((link, index) => {
            const isActive = location === link.href;

            return (
              <motion.div
                key={link.href}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                className="w-full"
              >
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 transition-all touch-target relative overflow-hidden group",
                    isActive ? "font-medium" : ""
                  )}
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(124, 58, 237, 0.15)'
                      : 'transparent',
                    color: isActive
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.7)',
                    boxShadow: isActive
                      ? '0 0 20px rgba(124, 58, 237, 0.15)'
                      : 'none',
                    borderRadius: '0.375rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124, 58, 237, 0.12)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 25px rgba(124, 58, 237, 0.2), inset 0 0 15px rgba(124, 58, 237, 0.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124, 58, 237, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }
                  }}
                  onClick={(e) => {
                    // Trigger neon flash animation on click
                    const el = e.currentTarget as HTMLElement;
                    el.classList.add('neon-click-flash');
                    setTimeout(() => el.classList.remove('neon-click-flash'), 400);
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <>
                      <motion.div
                        className="absolute left-0 top-[15%] bottom-[15%] w-1.5 rounded-full shadow-lg shadow-violet-500/40"
                        style={{ background: 'linear-gradient(to bottom, #7c3aed, #a855f7)' }}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                      <motion.div
                        className="absolute left-0 top-[12%] w-3 h-3 rounded-full shadow-lg shadow-violet-500/50 -translate-x-1"
                        initial="initial"
                        animate="pulse"
                        variants={pulseVariants}
                        style={{
                          filter: "blur(1px)",
                          background: "radial-gradient(circle, rgba(167,139,250,1) 0%, rgba(124,58,237,1) 100%)"
                        }}
                      />
                      {/* Background glow */}
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-violet-600/0 via-violet-600/30 to-violet-600/0 rounded-md" />
                    </>
                  )}

                  {/* Icon wrapper with neon styling */}
                  <motion.div
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md relative flex-shrink-0",
                      isActive
                        ? "bg-gradient-to-br from-violet-600/90 to-purple-800/90 shadow-lg shadow-violet-900/20"
                        : "bg-gray-800/70 border border-gray-700/50"
                    )}
                    whileHover={{
                      scale: 1.18,
                      rotate: 12,
                      boxShadow: '0 0 16px rgba(6, 182, 212, 0.4), 0 0 30px rgba(124, 58, 237, 0.2)'
                    }}
                    animate={{
                      rotate: isActive ? [0, 6, 0] : 0
                    }}
                    transition={{
                      duration: 0.35,
                      type: "spring",
                      stiffness: 300,
                      damping: 10
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-md bg-violet-500/20 filter blur-sm" />
                    )}
                    <motion.div
                      animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="z-10 flex items-center justify-center w-full h-full"
                    >
                      {link.icon}
                    </motion.div>
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    className={cn(
                      "text-base transition-all duration-200",
                      isActive
                        ? "text-white font-medium tracking-wide"
                        : "text-gray-400 group-hover:text-gray-200"
                    )}
                    animate={{
                      y: isActive ? [2, 0] : 0,
                      opacity: isActive ? [0.5, 1] : 1
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {link.label}
                  </motion.span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-violet-500/10 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-violet-500/30">
            <AvatarFallback className="bg-violet-600/20 text-violet-300">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        {hasAdminAccess && (
          <>
            <Button
              variant="outline"
              className="w-full justify-start mb-2 touch-target transition-all duration-300 border-violet-500/20 text-violet-300 hover:bg-violet-600/15 hover:text-violet-200 hover:border-violet-500/30"
              onClick={() => window.location.href = "/admin"}
            >
              <Shield className="mr-2 h-4 w-4" />
              Go to Admin Dashboard
            </Button>
            <Separator className="my-2 bg-violet-500/10" />
          </>
        )}
        <Button
          variant="outline"
          className="w-full justify-start text-red-400 border-red-500/20 hover:text-red-300 hover:bg-red-600/15 hover:border-red-500/30 touch-target transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </CollapsibleSidebar>
  );
}
