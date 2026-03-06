import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { MasterScheduleLayout } from '@/components/admin/scheduling/MasterScheduleLayout';
import { MasterScheduleContentRenderer } from '@/components/admin/scheduling/MasterScheduleContentRenderer';
import PersistentAIChatbot from '@/components/admin/scheduling/PersistentAIChatbot';
import { GameImportModal } from '@/components/admin/GameImportModalFixed';
import type { MasterScheduleView, ScheduleNavItem } from '@/config/master-schedule-navigation';

export default function MasterSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<MasterScheduleView>('overview');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Fetch event name for the top nav
  const { data: event } = useQuery<{ name?: string }>({
    queryKey: [`/api/admin/events/${eventId}`],
    enabled: !!eventId,
  });

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  // Handle sidebar / section item clicks
  const handleViewChange = (item: ScheduleNavItem) => {
    // Import opens a modal rather than switching views
    if (item.view === 'import') {
      setImportModalOpen(true);
      return;
    }
    setActiveView(item.view);
  };

  return (
    <MasterScheduleLayout
      eventId={eventId}
      eventName={event?.name}
      activeView={activeView}
      onViewChange={handleViewChange}
      onBackToDashboard={() => setLocation('/admin')}
    >
      <MasterScheduleContentRenderer activeView={activeView} eventId={eventId} onViewChange={handleViewChange} />

      {/* Persistent AI Chatbot — works across all views */}
      <PersistentAIChatbot eventId={eventId} />

      {/* CSV Import Modal */}
      <GameImportModal
        eventId={eventId}
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={() => {
          setImportModalOpen(false);
          // Refresh the current view if needed
          if (activeView === 'schedule-viewer' || activeView === 'calendar') {
            window.location.reload();
          }
        }}
      />
    </MasterScheduleLayout>
  );
}
