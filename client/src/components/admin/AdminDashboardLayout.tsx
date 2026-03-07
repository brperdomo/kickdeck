import { useEffect, useState } from 'react';
import { AdminTopNav } from './AdminTopNav';
import { AdminContextSidebar } from './AdminContextSidebar';
import { NeonBackground } from './NeonBackground';
import { HelpTooltipPanel } from './HelpTooltipPanel';
import { HelpCenterChatbot } from './HelpCenterChatbot';
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

  // Help center chatbot open state (can be triggered from HelpTooltipPanel)
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Fetch AI configuration status for graceful degradation
  const [aiEnabled, setAiEnabled] = useState(false);
  useEffect(() => {
    fetch('/api/admin/organization-settings/ai-status', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAiEnabled(data.configured === true); })
      .catch(() => {});
  }, []);

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
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 3px)',
          'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
          'linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%)',
        ].join(', '),
        backgroundSize: '100% 3px, 60px 60px, 60px 60px, 100% 100%',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Neon ambient background — z-index:1, behind all content */}
      <NeonBackground />

      {/* Top Navigation — z-40 from its own sticky class */}
      <div className="relative" style={{ zIndex: 40 }}>
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
      </div>

      {/* Body: Sidebar + Content — z-index:2, above neon layer */}
      <div className="flex flex-1 overflow-hidden relative" style={{ zIndex: 2 }}>
        {/* Context Sidebar (desktop only) */}
        <AdminContextSidebar
          items={sidebarItems}
          activeView={activeView}
          onItemClick={onViewChange}
          sectionId={activeSection}
        />

        {/* Main Content Area — transparent bg lets neon bleed through */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Contextual Help Tooltip — top right of content area */}
          <div className="absolute top-4 right-4 z-30">
            <HelpTooltipPanel
              currentView={activeView}
              onOpenChatbot={() => setChatbotOpen(true)}
              aiEnabled={aiEnabled}
            />
          </div>

          <div className="p-3 sm:p-6 md:p-8 relative">
            {children}
          </div>

          {/* Neon floor grid effect */}
          <div className="neon-floor-grid" aria-hidden="true" />
        </main>
      </div>

      {/* Help Center AI Chatbot — floating widget, available on all admin pages */}
      <HelpCenterChatbot
        currentPage={activeView}
        isOpenExternal={chatbotOpen}
        onOpenChange={setChatbotOpen}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}
