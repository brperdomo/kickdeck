import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { NeonBackground } from "@/components/admin/NeonBackground";

// Subtle particle animation for sidebar background
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0
              ? 'rgba(124, 58, 237, 0.3)'
              : 'rgba(6, 182, 212, 0.2)',
          }}
          initial={{
            x: Math.random() * 100 + 50,
            y: Math.random() * 300 + 100,
            opacity: 0.15 + Math.random() * 0.25
          }}
          animate={{
            y: [null, Math.random() * 400 + 100],
            opacity: [null, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            filter: `blur(${Math.random() * 2}px)`,
            scale: 0.5 + Math.random() * 1.5
          }}
        />
      ))}
    </div>
  );
};

const sidebarVariants = {
  hidden: {
    opacity: 0,
    x: -40
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 80,
      damping: 15,
      when: "beforeChildren",
      staggerChildren: 0.07
    }
  }
};

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
      delay: 0.2 + (index * 0.08),
      duration: 0.6,
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  })
};

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeItem?: string;
  onNavItemClick?: (itemId: string) => void;
  navItems?: NavItem[];
  icon?: React.ReactNode;
  backUrl?: string;
  backLabel?: string;
}

export function AdminPageLayout({
  children,
  title,
  subtitle = "Management Console",
  activeItem,
  onNavItemClick,
  navItems = [],
  icon = <Calendar className="h-5 w-5 text-violet-300" />,
  backUrl = "/admin",
  backLabel = "Back to Dashboard"
}: AdminPageLayoutProps) {
  const [, navigate] = useLocation();

  // Apply dashboard-dark-active to body for portalled elements (dialogs, popovers)
  useEffect(() => {
    document.body.classList.add('dashboard-dark-active');
    return () => {
      document.body.classList.remove('dashboard-dark-active');
    };
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden dashboard-dark"
      style={{
        backgroundColor: '#0f0f1a',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 3px)',
          'linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)',
          'linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%)',
        ].join(', '),
        backgroundSize: '100% 3px, 60px 60px, 60px 60px, 100% 100%',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Neon ambient background — drifting blobs, streaks, beam, horizon */}
      <NeonBackground />

      {/* Animated Sidebar — z-index:2 above neon bg, semi-transparent */}
      <motion.div
        className="w-64 flex flex-col h-full text-white relative shrink-0"
        style={{
          zIndex: 2,
          background: 'linear-gradient(180deg, rgba(9, 9, 26, 0.85) 0%, rgba(16, 12, 42, 0.82) 50%, rgba(20, 16, 52, 0.80) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(124, 58, 237, 0.15)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(124, 58, 237, 0.05)',
        }}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background subtle animated particles */}
        <Particles />

        {/* Animated neon edge glow */}
        <div className="neon-sidebar-edge" />

        {/* Animated ambient glow blobs */}
        <div className="neon-sidebar-glow neon-sidebar-glow--top" />
        <div className="neon-sidebar-glow neon-sidebar-glow--bottom" />

        {/* Floating micro-particles */}
        <div className="neon-sidebar-particles" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>

        {/* Enhanced stylish sidebar header with animation */}
        <motion.div
          className="px-6 py-7 relative"
          style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.1)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(109,40,217,0.15) 100%)',
                border: '1px solid rgba(124,58,237,0.3)',
                boxShadow: '0 0 15px rgba(124,58,237,0.15)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {icon}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="font-semibold text-white relative">
                <span className="relative">
                  {title}
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-[2px]"
                    style={{
                      background: 'linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.6) 50%, rgba(6,182,212,0.3) 100%)',
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </h1>
              <motion.p
                className="text-xs mt-1.5"
                style={{ color: 'rgba(167, 139, 250, 0.7)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {subtitle}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced content wrapper with decorative elements */}
        {navItems.length > 0 && (
          <div className="relative flex-1 overflow-y-auto">
            {/* Multiple decorative sidebar elements for enhanced visual depth */}
            <div className="absolute top-10 right-0 w-full h-40 pointer-events-none" style={{ background: 'rgba(124,58,237,0.04)', filter: 'blur(100px)', borderRadius: '50%' }} />
            <div className="absolute top-1/2 left-10 w-20 h-20 pointer-events-none" style={{ background: 'rgba(168,85,247,0.04)', filter: 'blur(70px)', borderRadius: '50%' }} />
            <div className="absolute bottom-20 right-0 w-full h-40 pointer-events-none" style={{ background: 'rgba(6,182,212,0.03)', filter: 'blur(100px)', borderRadius: '50%' }} />

            {/* Content with improved spacing */}
            <div className="p-5 pt-6">
              <div className="space-y-2.5 relative">
                {/* Navigation Buttons */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={index}
                    variants={navItemVariants}
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavItemClick && onNavItemClick(item.id)}
                    className={cn(
                      "relative px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                      "flex items-center",
                      activeItem === item.id
                        ? "text-white"
                        : "hover:text-white"
                    )}
                    style={{
                      background: activeItem === item.id
                        ? 'rgba(124, 58, 237, 0.15)'
                        : 'transparent',
                      color: activeItem === item.id
                        ? '#ffffff'
                        : 'rgba(156, 163, 175, 0.8)',
                    }}
                  >
                    {activeItem === item.id && (
                      <motion.div
                        className="absolute left-0 top-[15%] bottom-[15%] w-1 rounded-full"
                        style={{
                          background: 'linear-gradient(to bottom, #7c3aed, #a855f7)',
                          boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                        }}
                        layoutId="activeTab"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <div
                            className="w-6 h-6 flex items-center justify-center rounded-md shrink-0"
                            style={{
                              background: activeItem === item.id
                                ? 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)'
                                : 'rgba(255,255,255,0.03)',
                              border: activeItem === item.id
                                ? '1px solid rgba(124,58,237,0.2)'
                                : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <span className="text-sm">{item.icon}</span>
                          </div>
                        ) : (
                          <span className="text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                        )}
                        <span className={cn("text-sm", activeItem === item.id ? "font-medium" : "font-normal")}>
                          {item.label}
                        </span>
                      </div>
                    </div>

                    {/* Active background glow */}
                    {activeItem === item.id && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          boxShadow: '0 0 15px rgba(124,58,237,0.08), inset 0 0 15px rgba(124,58,237,0.03)',
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer section */}
        <motion.div
          className="mt-auto p-5 pt-4"
          style={{ borderTop: '1px solid rgba(124, 58, 237, 0.1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            variant="outline"
            className="w-full text-white hover:text-white"
            style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
            }}
            onClick={() => navigate(backUrl)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </motion.div>
      </motion.div>

      {/* Main content area — z-index:2 above neon bg */}
      <div className="flex-1 overflow-auto relative" style={{ zIndex: 2 }}>
        <div className="p-6 md:p-8 relative">
          {children}
        </div>

        {/* Neon floor grid effect */}
        <div className="neon-floor-grid" aria-hidden="true" />
      </div>
    </div>
  );
}
