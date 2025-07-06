import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface PlatformFeeSummaryProps {
  data: any;
  loading: boolean;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  eventId: string;
}

export function PlatformFeeSummary({ data, loading, dateRange, eventId }: PlatformFeeSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for fee breakdown pie chart
  const feeBreakdownData = [
    {
      name: 'MatchPro Revenue',
      value: data.summary?.totalMatchProRevenue || 0,
      color: '#22c55e'
    },
    {
      name: 'Stripe Fees',
      value: (data.summary?.totalStripeFees || 0),
      color: '#3b82f6'
    },
    {
      name: 'Tournament Net',
      value: data.summary?.totalNetAmount || 0,
      color: '#8b5cf6'
    }
  ];

  // Prepare data for daily breakdown chart
  const dailyData = data.dailyBreakdown?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString(),
    'Total Amount': day.totalAmount,
    'Platform Fee': day.platformFees,
    'MatchPro Revenue': day.matchproRevenue,
    'Stripe Fee': day.stripeFees,
    'Tournament Net': day.netAmount
  })) || [];

  return (
    <div className="space-y-6">
      {/* Fee Breakdown Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Distribution
            </CardTitle>
            <CardDescription>
              How platform fees are distributed across Stripe, MatchPro, and tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feeBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: $${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {feeBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fee Structure Details
            </CardTitle>
            <CardDescription>
              Breakdown of the 4% + $0.30 total fee structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">MatchPro Revenue (1.1%)</span>
                <span className="text-green-600 font-bold">
                  ${data.summary?.totalMatchProRevenue?.toLocaleString() || '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Stripe Fees (2.9% + $0.30)</span>
                <span className="text-blue-600 font-bold">
                  ${data.summary?.totalStripeFees?.toLocaleString() || '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-800">Tournament Net Revenue</span>
                <span className="text-purple-600 font-bold">
                  ${data.summary?.totalNetAmount?.toLocaleString() || '0.00'}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Processed</span>
                  <span className="font-bold text-lg">
                    ${data.summary?.totalAmount?.toLocaleString() || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Fee Breakdown
            </CardTitle>
            <CardDescription>
              Daily breakdown of fees and revenue distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name
                  ]}
                />
                <Legend />
                <Bar dataKey="MatchPro Revenue" stackId="a" fill="#22c55e" />
                <Bar dataKey="Stripe Fee" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Tournament Net" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Event Breakdown */}
      {data.eventBreakdown && data.eventBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Revenue Breakdown</CardTitle>
            <CardDescription>
              Platform fees and revenue distribution by event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.eventBreakdown.map((event: any) => (
                <div key={event.eventId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{event.eventName}</h4>
                    <span className="text-sm text-muted-foreground">
                      {event.transactionCount} transactions
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total</span>
                      <div className="font-medium">${event.totalAmount?.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MatchPro</span>
                      <div className="font-medium text-green-600">
                        ${event.matchproRevenue?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stripe</span>
                      <div className="font-medium text-blue-600">
                        ${event.stripeFees?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tournament</span>
                      <div className="font-medium text-purple-600">
                        ${event.netAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}