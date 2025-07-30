import { AllTournamentsScheduleViewer } from '@/components/admin/scheduling/AllTournamentsScheduleViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Trophy, Eye, Zap } from 'lucide-react';

export default function SchedulingDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              All Tournaments Schedule Viewer
            </h1>
            <p className="text-gray-600 text-lg">
              View and manage schedules across all tournaments in one central location
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <Eye className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Central Schedule Hub:</strong> This page displays schedules from ALL tournaments. 
            To generate new schedules for specific tournaments, use the "Manage" button to access each tournament's 
            Master Schedule Control Center.
          </AlertDescription>
        </Alert>

        {/* All Tournaments Schedule Viewer Component */}
        <AllTournamentsScheduleViewer />
      </div>
    </div>
  );
}