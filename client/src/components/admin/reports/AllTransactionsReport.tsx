import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, Filter, Receipt } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AllTransactionsReportProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  eventId: string;
}

export function AllTransactionsReport({ dateRange, eventId }: AllTransactionsReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    cardBrand: '',
    teamSearch: ''
  });
  const limit = 100;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/reports/all-transactions', dateRange, eventId, currentPage, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate.toISOString());
      if (dateRange.endDate) params.append('endDate', dateRange.endDate.toISOString());
      if (eventId) params.append('eventId', eventId);
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.cardBrand) params.append('cardBrand', filters.cardBrand);
      params.append('limit', limit.toString());
      params.append('offset', (currentPage * limit).toString());
      
      return apiRequest('GET', `/api/admin/reports/all-transactions?${params}`).then(res => res.json());
    }
  });

  // Filter transactions by team search on frontend
  const transactions = data?.transactions?.filter((transaction: any) => {
    if (!filters.teamSearch) return true;
    const searchTerm = filters.teamSearch.toLowerCase();
    return (
      transaction.teamName?.toLowerCase().includes(searchTerm) ||
      transaction.clubName?.toLowerCase().includes(searchTerm) ||
      transaction.teamReferenceId?.toLowerCase().includes(searchTerm)
    );
  }) || [];

  const pagination = data?.pagination || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-100 text-blue-800';
      case 'refund':
        return 'bg-orange-100 text-orange-800';
      case 'partial_refund':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">Error loading transactions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All Transactions
          </CardTitle>
          <CardDescription>
            Comprehensive view of all payment transactions with advanced filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search teams..."
                  value={filters.teamSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, teamSearch: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="ach_debit">ACH</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.cardBrand} onValueChange={(value) => setFilters(prev => ({ ...prev, cardBrand: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Card brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cards</SelectItem>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="discover">Discover</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: '', paymentMethod: '', cardBrand: '', teamSearch: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found for the selected criteria
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">MatchPro</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.teamName}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.clubName}
                            </div>
                            {transaction.teamReferenceId && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {transaction.teamReferenceId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={transaction.eventName}>
                            {transaction.eventName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTransactionTypeColor(transaction.transactionType)}>
                            {transaction.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${transaction.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-blue-600">
                            ${transaction.platformFeeAmount?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-green-600">
                            ${transaction.matchproRevenue?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.cardBrand && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.cardBrand.toUpperCase()}
                              </Badge>
                            )}
                            {transaction.cardLastFour && (
                              <span className="text-sm text-muted-foreground">
                                ****{transaction.cardLastFour}
                              </span>
                            )}
                            {transaction.paymentMethodType && (
                              <span className="text-xs text-muted-foreground">
                                ({transaction.paymentMethodType})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono text-muted-foreground">
                            {transaction.paymentIntentId}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, pagination.total)} of {pagination.total} transactions
                  {filters.teamSearch && ` (filtered to ${transactions.length} results)`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}