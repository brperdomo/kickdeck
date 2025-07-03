import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { 
  ArrowLeft, 
  BarChart2, 
  DollarSign, 
  Download, 
  FileText, 
  Loader2, 
  RefreshCw, 
  TrendingUp 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Define time period options
const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export default function FinancialOverviewReport() {
  const [_, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [includeAI, setIncludeAI] = useState(true);
  
  // Query financial overview data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['financialOverviewReport', selectedPeriod, includeAI],
    queryFn: async () => {
      const response = await fetch(`/api/reports/financial-overview?period=${selectedPeriod}&includeAI=${includeAI}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch financial overview report');
      }
      return response.json();
    },
  });
  
  const financialData = data?.data;
  const aiInsights = data?.aiInsights;

  // Handle export function
  const handleExport = () => {
    if (!financialData) return;
    
    try {
      // Convert data to CSV format
      const headers = ["Category", "Value"];
      
      const rows = [
        ["Total Revenue", formatCurrency(financialData.revenue.totalRevenue)],
        ["Transaction Count", financialData.revenue.transactionCount],
        ["Average Transaction Value", formatCurrency(financialData.revenue.avgTransactionValue)],
        ["Total Refunds", financialData.refunds.totalRefunds],
        ["Total Refund Amount", formatCurrency(financialData.refunds.totalRefundAmount)],
        ["Period", financialData.timeRange.period],
        ["Start Date", new Date(financialData.timeRange.start).toLocaleDateString()],
        ["End Date", new Date(financialData.timeRange.end).toLocaleDateString()],
      ];

      // Add monthly revenue trend
      rows.push(["", ""]);
      rows.push(["Monthly Revenue Trend", ""]);
      rows.push(["Month", "Revenue", "Transactions"]);
      
      if (financialData.monthlyRevenueTrend) {
        financialData.monthlyRevenueTrend.forEach((item: any) => {
          rows.push([
            new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            formatCurrency(item.total_revenue),
            item.transaction_count
          ]);
        });
      }
      
      // Add payment methods
      rows.push(["", ""]);
      rows.push(["Payment Methods", ""]);
      rows.push(["Method", "Count", "Total Amount", "Average Amount"]);
      
      if (financialData.paymentMethods) {
        financialData.paymentMethods.forEach((item: any) => {
          rows.push([
            item.paymentMethod || "Unknown",
            item.count,
            formatCurrency(item.totalAmount),
            formatCurrency(item.avgAmount)
          ]);
        });
      }
      
      // Add top events
      rows.push(["", ""]);
      rows.push(["Top Events by Revenue", ""]);
      rows.push(["Event Name", "Revenue", "Transactions"]);
      
      if (financialData.topEvents) {
        financialData.topEvents.forEach((item: any) => {
          rows.push([
            item.eventName,
            formatCurrency(item.revenue),
            item.transactionCount
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
      link.setAttribute('download', `financial-overview-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Financial overview report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the financial overview report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading financial overview report...</p>
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
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load financial overview report. Please try again.'}
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
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="text-2xl font-bold mb-1">Financial Overview Report</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your platform's financial performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="time-period">Time Period</Label>
            <Select 
              value={selectedPeriod} 
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger id="time-period" className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(financialData?.revenue.totalRevenue || 0)}
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
              {financialData?.revenue.transactionCount || 0}
            </div>
            <p className="text-muted-foreground text-sm">Total Transactions</p>
          </CardContent>
        </Card>
        

        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {financialData?.refunds.totalRefunds || 0}
            </div>
            <p className="text-muted-foreground text-sm">
              Refunds ({formatCurrency(financialData?.refunds.totalRefundAmount || 0)})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard and Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="events">Top Events</TabsTrigger>
          {includeAI && aiInsights && <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Revenue Trend */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue performance over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {financialData?.monthlyRevenueTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financialData.monthlyRevenueTrend.map((item: any) => ({
                        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                        revenue: item.total_revenue,
                        transactions: item.transaction_count
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
                          return [value, 'Transactions'];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS[0]} name="Revenue" />
                      <Bar yAxisId="right" dataKey="transactions" fill={CHART_COLORS[1]} name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No revenue data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods Distribution */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {financialData?.paymentMethods?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialData.paymentMethods.map((item: any, index: number) => ({
                          name: item.paymentMethod || 'Unknown',
                          value: Number(item.totalAmount)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {financialData.paymentMethods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No payment method data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* AI Insights Preview Section */}
          {includeAI && aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Automatically generated insights based on your financial data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key Insights */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Top Insights</h3>
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

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Revenue and transaction count over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {financialData?.monthlyRevenueTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialData.monthlyRevenueTrend.map((item: any) => ({
                      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                      revenue: item.total_revenue,
                      transactions: item.transaction_count
                    }))}
                    margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
                        return [value, 'Transactions'];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS[0]} name="Revenue" />
                    <Bar yAxisId="right" dataKey="transactions" fill={CHART_COLORS[1]} name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No revenue data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue & Refund Summary</CardTitle>
              <CardDescription>Detailed breakdown of revenue metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Revenue Metrics</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="text-sm font-medium">{formatCurrency(financialData?.revenue.totalRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Transaction Count</span>
                      <span className="text-sm font-medium">{financialData?.revenue.transactionCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Transaction Value</span>
                      <span className="text-sm font-medium">{formatCurrency(financialData?.revenue.avgTransactionValue || 0)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Refund Metrics</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Refunds</span>
                      <span className="text-sm font-medium">{financialData?.refunds.totalRefunds || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Refund Amount</span>
                      <span className="text-sm font-medium">{formatCurrency(financialData?.refunds.totalRefundAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Refund Rate</span>
                      <span className="text-sm font-medium">
                        {financialData?.revenue.transactionCount 
                          ? ((financialData.refunds.totalRefunds / financialData.revenue.transactionCount) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Period</span>
                      <span className="text-sm font-medium">
                        {TIME_PERIODS.find(p => p.value === financialData?.timeRange.period)?.label || 'Custom'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Start Date</span>
                      <span className="text-sm font-medium">
                        {financialData?.timeRange.start 
                          ? new Date(financialData.timeRange.start).toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">End Date</span>
                      <span className="text-sm font-medium">
                        {financialData?.timeRange.end 
                          ? new Date(financialData.timeRange.end).toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>By transaction volume</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {financialData?.paymentMethods?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialData.paymentMethods.map((item: any) => ({
                          name: item.paymentMethod || 'Unknown',
                          value: Number(item.count)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {financialData.paymentMethods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Transactions']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No payment method data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Payment Methods Detailed Analysis</CardTitle>
                <CardDescription>Transaction count, total and average amount by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Avg Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData?.paymentMethods?.length > 0 ? (
                        financialData.paymentMethods.map((method: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{method.paymentMethod || 'Unknown'}</TableCell>
                            <TableCell className="text-right">{method.count}</TableCell>
                            <TableCell className="text-right">{formatCurrency(method.totalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(method.avgAmount)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No payment data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Events by Revenue</CardTitle>
              <CardDescription>Events that generated the most revenue in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Avg Transaction</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData?.topEvents?.length > 0 ? (
                      financialData.topEvents.map((event: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{event.eventName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(event.revenue)}</TableCell>
                          <TableCell className="text-right">{event.transactionCount}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(event.revenue / event.transactionCount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/event-financial-report/${event.eventId}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No event data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Event</CardTitle>
              <CardDescription>Visual comparison of top events by revenue</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {financialData?.topEvents?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialData.topEvents.map((event: any) => ({
                      name: event.eventName,
                      revenue: event.revenue,
                      transactions: event.transactionCount
                    }))}
                    margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tickFormatter={(value) => `$${(value).toLocaleString()}`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return [`$${Number(value).toLocaleString()}`, 'Revenue'];
                        return [value, 'Transactions'];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill={CHART_COLORS[0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No event data available for the selected period</p>
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
                <CardTitle>AI-Generated Financial Insights</CardTitle>
                <CardDescription>
                  Automated analysis of your financial data powered by OpenAI
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
                
                {/* Top Revenue Events Analysis */}
                {aiInsights.topRevenueEvents?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Top Revenue Events Analysis</h3>
                    <ul className="space-y-2">
                      {aiInsights.topRevenueEvents.map((trend: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Growth Opportunities */}
                {aiInsights.growthOpportunities?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Growth Opportunities</h3>
                    <ul className="space-y-2">
                      {aiInsights.growthOpportunities.map((pattern: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{pattern}</span>
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