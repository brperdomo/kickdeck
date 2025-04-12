import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, User, Home, ChevronDown, Calendar, CreditCard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function MemberSidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const { settings } = useOrganizationSettings();
  const [collapsed, setCollapsed] = useState(false);

  // Mobile sidebar toggle
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

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
  ];

  const sidebarVariants = {
    expanded: {
      width: "16rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      width: "5rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Mobile sidebar variants
  const mobileSidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const handleLogout = async () => {
    try {
      await logout();
      // After logout is successful, redirect to login page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-primary/10 rounded-full"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.div
        className="md:hidden fixed inset-y-0 left-0 bg-card/95 backdrop-blur-sm w-64 z-50 shadow-xl flex flex-col"
        variants={mobileSidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center">
            <img
              src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
              alt={settings?.name || "MatchPro"}
              className="h-8 mr-2"
            />
            <h2 className="text-xl font-semibold">Member</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link href={link.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      location === link.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile Section for Mobile */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:flex flex-col border-r bg-card/95 backdrop-blur-sm h-screen sticky top-0 shadow-sm"
        variants={sidebarVariants}
        initial="expanded"
        animate={collapsed ? "collapsed" : "expanded"}
      >
        {/* Logo Section */}
        <div className="p-4 border-b flex items-center justify-center">
          <Link href="/dashboard">
            <a className="flex items-center gap-2">
              <img
                src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
                alt={settings?.name || "MatchPro"}
                className="h-10"
              />
              {!collapsed && (
                <motion.span
                  className="font-semibold text-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Member
                </motion.span>
              )}
            </a>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <motion.div className="space-y-1">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link href={link.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      location === link.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {link.icon}
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </a>
                </Link>
              </div>
            ))}
          </motion.div>
        </nav>

        {/* User Profile Section */}
        {!collapsed ? (
          <div className="p-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="p-2 border-t flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <div className="p-2 border-t flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full h-8 w-8"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4 rotate-270" />
            ) : (
              <ChevronDown className="h-4 w-4 -rotate-90" />
            )}
          </Button>
        </div>
      </motion.div>
    </>
  );
}