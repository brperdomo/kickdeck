import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Circle, ArrowRight, Settings, Users, Calendar, Trophy } from 'lucide-react';

interface SchedulingWorkflowGuideProps {
  eventId: string;
  onNavigate?: (view: string) => void;
}

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  targetView: string;
  icon: React.ElementType;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'formats',
    label: 'Create Format Templates',
    description: 'Define matchup patterns (e.g., 4-Team Round Robin) in Format Settings',
    targetView: 'format-settings',
    icon: Settings,
  },
  {
    id: 'assign',
    label: 'Assign Formats to Flights',
    description: 'Choose a format template for each flight in Flight Assignment',
    targetView: 'flights',
    icon: Users,
  },
  {
    id: 'schedule',
    label: 'Generate Schedule',
    description: 'Use "Schedule All" or select specific flights to auto-generate games',
    targetView: 'overview',
    icon: Calendar,
  },
  {
    id: 'review',
    label: 'Review & Publish',
    description: 'Check the generated schedule, enter scores on game day, then publish',
    targetView: 'schedule-viewer',
    icon: Trophy,
  },
];

export function SchedulingWorkflowGuide({ eventId, onNavigate }: SchedulingWorkflowGuideProps) {
  // Fetch format templates
  const { data: templates } = useQuery({
    queryKey: ['matchup-templates-count'],
    queryFn: async () => {
      const response = await fetch('/api/admin/matchup-templates');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch flight configuration readiness
  const { data: flights } = useQuery({
    queryKey: ['flight-configurations', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch game counts
  const { data: gameCounts } = useQuery({
    queryKey: ['flight-game-counts', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/flight-game-counts`);
        if (!response.ok) return {};
        return await response.json();
      } catch {
        return {};
      }
    },
  });

  // Derive step completion
  const templateCount = templates?.length || 0;
  const flightsWithTeams = (flights as any[])?.filter((f: any) => f.teamCount > 0) || [];
  const configuredFlights = flightsWithTeams.filter(
    (f: any) => f.isConfigured && f.formatName !== 'Not Configured'
  );
  const totalGames = Object.values(gameCounts || {}).reduce(
    (sum: number, count: any) => sum + (typeof count === 'number' ? count : 0),
    0
  );

  const stepStatus: Record<string, boolean> = {
    formats: templateCount > 0,
    assign: flightsWithTeams.length > 0 && configuredFlights.length === flightsWithTeams.length,
    schedule: totalGames > 0,
    review: totalGames > 0,
  };

  // Determine current step (first incomplete)
  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => !stepStatus[step.id]);
  const allComplete = currentStepIndex === -1;

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)',
        borderColor: 'rgba(124,58,237,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-violet-400" />
        <h3 className="text-base font-semibold text-white">Scheduling Workflow</h3>
        {allComplete && (
          <span className="ml-auto text-xs font-medium text-green-400 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            All steps complete
          </span>
        )}
        {!allComplete && (
          <span className="ml-auto text-xs text-slate-400">
            Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {WORKFLOW_STEPS.map((step, index) => {
          const isComplete = stepStatus[step.id];
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex-1 flex items-center gap-2">
              <button
                onClick={() => onNavigate?.(step.targetView)}
                className="flex-1 rounded-lg p-3 transition-all text-left group"
                style={{
                  background: isCurrent
                    ? 'rgba(124,58,237,0.15)'
                    : isComplete
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: isCurrent
                    ? '1px solid rgba(124,58,237,0.3)'
                    : isComplete
                    ? '1px solid rgba(34,197,94,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <Circle
                      className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-violet-400' : 'text-slate-500'}`}
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isComplete ? 'text-green-400' : isCurrent ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">{step.description}</p>

                {/* Stats */}
                <div className="mt-2 pl-6">
                  {step.id === 'formats' && (
                    <span className="text-xs text-slate-400">
                      {templateCount} template{templateCount !== 1 ? 's' : ''} created
                    </span>
                  )}
                  {step.id === 'assign' && (
                    <span className="text-xs text-slate-400">
                      {configuredFlights.length} / {flightsWithTeams.length} flights configured
                    </span>
                  )}
                  {step.id === 'schedule' && (
                    <span className="text-xs text-slate-400">
                      {totalGames} game{totalGames !== 1 ? 's' : ''} generated
                    </span>
                  )}
                </div>
              </button>
              {index < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
