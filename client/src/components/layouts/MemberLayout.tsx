import { ReactNode, useEffect } from "react";
import { MemberSidebar } from "./MemberSidebar";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";

interface MemberLayoutProps {
  children: ReactNode;
  mobileDashboard?: boolean; // Flag to force mobile dashboard
}

// Helper to update the member styles
export function updateMemberStyles() {
  const styleElement = document.getElementById('member-dashboard-styles') || (() => {
    const el = document.createElement('style');
    el.id = 'member-dashboard-styles';
    document.head.appendChild(el);
    return el;
  })();

  // Get primary color variables from the theme
  const styles = getComputedStyle(document.documentElement);
  const primaryColor = styles.getPropertyValue('--primary').trim();
  const backgroundColor = styles.getPropertyValue('--background').trim();
  const cardColor = styles.getPropertyValue('--card').trim();

  styleElement.innerHTML = `
    .member-dashboard {
      background: linear-gradient(180deg, ${backgroundColor} 0%, ${backgroundColor} 100%);
    }
    
    .member-sidebar {
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .member-content {
      background-color: ${backgroundColor};
    }
    
    .member-card {
      background: linear-gradient(to bottom right, ${cardColor} 0%, ${cardColor} 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .member-card:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .member-card-header {
      background: linear-gradient(to right, ${primaryColor}20, ${primaryColor}05);
      border-bottom: 1px solid ${primaryColor}20;
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
      background: ${primaryColor};
      border-radius: 3px;
    }
  `;
}

export function MemberLayout({ children, mobileDashboard = false }: MemberLayoutProps) {
  const { isMobile } = useBreakpoint();
  
  // Apply the member dashboard styles when component mounts
  useEffect(() => {
    updateMemberStyles();
    return () => {
      // Cleanup if needed
      const styleElement = document.getElementById('member-dashboard-styles');
      if (styleElement) {
        styleElement.textContent = '';
      }
    };
  }, []);
  
  // Check if we should use mobile layout
  const useMobileDashboard = mobileDashboard || isMobile;
  
  // For the main dashboard view, we'll use the same layout for both mobile and desktop
  // We're removing the conditional that used a completely different mobile layout
  // The standard dashboard will be used for all devices with responsive styling
  
  return (
    <div className="flex min-h-screen bg-background member-dashboard">
      {/* Sidebar - only visible on desktop */}
      <MemberSidebar />

      {/* Main Content */}
      <motion.main 
        className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-auto member-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
    </div>
  );
}