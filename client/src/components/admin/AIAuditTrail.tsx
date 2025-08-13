import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Filter,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AIAuditTrailProps {
  eventId: string;
}

export default function AIAuditTrail({ eventId }: AIAuditTrailProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(24);
  const [showFailuresOnly, setShowFailuresOnly] = useState(false);

  // Fetch audit summary
  const { data: auditSummary } = useQuery({
    queryKey: ['ai-audit-summary', eventId, selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/ai-audit/summary?hours=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch audit summary');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch detailed audit log
  const { data: auditLog } = useQuery({
    queryKey: ['ai-audit-log', eventId, showFailuresOnly],
    queryFn: async () => {
      const url = `/api/admin/events/${eventId}/ai-audit${showFailuresOnly ? '/failures' : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch audit log');
      return response.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const exportAuditLog = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/ai-audit/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-audit-log-event-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'move_game': return 'bg-blue-100 text-blue-800';
      case 'swap_teams': return 'bg-green-100 text-green-800';
      case 'create_game': return 'bg-purple-100 text-purple-800';
      case 'update_status': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">AI Audit Trail</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timeframe Filter */}
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(parseInt(e.target.value))}
            className="bg-purple-900/20 border border-purple-500/30 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
          </select>

          {/* Filter Toggle */}
          <Button
            variant={showFailuresOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFailuresOnly(!showFailuresOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFailuresOnly ? 'Show All' : 'Failures Only'}
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportAuditLog}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {auditSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{auditSummary.totalActions}</div>
                  <div className="text-sm text-purple-200">Total Actions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-green-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{auditSummary.successfulActions}</div>
                  <div className="text-sm text-green-200">Successful</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-red-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{auditSummary.failedActions}</div>
                  <div className="text-sm text-red-200">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-blue-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{auditSummary.timeRange}</div>
                  <div className="text-sm text-blue-200">Time Period</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Failures Alert */}
      {auditSummary && auditSummary.failedActions > 0 && (
        <Alert className="border-red-400/30 bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Recent Failures Detected:</strong> {auditSummary.failedActions} AI actions failed in the last {auditSummary.timeRange}. 
            Review the log below to identify issues that may need attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Audit Log */}
      <Card className="bg-black/40 border-purple-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5 text-purple-400" />
            Detailed Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog && auditLog.length > 0 ? (
            <div className="space-y-4">
              {auditLog.map((entry: any, index: number) => (
                <div key={entry.id || index} className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getActionBadgeColor(entry.actionType)}>
                        {entry.actionType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      
                      <Badge variant={entry.success ? "default" : "destructive"}>
                        {entry.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            SUCCESS
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            FAILED
                          </>
                        )}
                      </Badge>
                      
                      <span className="text-sm text-purple-300">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <span className="text-xs text-purple-400">
                      Session: {entry.sessionId.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-purple-300">User Request:</span>
                      <span className="text-white ml-2">"{entry.userRequest}"</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-purple-300">Target:</span>
                      <span className="text-white ml-2">{entry.targetTable}:{entry.targetId}</span>
                    </div>

                    {entry.aiReasoning && (
                      <div className="text-sm">
                        <span className="text-purple-300">AI Reasoning:</span>
                        <span className="text-gray-300 ml-2">{entry.aiReasoning}</span>
                      </div>
                    )}

                    {!entry.success && entry.errorMessage && (
                      <div className="text-sm">
                        <span className="text-red-300">Error:</span>
                        <span className="text-red-200 ml-2">{entry.errorMessage}</span>
                      </div>
                    )}

                    {/* Show changes made */}
                    {entry.success && entry.oldValues && entry.newValues && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3 bg-black/30 rounded">
                        <div>
                          <div className="text-xs text-red-300 mb-1">BEFORE:</div>
                          <pre className="text-xs text-red-200 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(entry.oldValues), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs text-green-300 mb-1">AFTER:</div>
                          <pre className="text-xs text-green-200 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(entry.newValues), null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-purple-300">
              No audit entries found for the selected timeframe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}