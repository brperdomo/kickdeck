/**
 * Registration Analytics Component
 * 
 * Provides comprehensive registration insights including:
 * - Registration status breakdown (pending, approved, rejected, waitlisted)
 * - Expected revenue calculations with all fees included
 * - Payment projections and collection timeline
 * - Tournament director dashboard for financial planning
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  CreditCard,
  BarChart3,
  Download,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface RegistrationAnalyticsProps {
  eventId: string;
}

interface RegistrationSummary {
  totalRegistrations: number;
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    waitlisted: number;
  };
  totalExpectedRevenue: number;
  alreadyCollected: number;
  pendingCollection: number;
  potentialRevenue: number;
  feeBreakdown: {
    totalRegistrationFees: number;
    totalPlatformFees: number;
    totalStripeFees: number;
  };
  paymentMethodAnalysis: {
    cardsSaved: number;
    payLaterSelected: number;
    readyToCharge: number;
  };
  dailyTrend: Array<{
    date: string;
    registrations: number;
    expectedValue: number;
  }>;
  actionItems: {
    pendingApprovals: number;
    waitlistedTeams: number;
    cardsReadyToCharge: number;
    totalActionItems: number;
  };
}

interface AnalyticsData {
  summary: RegistrationSummary;
  revenue: {
    totalRegistrationFees: number;
    totalPlatformFees: number;
    totalStripeFees: number;
    breakdown: {
      approved: number;
      pending: number;
      rejected: number;
    };
  };
  paymentMethods: {
    cardsSaved: number;
    payLaterSelected: number;
    readyToCharge: number;
  };
  dailyTrend: Array<{
    date: string;
    registrations: number;
    expectedValue: number;
  }>;
  actionItems: {
    pendingApprovals: number;
    waitlistedTeams: number;
    cardsReadyToCharge: number;
    totalActionItems: number;
  };
}

export function RegistrationAnalytics({ eventId }: RegistrationAnalyticsProps) {
  const [period, setPeriod] = useState<string>("30");

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['registration-analytics', eventId, period],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/registration-analytics?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch registration analytics');
      }
      return response.json();
    },
  });

  const handleExport = async (format: string = 'csv') => {
    try {
      const response = await fetch(`/api/events/${eventId}/registration-analytics/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `registration-analytics-${eventId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Failed to load registration analytics. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const totalRegistrations = analytics.summary.totalRegistrations;
  const statusBreakdown = analytics.summary.statusBreakdown;

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Analytics</h2>
          <p className="text-gray-600">Comprehensive registration insights and revenue projections</p>
        </div>
        <Button 
          onClick={() => handleExport('csv')} 
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Registrations</p>
                <p className="text-2xl font-bold text-blue-900">{totalRegistrations}</p>
                <p className="text-xs text-blue-600">All submitted teams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Expected Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ${analytics?.summary.totalExpectedRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-green-600">All registrations if approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-700">Ready to Charge</p>
                <p className="text-2xl font-bold text-yellow-900">
                  ${analytics?.summary.pendingCollection?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-yellow-600">Cards saved, pending approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Average Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${totalRegistrations > 0 ? (analytics?.summary.totalExpectedRevenue / totalRegistrations).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-purple-600">Per registration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Registration Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Registration Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-900">{statusBreakdown.pending}</p>
                  <p className="text-sm text-orange-700">Pending Approval</p>
                  <div className="mt-2">
                    <Progress 
                      value={totalRegistrations > 0 ? (statusBreakdown.pending / totalRegistrations) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{statusBreakdown.approved}</p>
                  <p className="text-sm text-green-700">Approved</p>
                  <div className="mt-2">
                    <Progress 
                      value={totalRegistrations > 0 ? (statusBreakdown.approved / totalRegistrations) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{statusBreakdown.waitlisted}</p>
                  <p className="text-sm text-blue-700">Waitlisted</p>
                  <div className="mt-2">
                    <Progress 
                      value={totalRegistrations > 0 ? (statusBreakdown.waitlisted / totalRegistrations) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">{statusBreakdown.rejected}</p>
                  <p className="text-sm text-red-700">Rejected</p>
                  <div className="mt-2">
                    <Progress 
                      value={totalRegistrations > 0 ? (statusBreakdown.rejected / totalRegistrations) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Registration Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Registration Trend (Last {period} days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.dailyTrend.slice(0, 10).map((day, index) => (
                  <Collapsible key={index}>
                    <div className="bg-gray-50 rounded-lg">
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </div>
                          <Badge variant="outline">{day.registrations} teams</Badge>
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          ${day.expectedValue.toFixed(2)}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="mt-2 space-y-2 border-t pt-2">
                          {day.teams?.map((team, teamIndex) => (
                            <div key={teamIndex} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{team.name}</span>
                                <Badge 
                                  variant={team.status === 'registered' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {team.status}
                                </Badge>
                                {team.hasPaymentMethod && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    Card Saved
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">
                                  {new Date(team.registrationTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className="font-medium text-green-600">
                                  ${team.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Already Collected</span>
                  <span className="font-medium">${analytics?.summary.alreadyCollected?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ready to Charge</span>
                  <span className="font-medium">${analytics?.summary.pendingCollection?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Potential Revenue</span>
                  <span className="font-medium">${analytics?.summary.potentialRevenue?.toFixed(2) || '0.00'}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total Expected</span>
                  <span>${analytics?.summary.totalExpectedRevenue?.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Registration Fees</span>
                  <span className="font-medium">${analytics?.revenue.totalRegistrationFees?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Platform Fees</span>
                  <span className="font-medium">${analytics?.revenue.totalPlatformFees?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stripe Fees</span>
                  <span className="font-medium">${analytics?.revenue.totalStripeFees?.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved Teams</span>
                  <span className="font-medium">${analytics?.revenue.breakdown.approved?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Teams</span>
                  <span className="font-medium">${analytics?.revenue.breakdown.pending?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rejected Teams</span>
                  <span className="font-medium">${analytics?.revenue.breakdown.rejected?.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-green-900">{analytics?.paymentMethods.cardsSaved || 0}</p>
                <p className="text-sm text-green-700">Cards Saved</p>
                <p className="text-xs text-green-600 mt-1">Ready for charging when approved</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-blue-900">{analytics?.paymentMethods.payLaterSelected || 0}</p>
                <p className="text-sm text-blue-700">Pay Later Selected</p>
                <p className="text-xs text-blue-600 mt-1">Will need to collect payment manually</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-yellow-900">{analytics?.paymentMethods.readyToCharge || 0}</p>
                <p className="text-sm text-yellow-700">Ready to Charge</p>
                <p className="text-xs text-yellow-600 mt-1">Approved teams with saved cards</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Teams Awaiting Approval</span>
                  </div>
                  <Badge variant="secondary">{analytics?.actionItems.pendingApprovals || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Waitlisted Teams</span>
                  </div>
                  <Badge variant="secondary">{analytics?.actionItems.waitlistedTeams || 0}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Cards Ready to Charge</span>
                  </div>
                  <Badge variant="secondary">{analytics?.actionItems.cardsReadyToCharge || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-900">{analytics?.actionItems.totalActionItems || 0}</p>
                  <p className="text-sm text-green-700 mt-1">Total Action Items</p>
                  <p className="text-xs text-green-600 mt-2">Teams requiring your attention</p>
                </div>
                
                {(analytics?.actionItems.totalActionItems || 0) > 0 && (
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Review and approve/reject pending registrations</p>
                    <p>• Consider moving waitlisted teams to approved</p>
                    <p>• Charge approved teams with saved payment methods</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}