import { useEffect } from 'react';
import { AdminTopNav } from './AdminTopNav';
import { AdminContextSidebar } from './AdminContextSidebar';
import {
  ADMIN_SECTIONS,
  VIEW_TO_SECTION,
  getTournamentDirectorSections,
  type AdminNavItem,
} from '@/config/admin-navigation';

interface AdminDashboardLayoutProps {
  activeView: string;
  onViewChange: (item: AdminNavItem) => void;
  isTournamentDirector: boolean;
  isSuperAdmin: boolean;
  user: any;
  onLogout: () => void;
  onNavigateToAccount: () => void;
  onSwitchToMember: () => void;
  logoUrl?: string;
  isEmulating?: boolean;
  emulatingUser?: string;
  onStopEmulation?: () => void;
  children: React.ReactNode;
}

export function AdminDashboardLayout({
  activeView,
  onViewChange,
  isTournamentDirector,
  isSuperAdmin,
  user,
  onLogout,
  onNavigateToAccount,
  onSwitchToMember,
  logoUrl,
  isEmulating,
  emulatingUser,
  onStopEmulation,
  children,
}: AdminDashboardLayoutProps) {
  // Determine which sections are visible
  const sections =
    isTournamentDirector && !isSuperAdmin
      ? getTournamentDirectorSections()
      : ADMIN_SECTIONS;

  // Derive active section from the active view
  const activeSection =
    VIEW_TO_SECTION[activeView] || sections[0]?.id || 'tournaments';

  // Get sidebar items for the currently active section
  const currentSection = sections.find((s) => s.id === activeSection);
  const sidebarItems = currentSection?.items || [];

  // When a section tab is clicked, navigate to the first item in that section
  const handleSectionChange = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
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
      <AdminTopNav
        sections={sections}
        activeSection={activeSection}
        activeView={activeView}
        onSectionChange={handleSectionChange}
        onItemClick={onViewChange}
        user={user}
        logoUrl={logoUrl}
        onLogout={onLogout}
        onNavigateToAccount={onNavigateToAccount}
        onSwitchToMember={onSwitchToMember}
        isEmulating={isEmulating}
        emulatingUser={emulatingUser}
        onStopEmulation={onStopEmulation}
      />

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Context Sidebar (desktop only) */}
        <AdminContextSidebar
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
              background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)',
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
              background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <div className="p-3 sm:p-6 md:p-8">
            {children}
          </div>

          {/* Neon floor grid effect */}
          <div className="neon-floor-grid" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}
