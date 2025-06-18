import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Fee {
  id: number;
  name: string;
  amount: number;
  feeType: string;
  isRequired: boolean;
}

interface DetailedFeeBreakdownProps {
  teamId: number;
  selectedFeeIds?: string | null;
  totalAmount?: number;
  appliedCoupon?: string | null;
}

export function DetailedFeeBreakdown({ teamId, selectedFeeIds, totalAmount, appliedCoupon }: DetailedFeeBreakdownProps) {
  // Fetch detailed fee information for the selected team
  const feesQuery = useQuery({
    queryKey: ['/api/admin/teams', teamId, 'fees', selectedFeeIds],
    queryFn: async () => {
      // Don't make the API call if we don't have the necessary data
      if (!teamId || !selectedFeeIds) {
        return [];
      }
      
      console.log(`Fetching fees for team ${teamId} with fee IDs ${selectedFeeIds}`);
      const response = await fetch(`/api/admin/teams/${teamId}/fees?selectedFeeIds=${selectedFeeIds}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fee details');
      }
      const data = await response.json() as Fee[];
      console.log('Received fee data from server:', data);
      return data;
    },
    enabled: !!teamId && !!selectedFeeIds && selectedFeeIds !== ''
  });

  // Group fees by type for better organization
  const groupedFees = useMemo(() => {
    if (!feesQuery.data || feesQuery.data.length === 0) {
      return {};
    }

    const groups: Record<string, Fee[]> = {};
    
    feesQuery.data.forEach((fee) => {
      const type = fee.feeType || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(fee);
    });
    
    return groups;
  }, [feesQuery.data]);

  // Calculate the subtotal of all fees before discounts
  const feesSubtotal = useMemo(() => {
    if (!feesQuery.data || feesQuery.data.length === 0) {
      return 0;
    }
    
    return feesQuery.data.reduce((sum, fee) => sum + fee.amount, 0);
  }, [feesQuery.data]);

  // Calculate discount information
  const discountInfo = useMemo(() => {
    if (!totalAmount || !feesSubtotal || totalAmount >= feesSubtotal) {
      return null;
    }
    
    const discountAmount = feesSubtotal - totalAmount;
    const discountPercentage = Math.round((discountAmount / feesSubtotal) * 100);
    
    return {
      amount: discountAmount,
      percentage: discountPercentage,
      code: appliedCoupon || 'Discount Applied'
    };
  }, [feesSubtotal, totalAmount, appliedCoupon]);

  // Get formatted fee types for better display
  const formatFeeType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'registration':
        return 'Registration Fees';
      case 'uniform':
        return 'Uniform Fees';
      case 'equipment':
        return 'Equipment Fees';
      case 'tournament':
        return 'Tournament Fees';
      case 'other':
      default:
        return 'Other Fees';
    }
  };

  // Show a loading state while fetching data
  if (feesQuery.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Fee Breakdown</CardTitle>
          <CardDescription>Loading fee details...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show an error state if the query failed
  if (feesQuery.isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Fee Breakdown</CardTitle>
          <CardDescription className="text-red-500">
            Error loading fee details: {feesQuery.error instanceof Error ? feesQuery.error.message : 'Unknown error'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show an empty state if no fees were found
  if (!feesQuery.data || feesQuery.data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Fee Breakdown</CardTitle>
          <CardDescription>No fee details available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No fees were found for this team.</p>
        </CardContent>
      </Card>
    );
  }

  // Main component when data is available
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Fee Breakdown</CardTitle>
        <CardDescription>Detailed breakdown of fees for this team</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedFees).map(([feeType, fees]) => (
          <div key={feeType} className="mb-4">
            <h3 className="text-md font-medium mb-2">{formatFeeType(feeType)}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Description</TableHead>
                  <TableHead className="w-24 text-right">Amount</TableHead>
                  <TableHead className="w-28 text-center">Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(fee.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {fee.isRequired ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100">
                          Optional
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Total Amount</h3>
            <span className="text-lg font-semibold">{formatCurrency(feesSubtotal)}</span>
          </div>
          
          {/* Show discount information if applicable */}
          {discountInfo && (
            <>
              <div className="flex justify-between items-center mt-2 text-green-600">
                <span className="text-sm">
                  {discountInfo.code} ({discountInfo.percentage}% off)
                </span>
                <span className="text-sm font-medium">
                  -{formatCurrency(discountInfo.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-green-200">
                <h3 className="text-lg font-bold text-green-700">Final Total</h3>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}