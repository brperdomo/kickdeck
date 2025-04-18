import { ReactNode } from "react";
import { MemberSidebar } from "./MemberSidebar";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";

interface MemberLayoutProps {
  children: ReactNode;
  mobileDashboard?: boolean; // Flag to force mobile dashboard
}

export function MemberLayout({ children, mobileDashboard = false }: MemberLayoutProps) {
  const { isMobile } = useBreakpoint();
  
  // Check if we should use mobile layout
  const useMobileDashboard = mobileDashboard || isMobile;
  
  // For the main dashboard view, we'll use a completely mobile-optimized version on small devices
  const isMemberDashboard = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
  
  // If it's the main dashboard page and we're on mobile, use the dedicated mobile layout
  if (useMobileDashboard && isMemberDashboard) {
    return <MobileDashboard />;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - only visible on desktop */}
      <MemberSidebar />

      {/* Main Content */}
      <motion.main 
        className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
    </div>
  );
}