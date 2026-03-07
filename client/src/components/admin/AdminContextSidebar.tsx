import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// Generic nav item shape — works with AdminNavItem, ScheduleNavItem, etc.
export interface SidebarNavItem {
  id: string;
  view: string | null;
  label: string;
  icon: LucideIcon;
}

interface AdminContextSidebarProps<T extends SidebarNavItem = SidebarNavItem> {
  items: T[];
  activeView: string;
  onItemClick: (item: T) => void;
  sectionId: string;
}

// Parent container variant — orchestrates staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12 },
  },
};

// Child item variant — slides in from left with blur
const itemVariants = {
  hidden: { opacity: 0, x: -16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.35,
      type: 'spring' as const,
      stiffness: 200,
      damping: 16,
    },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.1 } },
};

export function AdminContextSidebar({
  items,
  activeView,
  onItemClick,
  sectionId,
}: AdminContextSidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 overflow-y-auto overflow-x-hidden relative"
      style={{
        width: '200px',
        background:
          'linear-gradient(180deg, rgba(9, 9, 26, 0.85) 0%, rgba(16, 12, 42, 0.82) 50%, rgba(20, 16, 52, 0.80) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(124, 58, 237, 0.15)',
        boxShadow:
          '4px 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(124, 58, 237, 0.05)',
      }}
    >
      {/* Animated neon edge glow — right border breathes */}
      <div className="neon-sidebar-edge" />

      {/* Animated ambient glow blob inside sidebar */}
      <div className="neon-sidebar-glow neon-sidebar-glow--top" />
      <div className="neon-sidebar-glow neon-sidebar-glow--bottom" />

      {/* Floating micro-particles */}
      <div className="neon-sidebar-particles" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      <div className="py-4 px-2 relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={sectionId}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-0.5"
          >
            {items.map((item) => {
              const isActive = item.view === activeView;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  variants={itemVariants}
                  onClick={() => onItemClick(item)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group"
                  style={{
                    background: isActive
                      ? 'rgba(124, 58, 237, 0.15)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(156, 163, 175, 0.8)',
                  }}
                  whileHover={{
                    x: 4,
                    transition: {
                      duration: 0.15,
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                    },
                  }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        'rgba(124, 58, 237, 0.08)';
                      (e.currentTarget as HTMLElement).style.color =
                        'rgba(255, 255, 255, 0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        'transparent';
                      (e.currentTarget as HTMLElement).style.color =
                        'rgba(156, 163, 175, 0.8)';
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-[15%] bottom-[15%] w-1 rounded-full"
                      style={{
                        background: 'linear-gradient(to bottom, #7c3aed, #a855f7)',
                        boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      layoutId="sidebarActiveIndicator"
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded-md shrink-0"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)'
                        : 'rgba(255,255,255,0.03)',
                      border: isActive
                        ? '1px solid rgba(124,58,237,0.2)'
                        : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive
                        ? '0 0 8px rgba(124,58,237,0.15)'
                        : 'none',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Label */}
                  <span className={isActive ? 'font-medium' : 'font-normal'}>
                    {item.label}
                  </span>

                  {/* Active background glow */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        boxShadow:
                          '0 0 15px rgba(124,58,237,0.08), inset 0 0 15px rgba(124,58,237,0.03)',
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
