import type { MasterScheduleView } from '@/config/master-schedule-navigation';
import {
  SCHEDULE_SECTIONS,
  type ScheduleNavItem,
} from '@/config/master-schedule-navigation';

// Child components — all existing, zero changes
import { UnifiedTournamentControlCenter } from './UnifiedTournamentControlCenter';
import { FlightConfigurationTable } from './FlightConfigurationTable';
import { FlightReviewDashboard } from './FlightReviewDashboard';
import { UnifiedBracketManager } from './UnifiedBracketManager';
import { FormatSettings } from './FormatSettings';
import { ScheduleViewer } from './ScheduleViewerFixed';
import { CalendarScheduler } from './calendar';
import AgeGroupScheduleViewer from './AgeGroupScheduleViewer';
import GameScoreManager from '../scoring/GameScoreManager';
import ScoringStandingsSettings from './ScoringStandingsSettings';
import GameCardsGenerator from './GameCardsGenerator';
import TeamsManager from './TeamsManager';
import { PublishSchedules } from './PublishSchedules';
import FieldManagementDashboard from '../FieldManagementDashboard';
import { WorkflowDataFlow } from './WorkflowDataFlow';
import { SchedulingWorkflowGuide } from './SchedulingWorkflowGuide';

interface MasterScheduleContentRendererProps {
  activeView: MasterScheduleView;
  eventId: string;
  onViewChange?: (item: ScheduleNavItem) => void;
}

export function MasterScheduleContentRenderer({
  activeView,
  eventId,
  onViewChange,
}: MasterScheduleContentRendererProps) {
  // Helper to navigate to a view by name (used by workflow guide)
  const navigateToView = (viewId: string) => {
    if (!onViewChange) return;
    for (const section of SCHEDULE_SECTIONS) {
      const item = section.items.find((i) => i.view === viewId);
      if (item) {
        onViewChange(item);
        return;
      }
    }
  };

  switch (activeView) {
    // ─── Setup ──────────────────────────────────────────
    case 'overview':
      return (
        <div className="space-y-6">
          <SchedulingWorkflowGuide eventId={eventId} onNavigate={navigateToView} />
          <UnifiedTournamentControlCenter eventId={eventId} />
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Flight Configuration Status
            </h3>
            <FlightConfigurationTable eventId={eventId} />
          </div>
        </div>
      );

    case 'flights':
      return <FlightReviewDashboard eventId={eventId} />;

    case 'brackets':
      return <UnifiedBracketManager eventId={eventId} />;

    case 'format-settings':
      return <FormatSettings eventId={eventId} />;

    case 'field-settings':
      return <FieldManagementDashboard eventId={eventId} />;

    // ─── Schedule ───────────────────────────────────────
    case 'schedule-viewer':
      return <ScheduleViewer eventId={eventId} />;

    case 'calendar':
      return <CalendarScheduler eventId={eventId} />;

    case 'game-management':
      return <AgeGroupScheduleViewer eventId={parseInt(eventId)} />;

    case 'import':
      // Import is handled by the parent page opening a modal.
      // This case should not render, but provide a fallback.
      return null;

    // ─── Game Day ───────────────────────────────────────
    case 'score-entry':
      return <GameScoreManager eventId={eventId} />;

    case 'scoring-rules':
      return <ScoringStandingsSettings eventId={eventId} />;

    case 'game-cards':
      return <GameCardsGenerator eventId={eventId} />;

    case 'teams':
      return <TeamsManager eventId={parseInt(eventId)} />;

    // ─── Publish ────────────────────────────────────────
    case 'publish':
      return <PublishSchedules eventId={eventId} />;

    case 'field-order':
      return <FieldManagementDashboard eventId={eventId} />;

    default:
      return (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">View not found</p>
        </div>
      );
  }
}
