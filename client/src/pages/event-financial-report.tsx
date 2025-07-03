import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  ArrowLeft, 
  BarChart2, 
  CalendarDays,
  DollarSign, 
  FileText, 
  Loader2,
  Users,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Define color palette that matches our UI
const CHART_COLORS = [
  "#4f46e5", // Primary Indigo
  "#60a5fa", // Light Blue
  "#34d399", // Green
  "#f97316", // Orange
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#0891b2", // Cyan
  "#84cc16", // Lime
  "#ca8a04", // Yellow
];

// Define gender color mapping
const GENDER_COLORS = {
  "Male": "#60a5fa",
  "Female": "#ec4899",
  "Mixed": "#a855f7",
  "Unknown": "#9ca3af",
};

interface EventFinancialReportProps {
  eventId: string;
}

export default function EventFinancialReport({ eventId }: EventFinancialReportProps) {
  const [_, navigate] = useLocation();
  const [includeAI, setIncludeAI] = useState(true);
  
  // Query event financial data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['eventFinancialReport', eventId, includeAI],
    queryFn: async () => {
      const response = await fetch(`/api/reports/events/${eventId}/financial?includeAI=${includeAI}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch event financial report');
      }
      return response.json();
    },
  });
  
  const reportData = data?.data;
  const aiInsights = data?.aiInsights;

  // Handle export function
  const handleExport = () => {
    if (!reportData) return;
    
    try {
      // Convert data to CSV format
      const headers = ["Category", "Value"];
      
      const rows = [
        ["Event Name", reportData.event.name],
        ["Start Date", new Date(reportData.event.start_date).toLocaleDateString()],
        ["End Date", new Date(reportData.event.end_date).toLocaleDateString()],
        ["Application Deadline", reportData.event.application_deadline ? new Date(reportData.event.application_deadline).toLocaleDateString() : "N/A"],
        ["Event Status", reportData.event.is_archived ? "Archived" : "Active"],
        ["", ""],
        ["Financial Summary", ""],
        ["Total Revenue", formatCurrency(reportData.financials.totalRevenue)],
        ["Transaction Count", reportData.financials.transactionCount],
        ["Average Transaction Amount", formatCurrency(reportData.financials.avgTransactionAmount)],
        ["", ""],
        ["Refund Data", ""],
        ["Total Refunds", reportData.refunds.totalRefunds],
        ["Total Refund Amount", formatCurrency(reportData.refunds.totalRefundAmount)],
        ["", ""],
        ["Registrations", ""],
        ["Total Teams", reportData.registrations.totalTeams],
        ["Paid Teams", reportData.registrations.paidTeams],
        ["Pending Teams", reportData.registrations.pendingTeams],
      ];

      // Add revenue by age group
      rows.push(["", ""]);
      rows.push(["Revenue by Age Group", ""]);
      rows.push(["Age Group", "Gender", "Revenue", "Team Count"]);
      
      if (reportData.ageGroupRevenue) {
        reportData.ageGroupRevenue.forEach((item: any) => {
          rows.push([
            item.age_group,
            item.gender || "Unknown",
            formatCurrency(item.total_revenue),
            item.team_count
          ]);
        });
      }
      
      // Add daily revenue
      rows.push(["", ""]);
      rows.push(["Daily Revenue and Registration Trend", ""]);
      rows.push(["Date", "Revenue", "Registrations"]);
      
      if (reportData.dailyRevenue) {
        reportData.dailyRevenue.forEach((item: any) => {
          rows.push([
            new Date(item.day).toLocaleDateString(),
            formatCurrency(item.daily_revenue),
            item.daily_registrations
          ]);
        });
      }
      
      // Convert rows to CSV
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `event-financial-report-${eventId}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Event financial report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the event financial report",
        variant: "destructive",
      });
    }
  };

  // Formats date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/registration-orders-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading event financial report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/registration-orders-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load event financial report. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="w-full max-w-xs mx-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/financial-overview-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">
              {reportData?.event.name || 'Event'} Financial Report
            </h1>
            {reportData?.event.is_archived && (
              <Badge variant="outline" className="ml-2">Archived</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Detailed financial analysis for this event
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="ai-insights-toggle" className="flex items-center justify-between">
              AI Insights
            </Label>
            <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
              <Switch 
                id="ai-insights-toggle"
                checked={includeAI}
                onCheckedChange={setIncludeAI}
              />
              <span className="text-sm">
                {includeAI ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="h-10 mt-6"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Event Info Card */}
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 shrink-0">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Dates</p>
                <p className="text-sm mt-1">
                  {formatDate(reportData?.event.start_date)} - {formatDate(reportData?.event.end_date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Application Deadline</p>
                <p className="text-sm mt-1">
                  {formatDate(reportData?.event.application_deadline)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Registrations</p>
                <p className="text-sm mt-1">
                  {reportData?.registrations.totalTeams || 0} teams 
                  ({reportData?.registrations.paidTeams || 0} paid, {reportData?.registrations.pendingTeams || 0} pending)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(reportData?.financials.totalRevenue || 0)}
            </div>
            <p className="text-muted-foreground text-sm">Total Revenue</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {reportData?.financials.transactionCount || 0}
            </div>
            <p className="text-muted-foreground text-sm">Total Transactions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(reportData?.financials.avgTransactionAmount || 0)}
            </div>
            <p className="text-muted-foreground text-sm">Avg Transaction</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {reportData?.registrations.paidTeams || 0}
            </div>
            <p className="text-muted-foreground text-sm">
              Paid Teams ({reportData?.registrations.totalTeams ? 
                Math.round((reportData.registrations.paidTeams / reportData.registrations.totalTeams) * 100) + '%' 
                : '0%'})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          {includeAI && aiInsights && <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Age Group Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Age Group</CardTitle>
                <CardDescription>Distribution of revenue across age groups</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {reportData?.ageGroupRevenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.ageGroupRevenue.map((item: any) => ({
                        name: item.age_group,
                        revenue: item.total_revenue,
                        teams: item.team_count,
                        color: GENDER_COLORS[item.gender as keyof typeof GENDER_COLORS] || GENDER_COLORS.Unknown
                      }))}
                      margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => `$${(value).toLocaleString()}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`$${Number(value).toLocaleString()}`, 'Revenue'];
                          return [value, 'Teams'];
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue" 
                        fill={CHART_COLORS[0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No age group data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Revenue and Registration Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue and registration pattern over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {reportData?.dailyRevenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportData.dailyRevenue.map((item: any) => ({
                        date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: item.daily_revenue,
                        registrations: item.daily_registrations,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => `$${(value).toLocaleString()}`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`$${Number(value).toLocaleString()}`, 'Revenue'];
                          return [value, 'Teams Registered'];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={CHART_COLORS[0]} 
                        name="Revenue"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="registrations" 
                        stroke={CHART_COLORS[1]} 
                        name="Teams Registered" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No daily revenue data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary and Refunds */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Overview of revenue and refund metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Revenue Metrics</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="text-sm font-medium">{formatCurrency(reportData?.financials.totalRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Transaction Count</span>
                      <span className="text-sm font-medium">{reportData?.financials.transactionCount || 0}</span>
                    </div>

                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Refund Data</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Refunds</span>
                      <span className="text-sm font-medium">{reportData?.refunds.totalRefunds || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Refund Amount</span>
                      <span className="text-sm font-medium">{formatCurrency(reportData?.refunds.totalRefundAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Refund Rate</span>
                      <span className="text-sm font-medium">
                        {reportData?.financials.transactionCount ?
                          ((reportData.refunds.totalRefunds / reportData.financials.transactionCount) * 100).toFixed(1) + '%' :
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Net Revenue</span>
                      <span className="text-sm font-medium">
                        {formatCurrency((reportData?.financials.totalRevenue || 0) - (reportData?.refunds.totalRefundAmount || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Insights Preview */}
          {includeAI && aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>
                  Key insights and recommendations based on financial analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key Insights */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Key Insights</h3>
                    <ul className="space-y-1">
                      {aiInsights?.keyInsights ? (
                        aiInsights.keyInsights.slice(0, 3).map((insight: string, index: number) => (
                          <li key={index} className="flex text-sm">
                            <span className="text-primary mr-2">•</span>
                            <span>{insight}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No insights available</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Recommendations</h3>
                    <ul className="space-y-1">
                      {aiInsights?.recommendations ? (
                        aiInsights.recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                          <li key={index} className="flex text-sm">
                            <span className="text-primary mr-2">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="text-center pt-2">
                  <Button variant="link" size="sm" onClick={() => document.querySelector('button[value="ai-insights"]')?.click()}>
                    View all AI insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Age Groups Tab */}
        <TabsContent value="age-groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Age Group Financial Analysis</CardTitle>
              <CardDescription>Detailed breakdown of revenue by age group and gender</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.ageGroupRevenue?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Age Group</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="text-right">Teams</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Avg Revenue per Team</TableHead>
                        <TableHead className="text-right">% of Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.ageGroupRevenue.map((group: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{group.age_group}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ 
                                  backgroundColor: GENDER_COLORS[group.gender as keyof typeof GENDER_COLORS] || GENDER_COLORS.Unknown 
                                }}
                              />
                              {group.gender || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{group.team_count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(group.total_revenue)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(group.team_count ? group.total_revenue / group.team_count : 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {reportData.financials.totalRevenue ? 
                              ((group.total_revenue / reportData.financials.totalRevenue) * 100).toFixed(1) + '%' : 
                              '0%'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No age group data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Age Group Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Age Group</CardTitle>
                <CardDescription>Visual distribution of revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {reportData?.ageGroupRevenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.ageGroupRevenue.map((item: any) => ({
                          name: item.age_group,
                          value: Number(item.total_revenue),
                          gender: item.gender
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {reportData.ageGroupRevenue.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={GENDER_COLORS[entry.gender as keyof typeof GENDER_COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No age group data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Age Group Team Count */}
            <Card>
              <CardHeader>
                <CardTitle>Team Count by Age Group</CardTitle>
                <CardDescription>Distribution of teams registered</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {reportData?.ageGroupRevenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.ageGroupRevenue.map((item: any) => ({
                        name: item.age_group,
                        teams: item.team_count,
                        gender: item.gender
                      }))}
                      margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip formatter={(value) => [value, 'Teams']} />
                      <Legend />
                      <Bar 
                        dataKey="teams" 
                        name="Teams" 
                        fill={CHART_COLORS[1]} 
                        barSize={20}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No team count data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue and Registration Trend</CardTitle>
              <CardDescription>Transaction and registration pattern over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[450px]">
              {reportData?.dailyRevenue?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.dailyRevenue.map((item: any) => ({
                      date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      revenue: item.daily_revenue,
                      registrations: item.daily_registrations,
                      fullDate: new Date(item.day).toLocaleDateString()
                    }))}
                    margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => `$${(value).toLocaleString()}`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickFormatter={(value) => value.toLocaleString()}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === 'revenue') return [`$${Number(value).toLocaleString()}`, 'Revenue'];
                        return [value, 'Teams Registered'];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return payload[0].payload.fullDate;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={CHART_COLORS[0]} 
                      name="Revenue"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="registrations" 
                      stroke={CHART_COLORS[1]} 
                      name="Teams Registered" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No daily revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Timeline</CardTitle>
              <CardDescription>Detailed breakdown of revenue and registrations by day</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.dailyRevenue?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Teams Registered</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg Revenue per Team</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dailyRevenue.map((day: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {new Date(day.day).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">{day.daily_registrations}</TableCell>
                          <TableCell className="text-right">{formatCurrency(day.daily_revenue)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(day.daily_registrations ? day.daily_revenue / day.daily_registrations : 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No daily revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        {includeAI && aiInsights && (
          <TabsContent value="ai-insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Event Analysis</CardTitle>
                <CardDescription>
                  Automated financial analysis powered by OpenAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Insights */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
                  <ul className="space-y-2">
                    {aiInsights.keyInsights?.length > 0 ? (
                      aiInsights.keyInsights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No insights available</li>
                    )}
                  </ul>
                </div>
                
                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {aiInsights.recommendations?.length > 0 ? (
                      aiInsights.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{recommendation}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No recommendations available</li>
                    )}
                  </ul>
                </div>

                {/* Visualization Captions */}
                {aiInsights.visualizationCaptions && Object.keys(aiInsights.visualizationCaptions).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Chart Interpretations</h3>
                    <div className="space-y-3">
                      {Object.entries(aiInsights.visualizationCaptions).map(([chartName, caption]: [string, any], index: number) => (
                        <div key={index} className="bg-muted/30 p-3 rounded-md">
                          <h4 className="font-medium mb-1">{chartName}</h4>
                          <p className="text-sm">{caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Growth Opportunities */}
                {aiInsights.growthOpportunities?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Growth Opportunities</h3>
                    <ul className="space-y-2">
                      {aiInsights.growthOpportunities.map((opportunity: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <p className="text-xs text-muted-foreground">
                  This analysis is generated using AI and should be considered advisory. Always verify important insights with additional data.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}