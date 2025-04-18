import React, { useState, useEffect } from "react";
import { Search, FileText, DownloadCloud, Filter, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { usePermissions } from "@/hooks/use-permissions";

const PaymentStatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return "success";
      case 'pending':
        return "outline";
      case 'failed':
        return "destructive";
      case 'refunded':
        return "secondary";
      case 'partial_refund':
        return "warning";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getVariant()}>{status || 'Unknown'}</Badge>
  );
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100); // Convert cents to dollars
};

export default function RegistrationOrdersReport() {
  const { hasPermission } = usePermissions();
  const canViewFinancialReports = hasPermission('view_financial_reports');
  const { toast } = useToast();
  
  // State for filters
  const [selectedEvent, setSelectedEvent] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  
  const queryParams = {
    ...(selectedEvent && { eventId: selectedEvent }),
    ...(paymentStatus && { status: paymentStatus }),
    ...(searchQuery && { search: searchQuery }),
    ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
    ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
  };
  
  // Fetch events for the dropdown
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/events');
      return response.json();
    }
  });
  
  // Fetch registration orders with filters
  const ordersQuery = useQuery({
    queryKey: ['registration-orders', queryParams],
    queryFn: async () => {
      const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
      const response = await apiRequest('GET', `/api/reports/registration-orders?${queryString}`);
      return response.json();
    },
    enabled: canViewFinancialReports
  });
  
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const queryString = new URLSearchParams({
        ...queryParams,
        format: 'csv'
      } as Record<string, string>).toString();
      
      const response = await fetch(`/api/reports/registration-orders?${queryString}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `registration-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Create a blob from the response and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Report has been downloaded as a CSV file.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const clearFilters = () => {
    setSelectedEvent("");
    setPaymentStatus("");
    setSearchQuery("");
    setDateRange(undefined);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canViewFinancialReports) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view financial reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Registration Orders Report</h1>
            <p className="text-muted-foreground">
              View detailed payment information for all team registrations
            </p>
          </div>
          
          <Button
            onClick={handleExportCSV}
            disabled={isExporting || ordersQuery.isLoading || !ordersQuery.data?.transactions?.length}
          >
            {isExporting ? (
              <>Exporting<span className="loading loading-dots ml-1"></span></>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter the report by various parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-1/4">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Events</SelectItem>
                    {eventsQuery.data?.map(event => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/4">
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Payment Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="partial_refund">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/4">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Payment Date Range"
                />
              </div>
              
              <div className="w-full md:w-1/4 flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team, submitter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {ordersQuery.isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : ordersQuery.error ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-destructive">Error loading report data</p>
              </div>
            ) : !ordersQuery.data?.transactions?.length ? (
              <div className="flex flex-col justify-center items-center h-64">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No registration orders found with the selected filters</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Card Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersQuery.data.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.paymentDate)}</TableCell>
                        <TableCell>{transaction.eventName || 'N/A'}</TableCell>
                        <TableCell>{transaction.teamName || 'N/A'}</TableCell>
                        <TableCell>
                          <div>{transaction.submitterName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{transaction.submitterEmail || ''}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.paymentMethodType || 'N/A'}</TableCell>
                        <TableCell>
                          {transaction.cardBrand && transaction.cardLast4 
                            ? `${transaction.cardBrand} **** ${transaction.cardLast4}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={transaction.paymentStatus} />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">
                            {transaction.paymentIntentId 
                              ? transaction.paymentIntentId.substring(0, 12) + '...'
                              : 'N/A'
                            }
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}