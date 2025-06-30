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
  RefreshCw, 
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Filter,
  ExternalLink,
  Eye
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatTimestamp } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";

// Transaction detail dialog component
function TransactionDetailDialog({ transaction }: { transaction: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Transaction Details</DialogTitle>
          <DialogDescription>
            Complete information for transaction #{transaction.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-medium mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Transaction ID:</span>
                <p>{transaction.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Payment Intent:</span>
                <p className="font-mono text-xs">{transaction.paymentIntentId || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Setup Intent:</span>
                <p className="font-mono text-xs">{transaction.setupIntentId || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <p>{getStatusBadge(transaction.status)}</p>
              </div>
            </div>
          </div>

          {/* Team & Event Information */}
          <div>
            <h3 className="font-medium mb-3">Team & Event</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Team:</span>
                <p>{transaction.teamName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Event:</span>
                <p>{transaction.eventName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Age Group:</span>
                <p>{transaction.ageGroup || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Club:</span>
                <p>{transaction.clubName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="font-medium mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Total Charged:</span>
                <p className="font-mono">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Stripe Processing Fee:</span>
                <p className="font-mono">{formatCurrency(transaction.stripeFee || 0)}</p>
                <p className="text-xs text-gray-400 mt-1">2.9% + $0.30 processing fee</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Net Amount:</span>
                <p className="font-mono">{formatCurrency(transaction.netAmount || transaction.amount)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Payment Method:</span>
                <p>{transaction.paymentMethodType || 'N/A'}</p>
              </div>
            </div>
            
            {/* Fee Structure Explanation */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-900 mb-2">MatchPro 4% Platform Fee Structure</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• <strong>Stripe Processing:</strong> 2.9% + $0.30 (shown above)</div>
                <div>• <strong>MatchPro Revenue:</strong> 1.1% (approximately)</div>
                <div>• <strong>Total Platform Fee:</strong> 4% covers all processing and platform costs</div>
              </div>
            </div>
          </div>

          {/* Card Information */}
          {(transaction.cardBrand || transaction.cardLastFour) && (
            <div>
              <h3 className="font-medium mb-3">Card Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Card Brand:</span>
                  <p>{transaction.cardBrand}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Last Four:</span>
                  <p>****{transaction.cardLastFour}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Information */}
          {(transaction.errorCode || transaction.errorMessage) && (
            <div>
              <h3 className="font-medium mb-3">Error Details</h3>
              <div className="space-y-2">
                {transaction.errorCode && (
                  <div>
                    <span className="font-medium text-gray-500">Error Code:</span>
                    <p className="font-mono text-red-600">{transaction.errorCode}</p>
                  </div>
                )}
                {transaction.errorMessage && (
                  <div>
                    <span className="font-medium text-gray-500">Error Message:</span>
                    <p className="text-red-600">{transaction.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(transaction.managerName || transaction.managerEmail) && (
            <div>
              <h3 className="font-medium mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Manager:</span>
                  <p>{transaction.managerName || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Email:</span>
                  <p>{transaction.managerEmail || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Phone:</span>
                  <p>{transaction.managerPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Timestamps */}
          <div>
            <h3 className="font-medium mb-3">Payment Timeline</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Payment Processed:</span>
                <p>{transaction.paymentProcessedAt ? formatTimestamp(transaction.paymentProcessedAt) : (transaction.createdAt ? formatTimestamp(transaction.createdAt) : 'N/A')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Updated:</span>
                <p>{transaction.updatedAt ? formatTimestamp(transaction.updatedAt) : 'N/A'}</p>
              </div>
              {transaction.approvedTime && (
                <div>
                  <span className="font-medium text-gray-500">Team Approved:</span>
                  <p>{transaction.approvedTime}</p>
                </div>
              )}
              {transaction.settlementDate && (
                <div>
                  <span className="font-medium text-gray-500">Settlement:</span>
                  <p>{formatDate(transaction.settlementDate)}</p>
                </div>
              )}
              {transaction.refundedAt && (
                <div>
                  <span className="font-medium text-gray-500">Refunded:</span>
                  <p>{formatDate(transaction.refundedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approver Information */}
          {transaction.approvedBy && (
            <div>
              <h3 className="font-medium mb-3">Team Approval Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Approved by:</span>
                  <p>{transaction.approvedBy}</p>
                </div>
                {transaction.approvedTime && (
                  <div>
                    <span className="font-medium text-gray-500">Approval time:</span>
                    <p>{transaction.approvedTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stripe Links */}
          <div>
            <h3 className="font-medium mb-3">Stripe Dashboard</h3>
            <div className="space-y-2">
              {transaction.paymentIntentId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.paymentIntentId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Payment Intent
                </Button>
              )}
              {transaction.setupIntentId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(`https://dashboard.stripe.com/setup_intents/${transaction.setupIntentId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Setup Intent
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Get status badge for payment status
function getStatusBadge(status: string) {
  switch (status) {
    case 'succeeded':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Succeeded</Badge>;
    case 'failed':
      return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500"><CreditCard className="w-3 h-3 mr-1" /> Refunded</Badge>;
    default:
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
  }
}

export default function PaymentLogs() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCompleteOnly, setShowCompleteOnly] = useState<boolean>(true); // Default to show real transactions only

  // Query payment transactions
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['paymentLogs', statusFilter, typeFilter, searchQuery, showCompleteOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (showCompleteOnly) params.append('completeOnly', 'true');
      
      console.log('Frontend query params:', { statusFilter, typeFilter, searchQuery, showCompleteOnly });
      console.log('URL params string:', params.toString());
      
      const response = await fetch(`/api/admin/payment-logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment logs');
      }
      return response.json();
    },
  });

  const transactions = data?.transactions || [];
  const summary = data?.summary || {};

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (showCompleteOnly) params.append('completeOnly', 'true');
      params.append('format', 'csv');
      
      const response = await fetch(`/api/admin/payment-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Payment logs have been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the payment logs.",
        variant: "destructive",
      });
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Payment Logs</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Logs</h1>
            <p className="text-gray-600">Monitor all payment transactions and failures</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.successfulTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.failedTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Team name, email, payment ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="setup">Setup Intent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="completeOnly">Complete Data Only</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="completeOnly"
                  checked={showCompleteOnly}
                  onCheckedChange={setShowCompleteOnly}
                />
                <span className="text-sm text-gray-600">
                  Show only transactions with team/event info
                </span>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setShowCompleteOnly(true); // Reset to default
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            Detailed log of all payment activities including failures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payment transactions found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Processed</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.paymentProcessedAt ? formatTimestamp(transaction.paymentProcessedAt) : (transaction.createdAt ? formatTimestamp(transaction.createdAt) : 'N/A')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(transaction.paymentProcessedAt || transaction.createdAt) ? 
                            (() => {
                              try {
                                return formatDistanceToNow(new Date(transaction.paymentProcessedAt || transaction.createdAt), { addSuffix: true });
                              } catch (e) {
                                return 'Invalid date';
                              }
                            })() : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.teamName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{transaction.managerName}</div>
                      </TableCell>
                      <TableCell>
                        <div>{transaction.eventName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{transaction.ageGroup}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.approvedBy || 'N/A'}
                        </div>
                        {transaction.approvedTime && (
                          <div className="text-xs text-gray-500">
                            {transaction.approvedTime}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-medium">
                          {formatCurrency(transaction.amount)}
                        </div>
                        {transaction.stripeFee && (
                          <div className="text-xs text-gray-500">
                            Fee: {formatCurrency(transaction.stripeFee)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div>{transaction.paymentMethodType || 'N/A'}</div>
                        {transaction.cardBrand && transaction.cardLastFour && (
                          <div className="text-sm text-gray-500">
                            {transaction.cardBrand} ****{transaction.cardLastFour}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.errorCode ? (
                          <div className="text-sm">
                            <div className="font-mono text-red-600">{transaction.errorCode}</div>
                            {transaction.errorMessage && (
                              <div className="text-xs text-red-500 mt-1 max-w-32 truncate" title={transaction.errorMessage}>
                                {transaction.errorMessage}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TransactionDetailDialog transaction={transaction} />
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
  );
}