/**
 * Unified Tournament Control Page
 * Single entry point for all tournament scheduling functionality
 */

import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { UnifiedTournamentControlCenter } from '@/components/admin/scheduling/UnifiedTournamentControlCenter';

export default function UnifiedTournamentControlPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();

  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
          <p className="text-slate-300 mb-6">Unable to load tournament control without event ID.</p>
          <Button onClick={() => setLocation('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2 bg-white hover:bg-gray-100 border-gray-300 text-gray-900 font-medium transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-blue-400" />
                  Tournament Control Center
                </h1>
                <p className="text-slate-300 mt-1 font-medium">
                  Unified scheduling interface with intelligent automation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnifiedTournamentControlCenter eventId={eventId} />
      </div>
    </div>
  );
}