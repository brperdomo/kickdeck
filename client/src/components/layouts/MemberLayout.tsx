import { ReactNode, useEffect } from "react";
import { MemberTopNav } from "./MemberTopNav";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useUser } from "@/hooks/use-user";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";

interface MemberLayoutProps {
  children: ReactNode;
  mobileDashboard?: boolean; // Flag to force mobile dashboard
}

// Helper to update the member styles with dark neon theme
export function updateMemberStyles() {
  const styleElement = document.getElementById('member-dashboard-styles') || (() => {
    const el = document.createElement('style');
    el.id = 'member-dashboard-styles';
    document.head.appendChild(el);
    return el;
  })();

  styleElement.innerHTML = `
    .member-dashboard.dashboard-dark {
      background-color: #0f0f1a;
      background-image:
        repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 3px),
        linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px),
        linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%) !important;
      background-size: 100% 3px, 60px 60px, 60px 60px, 100% 100% !important;
      background-attachment: fixed !important;
    }

    .member-content {
      background-color: transparent;
    }

    .member-card-header {
      background: linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.03));
      border-bottom: 1px solid rgba(124, 58, 237, 0.15);
    }

    .section-header {
      position: relative;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
    }

    .section-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      border-radius: 3px;
    }
  `;
}

export function MemberLayout({ children, mobileDashboard = false }: MemberLayoutProps) {
  const { isMobile } = useBreakpoint();
  const { user, logout } = useUser();
  const { settings } = useOrganizationSettings();

  // Apply the member dashboard styles and body class for portalled elements
  useEffect(() => {
    updateMemberStyles();
    document.body.classList.add('dashboard-dark-active');

    return () => {
      const styleElement = document.getElementById('member-dashboard-styles');
      if (styleElement) {
        styleElement.textContent = '';
      }
      document.body.classList.remove('dashboard-dark-active');
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/?loggedOut=true";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background member-dashboard dashboard-dark">
      {/* Top Navigation */}
      <MemberTopNav
        user={user}
        logoUrl={settings?.logoUrl}
        hasAdminAccess={user?.isAdmin}
        onLogout={handleLogout}
      />

      {/* Main Content — full-width, no sidebar */}
      <motion.main
        className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-6xl mx-auto w-full member-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Neon floor grid effect */}
      <div className="neon-floor-grid" aria-hidden="true" />
    </div>
  );
}
