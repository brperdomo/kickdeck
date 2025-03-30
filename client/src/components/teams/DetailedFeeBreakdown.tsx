import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

// Helper function to format currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100); // Convert cents to dollars
};

interface Fee {
  id: number;
  name: string;
  amount: number;
  feeType: string;
  isRequired: boolean;
}

interface DetailedFeeBreakdownProps {
  teamId: number;
  selectedFeeIds: string;
}

export function DetailedFeeBreakdown({ teamId, selectedFeeIds }: DetailedFeeBreakdownProps) {
  // Don't attempt to fetch if there are no fee IDs
  const shouldFetch = selectedFeeIds && selectedFeeIds.length > 0;
  
  const { data: fees, isLoading, error } = useQuery<Fee[]>({
    queryKey: ['teamFees', teamId, selectedFeeIds],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/teams/${teamId}/fees?selectedFeeIds=${selectedFeeIds}`);
      return response.data;
    },
    enabled: shouldFetch,
  });
  
  if (!shouldFetch) {
    return <p className="text-sm text-slate-500">No fees selected</p>;
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }
  
  if (error) {
    return <p className="text-sm text-red-500">Error loading fees: {error instanceof Error ? error.message : 'Unknown error'}</p>;
  }
  
  if (!fees || fees.length === 0) {
    return <p className="text-sm text-slate-500">No fee details available</p>;
  }
  
  // Group fees by type
  const feesByType: Record<string, Fee[]> = {};
  fees.forEach(fee => {
    const type = fee.feeType || 'Other';
    if (!feesByType[type]) {
      feesByType[type] = [];
    }
    feesByType[type].push(fee);
  });
  
  return (
    <div className="space-y-3">
      {Object.entries(feesByType).map(([type, typeFees]) => (
        <div key={type} className="border-b border-slate-100 pb-2 last:border-0">
          <h5 className="text-sm font-medium text-slate-700 mb-1 capitalize">{type} Fees</h5>
          {typeFees.map(fee => (
            <div key={fee.id} className="flex justify-between text-sm py-1">
              <span className="text-slate-600">
                {fee.name}
                {fee.isRequired && <span className="text-xs text-red-500 ml-1">(Required)</span>}
              </span>
              <span className="font-medium">{formatCurrency(fee.amount)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default DetailedFeeBreakdown;