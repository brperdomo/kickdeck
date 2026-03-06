import { useEffect } from 'react';
import { MasterScheduleTopNav } from './MasterScheduleTopNav';
import { AdminContextSidebar } from '../AdminContextSidebar';
import {
  SCHEDULE_SECTIONS,
  SCHEDULE_VIEW_TO_SECTION,
  type ScheduleNavItem,
} from '@/config/master-schedule-navigation';

interface MasterScheduleLayoutProps {
  eventId: string;
  eventName?: string;
  activeView: string;
  onViewChange: (item: ScheduleNavItem) => void;
  onBackToDashboard: () => void;
  logoUrl?: string;
  children: React.ReactNode;
}

export function MasterScheduleLayout({
  eventId,
  eventName,
  activeView,
  onViewChange,
  onBackToDashboard,
  logoUrl,
  children,
}: MasterScheduleLayoutProps) {
  // Derive active section from the active view
  const activeSection =
    SCHEDULE_VIEW_TO_SECTION[activeView] || SCHEDULE_SECTIONS[0]?.id || 'setup';

  // Get sidebar items for the currently active section
  const currentSection = SCHEDULE_SECTIONS.find((s) => s.id === activeSection);
  const sidebarItems = currentSection?.items || [];

  // When a section tab is clicked, navigate to the first item in that section
  const handleSectionChange = (sectionId: string) => {
    const section = SCHEDULE_SECTIONS.find((s) => s.id === sectionId);
    if (section && section.items.length > 0) {
      onViewChange(section.items[0]);
    }
  };

  // Apply dashboard-dark-active to body for portalled elements (dialogs, popovers)
  useEffect(() => {
    document.body.classList.add('dashboard-dark-active');
    return () => {
      document.body.classList.remove('dashboard-dark-active');
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col dashboard-dark"
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
      {/* Top Navigation */}
      <MasterScheduleTopNav
        sections={SCHEDULE_SECTIONS}
        activeSection={activeSection}
        activeView={activeView}
        onSectionChange={handleSectionChange}
        onItemClick={onViewChange}
        eventName={eventName}
        eventId={eventId}
        logoUrl={logoUrl}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Context Sidebar (desktop only) — key forces clean remount on section switch */}
        <AdminContextSidebar
          key={activeSection}
          items={sidebarItems}
          activeView={activeView}
          onItemClick={onViewChange}
          sectionId={activeSection}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Ambient glow orbs */}
          <div
            className="pointer-events-none fixed"
            style={{
              top: '12%',
              right: '8%',
              width: '200px',
              height: '200px',
              background:
                'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="pointer-events-none fixed"
            style={{
              bottom: '18%',
              left: '40%',
              width: '150px',
              height: '150px',
              background:
                'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <div className="p-3 sm:p-6 md:p-8">{children}</div>

          {/* Neon floor grid effect */}
          <div className="neon-floor-grid" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}
