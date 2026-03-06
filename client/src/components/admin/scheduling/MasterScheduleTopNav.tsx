import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Menu, X, Trophy } from 'lucide-react';
import type {
  ScheduleSection,
  ScheduleNavItem,
} from '@/config/master-schedule-navigation';

interface MasterScheduleTopNavProps {
  sections: ScheduleSection[];
  activeSection: string;
  activeView: string;
  onSectionChange: (sectionId: string) => void;
  onItemClick: (item: ScheduleNavItem) => void;
  eventName?: string;
  eventId: string;
  logoUrl?: string;
  onBackToDashboard: () => void;
}

export function MasterScheduleTopNav({
  sections,
  activeSection,
  activeView,
  onSectionChange,
  onItemClick,
  eventName,
  eventId,
  logoUrl,
  onBackToDashboard,
}: MasterScheduleTopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Main nav header */}
      <header
        className="sticky top-0 z-40 admin-top-nav"
        style={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
          boxShadow:
            '0 4px 30px rgba(0,0,0,0.3), 0 0 15px rgba(124,58,237,0.05)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Back + Logo + Event Name */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                color: 'rgba(167, 139, 250, 1)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)';
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div className="h-6 w-px bg-violet-500/20 hidden sm:block" />

            <img
              src={logoUrl || '/uploads/KickDeck_Linear_White.png'}
              alt="KickDeck"
              className="h-6 object-contain hidden sm:block"
              style={{ filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.15))' }}
            />

            {eventName && (
              <>
                <div className="h-6 w-px bg-violet-500/20 hidden lg:block" />
                <span
                  className="text-sm font-medium truncate max-w-[180px] hidden lg:inline"
                  style={{ color: 'rgba(167, 139, 250, 0.9)' }}
                >
                  {eventName}
                </span>
              </>
            )}
          </div>

          {/* Center: Section tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(109,40,217,0.15) 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(156, 163, 175, 0.8)',
                    border: isActive
                      ? '1px solid rgba(124,58,237,0.3)'
                      : '1px solid transparent',
                    boxShadow: isActive
                      ? '0 0 15px rgba(124,58,237,0.15), 0 0 30px rgba(124,58,237,0.05)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(156, 163, 175, 0.8)';
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.6) 50%, rgba(124,58,237,0) 100%)',
                      }}
                      layoutId="scheduleSectionIndicator"
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Event badge + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Event ID badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.1) 100%)',
                color: 'rgba(167, 139, 250, 0.9)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <Trophy className="h-3 w-3" />
              Event {eventId}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile section tabs drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden z-30 relative"
            style={{
              background: 'rgba(15, 15, 35, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {/* Back to dashboard link (mobile) */}
              <button
                onClick={() => {
                  onBackToDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-2"
                style={{
                  background: 'rgba(124, 58, 237, 0.08)',
                  color: 'rgba(167, 139, 250, 1)',
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>

              {sections.map((section) => {
                const isActive = activeSection === section.id;
                const Icon = section.icon;

                return (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        onSectionChange(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isActive
                          ? 'rgba(124,58,237,0.15)'
                          : 'transparent',
                        color: isActive
                          ? '#ffffff'
                          : 'rgba(156, 163, 175, 0.8)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                    {/* Show sub-items for active section on mobile */}
                    {isActive && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = item.view === activeView;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onItemClick(item);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors"
                              style={{
                                background: isItemActive
                                  ? 'rgba(124,58,237,0.15)'
                                  : 'transparent',
                                color: isItemActive
                                  ? '#ffffff'
                                  : 'rgba(156, 163, 175, 0.8)',
                              }}
                            >
                              <ItemIcon className="h-3.5 w-3.5" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
