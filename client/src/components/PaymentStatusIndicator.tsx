import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentStatusInfo {
  teamId: number;
  teamName: string;
  currentStatus: string;
  stripeStatus?: string;
  lastUpdated: string;
  needsAttention: boolean;
  actionRequired?: string;
}

interface PaymentStatusIndicatorProps {
  teamId: number;
  onStatusUpdate?: (status: string) => void;
}

export default function PaymentStatusIndicator({ teamId, onStatusUpdate }: PaymentStatusIndicatorProps) {
  const [statusInfo, setStatusInfo] = useState<PaymentStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/status/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setStatusInfo(data);
        if (onStatusUpdate) {
          onStatusUpdate(data.currentStatus);
        }
      } else {
        throw new Error('Failed to fetch payment status');
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      toast({
        title: "Status Check Failed",
        description: "Could not retrieve current payment status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncStatus = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`/api/payments/sync-status/${teamId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Status Sync Complete",
          description: result.message || "Payment status synchronized with Stripe",
        });
        // Refresh status after sync
        await fetchStatus();
      } else {
        throw new Error('Failed to sync payment status');
      }
    } catch (error) {
      console.error('Error syncing payment status:', error);
      toast({
        title: "Sync Failed",
        description: "Could not synchronize payment status",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [teamId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'payment_info_provided': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (needsAttention: boolean, status: string) => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (needsAttention) return <AlertCircle className="w-4 h-4 text-amber-600" />;
    if (status === 'paid') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'payment_failed') return <XCircle className="w-4 h-4 text-red-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  if (loading && !statusInfo) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Checking payment status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusInfo) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">Unable to load payment status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${statusInfo.needsAttention ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            {getStatusIcon(statusInfo.needsAttention, statusInfo.currentStatus)}
            <span>Payment Status</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncStatus}
            disabled={syncing}
            className="h-8 px-2"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span className="ml-1 text-xs">Sync</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Current Status:</span>
            <Badge className={`text-xs ${getStatusColor(statusInfo.currentStatus)}`}>
              {statusInfo.currentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          {statusInfo.stripeStatus && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Stripe Status:</span>
              <Badge variant="outline" className="text-xs">
                {statusInfo.stripeStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Last Updated:</span>
            <span className="text-xs text-gray-800">
              {new Date(statusInfo.lastUpdated).toLocaleDateString()}
            </span>
          </div>
          
          {statusInfo.actionRequired && (
            <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Action Required:</strong> {statusInfo.actionRequired}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}