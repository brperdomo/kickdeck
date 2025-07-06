import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Eye, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';

interface PlatformFeeTransactionsProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  eventId: string;
}

export function PlatformFeeTransactions({ dateRange, eventId }: PlatformFeeTransactionsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/reports/platform-fees/transactions', dateRange, eventId, currentPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate.toISOString());
      if (dateRange.endDate) params.append('endDate', dateRange.endDate.toISOString());
      if (eventId) params.append('eventId', eventId);
      params.append('limit', limit.toString());
      params.append('offset', (currentPage * limit).toString());
      
      return apiRequest('GET', `/api/admin/reports/platform-fees/transactions?${params}`).then(res => res.json());
    }
  });

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

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Platform Fee Transactions
          </CardTitle>
          <CardDescription>
            Detailed breakdown of individual transactions with fee calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">MatchPro Revenue</TableHead>
                      <TableHead className="text-right">Stripe Fee</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.teamName}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.clubName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.eventName}</TableCell>
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
                        <TableCell className="text-right">
                          <span className="font-medium text-orange-600">
                            ${transaction.stripeFee?.toLocaleString()}
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.status === 'succeeded' ? 'default' : 'secondary'}
                            className={transaction.status === 'succeeded' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Transaction Details</DialogTitle>
                                <DialogDescription>
                                  Comprehensive breakdown of transaction fees and metadata
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedTransaction && (
                                <div className="space-y-6">
                                  {/* Basic Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Payment Intent ID</label>
                                      <p className="font-mono text-sm">{selectedTransaction.paymentIntentId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Transaction Date</label>
                                      <p>{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                                    </div>
                                  </div>

                                  {/* Team & Event Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Team</label>
                                      <p>{selectedTransaction.teamName}</p>
                                      <p className="text-sm text-muted-foreground">{selectedTransaction.clubName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Event</label>
                                      <p>{selectedTransaction.eventName}</p>
                                    </div>
                                  </div>

                                  {/* Fee Breakdown */}
                                  <div className="border rounded-lg p-4">
                                    <h4 className="font-semibold mb-3">Fee Breakdown</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span>Total Amount</span>
                                        <span className="font-medium">${selectedTransaction.amount?.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-green-600">
                                        <span>MatchPro Revenue (1.1%)</span>
                                        <span className="font-medium">${selectedTransaction.matchproRevenue?.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-orange-600">
                                        <span>Stripe Fee (2.9% + $0.30)</span>
                                        <span className="font-medium">${selectedTransaction.stripeFee?.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-blue-600">
                                        <span>Total Platform Fee</span>
                                        <span className="font-medium">${selectedTransaction.platformFeeAmount?.toLocaleString()}</span>
                                      </div>
                                      <div className="border-t pt-2 flex justify-between text-purple-600">
                                        <span>Tournament Net</span>
                                        <span className="font-medium">${selectedTransaction.netAmount?.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Payment Method Info */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Card Brand</label>
                                      <p>{selectedTransaction.cardBrand || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Last 4 Digits</label>
                                      <p>{selectedTransaction.cardLastFour ? `****${selectedTransaction.cardLastFour}` : 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Payment Type</label>
                                      <p>{selectedTransaction.paymentMethodType || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {/* Fee Percentages */}
                                  {selectedTransaction.feeBreakdown && (
                                    <div className="border rounded-lg p-4">
                                      <h4 className="font-semibold mb-3">Fee Percentages</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Platform Fee Rate</span>
                                          <div className="font-medium">{selectedTransaction.feeBreakdown.platformFeePercentage}%</div>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">MatchPro Rate</span>
                                          <div className="font-medium">{selectedTransaction.feeBreakdown.matchproPercentage}%</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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