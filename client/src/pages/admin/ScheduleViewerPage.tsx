import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewer';
import { ArrowLeft, Calendar, Trophy } from 'lucide-react';
import { Link } from 'wouter';

interface ScheduleViewerPageProps {
  eventId: string;
}

export function ScheduleViewerPage({ eventId }: ScheduleViewerPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/tournament-system">
                <button className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Tournament System
                </button>
              </Link>
              <div className="flex items-center">
                <Trophy className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Tournament Schedule</h1>
                  <p className="text-sm text-gray-600">Event ID: {eventId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Real Team Data Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScheduleViewer eventId={eventId} />
      </div>
    </div>
  );
}

export default ScheduleViewerPage;