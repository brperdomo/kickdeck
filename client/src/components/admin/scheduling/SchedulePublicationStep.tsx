import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Share2, FileText, Download, Mail, Eye, CheckCircle, 
  Users, Calendar, MapPin, Clock, ExternalLink
} from 'lucide-react';

interface SchedulePublicationStepProps {
  eventId: string;
  onComplete: (data: any) => void;
}

interface ScheduleSummary {
  totalGames: number;
  assignedGames: number;
  fieldsUsed: number;
  daysSpanned: number;
  teamsParticipating: number;
}

interface PublicationStatus {
  isPublished: boolean;
  publishedAt?: string;
  scheduleUrl?: string;
  notificationsSent: number;
  downloadFormats: string[];
}

export function SchedulePublicationStep({ eventId, onComplete }: SchedulePublicationStepProps) {
  const [selectedNotifications, setSelectedNotifications] = useState({
    teams: true,
    referees: true,
    officials: true
  });
  
  const queryClient = useQueryClient();

  // Fetch schedule summary
  const { data: scheduleSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['schedule-summary', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/summary`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch schedule summary');
      return response.json();
    }
  });

  // Fetch publication status
  const { data: publicationStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['publication-status', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/publication-status`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch publication status');
      return response.json();
    }
  });

  // Publish schedule mutation
  const publishScheduleMutation = useMutation({
    mutationFn: async (notificationOptions: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: notificationOptions })
      });
      if (!response.ok) throw new Error('Failed to publish schedule');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publication-status', eventId] });
      toast({ 
        title: 'Schedule published successfully',
        description: `Schedule is now public. ${data.notificationsSent} notifications sent.`
      });
    }
  });

  // Send notifications mutation
  const sendNotificationsMutation = useMutation({
    mutationFn: async (recipients: string[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipients })
      });
      if (!response.ok) throw new Error('Failed to send notifications');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Notifications sent',
        description: `Sent schedule notifications to ${data.recipientCount} recipients`
      });
    }
  });

  // Generate exports mutation
  const generateExportsMutation = useMutation({
    mutationFn: async (formats: string[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ formats })
      });
      if (!response.ok) throw new Error('Failed to generate exports');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Schedule exports generated',
        description: `Generated ${data.formats.length} export formats`
      });
    }
  });

  const handlePublishSchedule = () => {
    publishScheduleMutation.mutate(selectedNotifications);
  };

  const handleSendNotifications = () => {
    const recipients = Object.entries(selectedNotifications)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);
    
    sendNotificationsMutation.mutate(recipients);
  };

  const handleGenerateExports = () => {
    const formats = ['pdf', 'csv', 'ical'];
    generateExportsMutation.mutate(formats);
  };

  const handlePreviewSchedule = () => {
    window.open(`/schedule/preview/${eventId}`, '_blank');
  };

  const handleComplete = () => {
    if (!publicationStatus?.isPublished) {
      toast({ 
        title: 'Schedule not published',
        description: 'Please publish the schedule before completing the tournament setup',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      isPublished: true,
      publishedAt: publicationStatus.publishedAt,
      totalGames: scheduleSummary?.totalGames || 0,
      notificationsSent: publicationStatus.notificationsSent || 0
    });
  };

  if (summaryLoading || statusLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading schedule publication interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <span>Step 6: Schedule Publication & Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Finalize and publish your complete tournament schedule with automated notifications and multiple export formats.
          </p>
          
          {scheduleSummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{scheduleSummary.totalGames}</div>
                <div className="text-sm text-gray-500">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{scheduleSummary.assignedGames}</div>
                <div className="text-sm text-gray-500">Assigned Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{scheduleSummary.fieldsUsed}</div>
                <div className="text-sm text-gray-500">Fields Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{scheduleSummary.daysSpanned}</div>
                <div className="text-sm text-gray-500">Tournament Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{scheduleSummary.teamsParticipating}</div>
                <div className="text-sm text-gray-500">Teams</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            {publicationStatus?.isPublished ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
            <span>Publication Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {publicationStatus?.isPublished ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Schedule Published</h4>
                    <p className="text-green-700 text-sm">
                      Published on {new Date(publicationStatus.publishedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handlePreviewSchedule}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Public
                    </Button>
                    <Button
                      onClick={() => navigator.clipboard.writeText(publicationStatus.scheduleUrl!)}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Schedule Ready for Publication</h4>
                <p className="text-yellow-700 text-sm">
                  Your tournament schedule is complete and ready to be published.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Publish Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <span>Publish Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Make your schedule publicly visible and send notifications.
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.teams}
                    onChange={(e) => setSelectedNotifications(prev => ({ ...prev, teams: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notify teams</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.referees}
                    onChange={(e) => setSelectedNotifications(prev => ({ ...prev, referees: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notify referees</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.officials}
                    onChange={(e) => setSelectedNotifications(prev => ({ ...prev, officials: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notify officials</span>
                </label>
              </div>
              
              <Button
                onClick={handlePublishSchedule}
                disabled={publishScheduleMutation.isPending || publicationStatus?.isPublished}
                className="w-full"
              >
                {publishScheduleMutation.isPending ? 'Publishing...' : 
                 publicationStatus?.isPublished ? 'Already Published' : 'Publish Schedule'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Send Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Mail className="h-5 w-5 text-green-600" />
              <span>Send Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Send schedule updates to teams, referees, and officials.
              </p>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {publicationStatus?.notificationsSent || 0}
                </div>
                <div className="text-xs text-blue-700">Notifications Sent</div>
              </div>
              
              <Button
                onClick={handleSendNotifications}
                disabled={sendNotificationsMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {sendNotificationsMutation.isPending ? 'Sending...' : 'Send Notifications'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generate Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Download className="h-5 w-5 text-purple-600" />
              <span>Export Formats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate downloadable schedule formats for distribution.
              </p>
              
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">PDF Format</Badge>
                <Badge variant="outline" className="text-xs">CSV Spreadsheet</Badge>
                <Badge variant="outline" className="text-xs">iCal Calendar</Badge>
              </div>
              
              <Button
                onClick={handleGenerateExports}
                disabled={generateExportsMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {generateExportsMutation.isPending ? 'Generating...' : 'Generate Exports'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Eye className="h-5 w-5 text-indigo-600" />
            <span>Schedule Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Preview how your published schedule will appear to teams and spectators.
            </p>
            
            <div className="flex space-x-4">
              <Button
                onClick={handlePreviewSchedule}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Schedule</span>
              </Button>
              
              <Button
                onClick={() => window.open(`/admin/events/${eventId}/schedule`, '_blank')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Admin View</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Tournament Setup Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              Congratulations! Your 6-step systematic tournament management system is now complete.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Settings className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Parameters Defined</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Trophy className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Flights Created</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Brackets Generated</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Games Scheduled</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div>
                <h3 className="font-semibold text-green-800">System Implementation Complete</h3>
                <p className="text-green-700 text-sm">
                  Your tournament is ready with {scheduleSummary?.totalGames || 0} games across {scheduleSummary?.daysSpanned || 0} days.
                </p>
              </div>
              <Button 
                onClick={handleComplete}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Complete Tournament Setup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}