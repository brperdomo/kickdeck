import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentReportsViewProps {
  eventId: string;
}

interface PaymentSummary {
  totalRevenue: number;
  totalPlatformFees: number;
  totalNetAmount: number;
  platformFeeRate: number;
  successfulPayments: number;
  pendingPayments: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    platformFees: number;
    netAmount: number;
    transactions: number;
  }>;
}

export function PaymentReportsView({ eventId }: PaymentReportsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch payment summary
  const { data: summary, isLoading } = useQuery<PaymentSummary>({
    queryKey: ['payment-summary', eventId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/payment-reports/summary?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch payment summary');
      return response.json();
    }
  });

  // Fetch payout schedule information
  const { data: payoutInfo } = useQuery({
    queryKey: ['payout-info', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/payment-reports/payouts`);
      if (!response.ok) throw new Error('Failed to fetch payout info');
      return response.json();
    }
  });

  const handleExportReport = async (format: string = 'csv') => {
    try {
      const response = await fetch(`/api/events/${eventId}/payment-reports/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-report-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Reports & Analytics</h3>
        <Button onClick={() => handleExportReport('csv')} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${summary?.totalRevenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Amount</p>
                <p className="text-2xl font-bold">${summary?.totalNetAmount?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500">After platform fees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Payments</p>
                <p className="text-2xl font-bold">{summary?.successfulPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-2xl font-bold">${summary?.totalPlatformFees?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500">
                  {summary?.platformFeeRate ? `${(summary.platformFeeRate * 100).toFixed(1)}% of revenue` : 'Platform fee'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Schedule Information */}
      {payoutInfo && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Payout Schedule & Banking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Current Schedule</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <Badge variant="secondary">{payoutInfo.schedule?.interval || 'Weekly'}</Badge>
                  </div>
                  {payoutInfo.nextPayoutEstimate && (
                    <div className="flex justify-between">
                      <span>Next Payout:</span>
                      <span className="font-medium">{payoutInfo.nextPayoutEstimate}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Recent Payouts</h4>
                <div className="space-y-1 text-sm">
                  {payoutInfo.recentPayouts?.slice(0, 3).map((payout: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{new Date(payout.arrivalDate).toLocaleDateString()}</span>
                      <span className="font-medium">${payout.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {(!payoutInfo.recentPayouts || payoutInfo.recentPayouts.length === 0) && (
                    <div className="text-gray-500">No recent payouts</div>
                  )}
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Daily Batching:</strong> Payments are processed daily for better cash flow. 
                Funds typically arrive in your bank account within 2-7 business days after approval.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.dailyBreakdown && summary.dailyBreakdown.length > 0 ? (
              <div className="space-y-2">
                {summary.dailyBreakdown.slice(0, 10).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                      <Badge variant="outline">{day.transactions} transactions</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${day.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Net: ${day.netAmount.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payment transactions yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-green-800">KickDeck Payment Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">No Stripe Dashboard Needed</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Complete transaction history here</li>
                <li>• Detailed fee breakdowns</li>
                <li>• Export reports for accounting</li>
                <li>• Real-time payment status</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Optimized Cash Flow</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Daily payout batching</li>
                <li>• Faster access to funds</li>
                <li>• Transparent fee structure</li>
                <li>• Automated reconciliation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}