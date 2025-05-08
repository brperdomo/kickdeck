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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Search,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

// Get the payment status badge variant
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'succeeded':
      return { variant: 'success' as const, label: 'Succeeded' };
    case 'pending':
      return { variant: 'outline' as const, label: 'Pending' };
    case 'failed':
      return { variant: 'destructive' as const, label: 'Failed' };
    case 'refunded':
      return { variant: 'secondary' as const, label: 'Refunded' };
    default:
      return { variant: 'outline' as const, label: status.charAt(0).toUpperCase() + status.slice(1) };
  }
};

export default function RegistrationOrdersReport() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Query registration orders data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['registrationOrdersReport'],
    queryFn: async () => {
      const response = await fetch('/api/reports/registration-orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch registration orders report');
      }
      return response.json();
    },
  });
  
  const transactions = data?.transactions || [];

  // Apply filters
  const filteredTransactions = transactions.filter((transaction: any) => {
    // Text search
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const searchFields = [
      transaction.team_name || '',
      transaction.event_name || '',
      transaction.manager_name || '',
      transaction.manager_email || '',
      transaction.age_group || '',
      transaction.payment_method || '',
      transaction.status || '',
      transaction.payment_intent_id || '',
      transaction.club_name || ''
    ].map(field => field.toLowerCase());
    
    const matchesSearch = searchTerms.every(term => 
      searchFields.some(field => field.includes(term))
    );
    
    // Status filter
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    
    // Payment method filter
    const matchesPaymentMethod = !paymentMethodFilter || transaction.payment_method === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  // Get unique payment methods and statuses for filters
  const statusMap: Record<string, boolean> = {};
  const paymentMethodMap: Record<string, boolean> = {};
  
  transactions.forEach((t: any) => {
    if (t.status) statusMap[t.status] = true;
    if (t.payment_method) paymentMethodMap[t.payment_method] = true;
  });
  
  const uniqueStatuses = Object.keys(statusMap);
  const uniquePaymentMethods = Object.keys(paymentMethodMap);

  // Handle export function
  const handleExport = () => {
    if (!transactions.length) return;
    
    try {
      // Define CSV headers
      const headers = [
        "Transaction ID", 
        "Amount", 
        "Status", 
        "Payment Method", 
        "Date", 
        "Team Name",
        "Manager Name",
        "Manager Email",
        "Event Name",
        "Age Group",
        "Stripe Payment ID",
        "Refunded At"
      ];
      
      // Create CSV rows
      const rows = filteredTransactions.map((transaction: any) => [
        transaction.id,
        formatCurrency(transaction.amount),
        transaction.status,
        transaction.payment_method,
        new Date(transaction.created_at).toLocaleString(),
        transaction.team_name || 'N/A',
        transaction.manager_name || 'N/A',
        transaction.manager_email || 'N/A',
        transaction.event_name || 'N/A',
        transaction.age_group || 'N/A',
        transaction.payment_intent_id || 'N/A',
        transaction.refunded_at ? new Date(transaction.refunded_at).toLocaleString() : 'N/A'
      ]);
      
      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.map((cell: string | number) => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(","))
      ].join("\n");
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `registration-orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Registration orders report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the registration orders report",
        variant: "destructive",
      });
    }
  };

  // View transaction details
  const viewTransactionDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
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
            <p className="text-muted-foreground text-lg">Loading registration orders...</p>
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
            {error instanceof Error ? error.message : 'Failed to load registration orders report. Please try again.'}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/financial-overview-report')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="text-2xl font-bold mb-1">Registration Orders Report</h1>
          <p className="text-muted-foreground">
            Complete list of all registration transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Transactions</SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down transaction results
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Transaction Status</Label>
                  <Select 
                    value={statusFilter || ''} 
                    onValueChange={(value) => setStatusFilter(value || null)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {uniqueStatuses.map((status: string) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select 
                    value={paymentMethodFilter || ''} 
                    onValueChange={(value) => setPaymentMethodFilter(value || null)}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Payment Methods</SelectItem>
                      {uniquePaymentMethods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    onClick={() => {
                      setStatusFilter(null);
                      setPaymentMethodFilter(null);
                    }}
                    variant="outline"
                  >
                    Reset Filters
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by team, manager, event..."
          className="pl-10 w-full md:max-w-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Total Transactions</span>
              <span className="text-2xl font-bold">{transactions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Successful Payments</span>
              <span className="text-2xl font-bold">
                {transactions.filter((t: any) => t.status === 'succeeded').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Refunded Payments</span>
              <span className="text-2xl font-bold">
                {transactions.filter((t: any) => t.refunded_at).length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Total Revenue</span>
              <span className="text-2xl font-bold">
                {formatCurrency(
                  transactions
                    .filter((t: any) => t.status === 'succeeded' && !t.refunded_at)
                    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Orders</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: any) => {
                    const statusBadge = getStatusBadge(transaction.status);
                    const isRefunded = !!transaction.refunded_at;
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{transaction.team_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {transaction.manager_name || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{transaction.event_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">
                              {transaction.age_group || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="whitespace-nowrap">
                              {formatDate(transaction.created_at, { 
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.amount)}
                          {isRefunded && (
                            <span className="text-xs text-muted-foreground block">
                              Refunded {formatDate(transaction.refunded_at, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="capitalize">
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{transaction.payment_method || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => viewTransactionDetails(transaction)}>
                                  View Details
                                </DropdownMenuItem>
                                {transaction.stripe_receipt_url && (
                                  <DropdownMenuItem 
                                    onClick={() => window.open(transaction.stripe_receipt_url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Stripe Receipt
                                  </DropdownMenuItem>
                                )}
                                {transaction.event_id && (
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/event-financial-report/${transaction.event_id}`)}
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Event Financials
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No transactions found</h3>
              <p className="text-muted-foreground mt-2">
                Try changing your filters or search query
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Transaction Details</SheetTitle>
              <SheetDescription>
                Complete information about this registration payment
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Transaction Info</h3>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="text-sm font-medium">ID</div>
                    <div className="text-sm">{selectedTransaction.id}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Amount</div>
                    <div className="text-sm">{formatCurrency(selectedTransaction.amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-sm">
                      <Badge variant={getStatusBadge(selectedTransaction.status).variant} className="capitalize">
                        {getStatusBadge(selectedTransaction.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Payment Method</div>
                    <div className="text-sm capitalize">{selectedTransaction.payment_method || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Date</div>
                    <div className="text-sm">{formatDate(selectedTransaction.created_at, { 
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                  {selectedTransaction.refunded_at && (
                    <div>
                      <div className="text-sm font-medium">Refunded</div>
                      <div className="text-sm">{formatDate(selectedTransaction.refunded_at, { 
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</div>
                    </div>
                  )}
                  {selectedTransaction.payment_intent_id && (
                    <div className="col-span-2">
                      <div className="text-sm font-medium">Stripe ID</div>
                      <div className="text-sm font-mono text-xs">{selectedTransaction.payment_intent_id}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Team Info</h3>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Team Name</div>
                    <div className="text-sm">{selectedTransaction.team_name || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Club</div>
                    <div className="text-sm">{selectedTransaction.club_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Manager</div>
                    <div className="text-sm">{selectedTransaction.manager_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm">{selectedTransaction.manager_email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <div className="text-sm">{selectedTransaction.manager_phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Event Info</h3>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Event Name</div>
                    <div className="text-sm">{selectedTransaction.event_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Age Group</div>
                    <div className="text-sm">{selectedTransaction.age_group || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Event ID</div>
                    <div className="text-sm">{selectedTransaction.event_id || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {selectedTransaction.payment_method_details && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedTransaction.payment_method_details.card && (
                      <>
                        <div>
                          <div className="text-sm font-medium">Card Type</div>
                          <div className="text-sm capitalize">
                            {selectedTransaction.payment_method_details.card.brand || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Last 4</div>
                          <div className="text-sm">
                            ••••{selectedTransaction.payment_method_details.card.last4 || '****'}
                          </div>
                        </div>
                        {selectedTransaction.payment_method_details.card.exp_month && (
                          <div>
                            <div className="text-sm font-medium">Expires</div>
                            <div className="text-sm">
                              {selectedTransaction.payment_method_details.card.exp_month}/
                              {selectedTransaction.payment_method_details.card.exp_year}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedTransaction.accounting_code && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Accounting</h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-sm font-medium">Code</div>
                      <div className="text-sm">{selectedTransaction.accounting_code}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <SheetFooter>
              {selectedTransaction.stripe_receipt_url && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(selectedTransaction.stripe_receipt_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              )}
              {selectedTransaction.event_id && (
                <Button 
                  onClick={() => {
                    navigate(`/event-financial-report/${selectedTransaction.event_id}`);
                    setSelectedTransaction(null);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Event Financials
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}