import { useState } from "react";
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
  Tag,
  ToggleLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

export default function FeesAnalysisReport() {
  const [_, navigate] = useLocation();
  const [includeAI, setIncludeAI] = useState(true);
  
  // Query fees analysis data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['feesAnalysisReport', includeAI],
    queryFn: async () => {
      const response = await fetch(`/api/reports/fees-analysis?includeAI=${includeAI}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch fees analysis report');
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
        ["Fee Statistics", ""],
        ["Total Fees", reportData.feeStatistics.totalFees],
        ["Total Events with Fees", reportData.feeStatistics.totalEvents],
        ["Average Fee Amount", formatCurrency(reportData.feeStatistics.avgFeeAmount)],
        ["", ""],
      ];

      // Add fee type distribution
      rows.push(["Fee Type Distribution", ""]);
      rows.push(["Fee Type", "Count", "Average Amount"]);
      
      if (reportData.feeTypeDistribution) {
        reportData.feeTypeDistribution.forEach((item: any) => {
          rows.push([
            item.feeType || "Unknown",
            item.count,
            formatCurrency(item.avgAmount)
          ]);
        });
      }
      
      // Add required vs optional fees
      rows.push(["", ""]);
      rows.push(["Required vs Optional Fees", ""]);
      rows.push(["Is Required", "Fee Count", "Average Amount", "Total Potential Value"]);
      
      if (reportData.requiredVsOptional) {
        reportData.requiredVsOptional.forEach((item: any) => {
          rows.push([
            item.is_required ? "Required" : "Optional",
            item.fee_count,
            formatCurrency(item.avg_amount),
            formatCurrency(item.total_potential_value)
          ]);
        });
      }
      
      // Add top performing fees
      rows.push(["", ""]);
      rows.push(["Top Performing Fees", ""]);
      rows.push(["Fee Name", "Fee Type", "Event Name", "Amount", "Transactions", "Total Revenue"]);
      
      if (reportData.topPerformingFees) {
        reportData.topPerformingFees.forEach((item: any) => {
          rows.push([
            item.name,
            item.fee_type,
            item.event_name,
            formatCurrency(item.amount),
            item.transactions,
            formatCurrency(item.total_revenue)
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
      link.setAttribute('download', `fees-analysis-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Fees analysis report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the fees analysis report",
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
            onClick={() => navigate('/financial-overview-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading fees analysis report...</p>
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
            onClick={() => navigate('/financial-overview-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load fees analysis report. Please try again.'}
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
          <h1 className="text-2xl font-bold mb-1">Fees Analysis Report</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of fee structures and performance
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {reportData?.feeStatistics.totalFees || 0}
            </div>
            <p className="text-muted-foreground text-sm">Total Fees</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {reportData?.feeStatistics.totalEvents || 0}
            </div>
            <p className="text-muted-foreground text-sm">Events with Fees</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(reportData?.feeStatistics.avgFeeAmount || 0)}
            </div>
            <p className="text-muted-foreground text-sm">Average Fee Amount</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {reportData?.feeTypeDistribution?.length || 0}
            </div>
            <p className="text-muted-foreground text-sm">Fee Types</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
          <TabsTrigger value="top-fees">Top Performing Fees</TabsTrigger>
          {includeAI && aiInsights && <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fee Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Type Distribution</CardTitle>
                <CardDescription>Breakdown of fees by type</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reportData?.feeTypeDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.feeTypeDistribution.map((item: any) => ({
                          name: item.feeType || 'Unknown',
                          value: Number(item.count)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {reportData.feeTypeDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No fee type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Required vs Optional Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Required vs Optional Fees</CardTitle>
                <CardDescription>Analysis of required and optional fees</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reportData?.requiredVsOptional?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.requiredVsOptional.map((item: any) => ({
                        name: item.is_required ? 'Required' : 'Optional',
                        count: item.fee_count,
                        avgAmount: item.avg_amount,
                        totalValue: item.total_potential_value
                      }))}
                      margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        tickFormatter={(value) => value}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => `$${(value).toLocaleString()}`}
                        label={{ value: 'Amount', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'count') return [value, 'Fee Count'];
                          if (name === 'avgAmount') return [`$${Number(value).toLocaleString()}`, 'Avg Amount'];
                          return [`$${Number(value).toLocaleString()}`, 'Total Value'];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill={CHART_COLORS[0]} name="Fee Count" />
                      <Bar yAxisId="right" dataKey="avgAmount" fill={CHART_COLORS[1]} name="Avg Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No required vs optional fee data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Required vs Optional Fees Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Required vs Optional Fees Analysis</CardTitle>
              <CardDescription>Detailed comparison of required and optional fees</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.requiredVsOptional?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Average Amount</TableHead>
                        <TableHead className="text-right">Total Potential Value</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.requiredVsOptional.map((item: any, index: number) => {
                        const totalFees = reportData.requiredVsOptional.reduce((sum: number, fee: any) => sum + fee.fee_count, 0);
                        const totalValue = reportData.requiredVsOptional.reduce((sum: number, fee: any) => sum + fee.total_potential_value, 0);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <Badge variant={item.is_required ? "default" : "outline"}>
                                {item.is_required ? "Required" : "Optional"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.fee_count}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.avg_amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_potential_value)}</TableCell>
                            <TableCell className="text-right">
                              {totalValue ? ((item.total_potential_value / totalValue) * 100).toFixed(1) + '%' : '0%'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No required vs optional fee data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* AI Insights Preview */}
          {includeAI && aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Fee Insights</CardTitle>
                <CardDescription>
                  Key insights and recommendations for fee structure optimization
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

        {/* Fee Types Tab */}
        <TabsContent value="fee-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Type Analysis</CardTitle>
              <CardDescription>Detailed analysis of fees by type</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.feeTypeDistribution?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                        <TableHead className="text-right">Average Amount</TableHead>
                        <TableHead className="text-right">Estimated Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.feeTypeDistribution.map((item: any, index: number) => {
                        const totalCount = reportData.feeTypeDistribution.reduce((sum: number, fee: any) => sum + fee.count, 0);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.feeType || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                            <TableCell className="text-right">
                              {totalCount ? ((item.count / totalCount) * 100).toFixed(1) + '%' : '0%'}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.avgAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.avgAmount * item.count)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No fee type data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fee Type Count */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Type Count Distribution</CardTitle>
                <CardDescription>Number of fees by type</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {reportData?.feeTypeDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.feeTypeDistribution.map((item: any) => ({
                        name: item.feeType || 'Unknown',
                        count: item.count
                      }))}
                      margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value, 'Count']} />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Count" 
                        fill={CHART_COLORS[0]} 
                        barSize={30}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No fee type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Type Average Amount */}
            <Card>
              <CardHeader>
                <CardTitle>Average Fee Amount by Type</CardTitle>
                <CardDescription>Average amount per fee type</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {reportData?.feeTypeDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.feeTypeDistribution.map((item: any) => ({
                        name: item.feeType || 'Unknown',
                        avgAmount: item.avgAmount
                      }))}
                      margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Average Amount']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="avgAmount" 
                        name="Average Amount" 
                        fill={CHART_COLORS[1]} 
                        barSize={30}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No fee type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Fees Tab */}
        <TabsContent value="top-fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Fees</CardTitle>
              <CardDescription>Fees that generate the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.topPerformingFees?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Name</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Event Name</TableHead>
                        <TableHead className="text-right">Fee Amount</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topPerformingFees.map((fee: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{fee.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {fee.fee_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{fee.event_name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(fee.amount)}</TableCell>
                          <TableCell className="text-right">{fee.transactions}</TableCell>
                          <TableCell className="text-right">{formatCurrency(fee.total_revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No top performing fees data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Fee Revenue Visualization</CardTitle>
              <CardDescription>Visual comparison of top performing fees</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {reportData?.topPerformingFees?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.topPerformingFees.slice(0, 10).map((fee: any) => ({
                      name: fee.name,
                      revenue: fee.total_revenue,
                      transactions: fee.transactions,
                      event: fee.event_name,
                      feeType: fee.fee_type
                    }))}
                    margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
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
                      labelFormatter={(label) => {
                        // Find the fee from the data using the label (name)
                        const fee = reportData.topPerformingFees.find((f: any) => f.name === label);
                        if (fee) {
                          return `${label} (${fee.event_name})`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      fill={CHART_COLORS[0]} 
                      barSize={30}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No top performing fees data available</p>
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
                <CardTitle>AI-Generated Fee Structure Analysis</CardTitle>
                <CardDescription>
                  Automated analysis of fee structure patterns and opportunities
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

                {/* Payment Method Trends */}
                {aiInsights.paymentMethodTrends?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment Method Trends</h3>
                    <ul className="space-y-2">
                      {aiInsights.paymentMethodTrends.map((trend: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span>{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Seasonal Patterns */}
                {aiInsights.seasonalPatterns?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Seasonal Patterns</h3>
                    <ul className="space-y-2">
                      {aiInsights.seasonalPatterns.map((pattern: string, index: number) => (
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