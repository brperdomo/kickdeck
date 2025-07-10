/**
 * Fee Adjustment Dialog Component
 * 
 * Provides interface for adjusting team registration fees with audit logging.
 * Business rules: Only downward adjustments allowed before team approval.
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  Badge,
} from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, History, AlertTriangle, Check, X } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  status: string;
  totalAmount?: number;
  registrationFee?: number;
  paymentStatus?: string;
  eventId: string;
}

interface FeeAdjustment {
  id: number;
  originalAmount: number;
  adjustedAmount: number;
  adjustment: number;
  reason: string;
  adjustedAt: string;
  adminEmail: string;
}

interface FeeAdjustmentDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeeAdjustmentDialog({ team, open, onOpenChange }: FeeAdjustmentDialogProps) {
  const [adjustedAmount, setAdjustedAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current amount (cents)
  const currentAmount = team?.totalAmount || team?.registrationFee || 0;
  const currentAmountDollars = currentAmount / 100;

  // Fetch adjustment history
  const { data: adjustmentHistory } = useQuery({
    queryKey: ['fee-adjustments', team?.id],
    queryFn: async () => {
      if (!team?.id) return { adjustments: [] };
      const response = await fetch(`/api/admin/teams/${team.id}/fee-adjustments`);
      if (!response.ok) throw new Error('Failed to fetch adjustment history');
      return response.json();
    },
    enabled: !!team?.id && open,
  });

  // Mutation for fee adjustment
  const adjustFeeMutation = useMutation({
    mutationFn: async ({ teamId, adjustedAmount, reason }: { teamId: number; adjustedAmount: number; reason: string }) => {
      const response = await fetch(`/api/admin/teams/${teamId}/adjust-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustedAmount: Math.round(adjustedAmount * 100), // Convert to cents
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust fee');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Fee Adjusted Successfully',
        description: `${team?.name} fee adjusted to ${formatCurrency(data.adjustment.adjustedAmount)}`,
      });
      
      // Reset form
      setAdjustedAmount('');
      setReason('');
      setError('');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['fee-adjustments', team?.id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', team?.id] });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Fee Adjustment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!team) return;

    const adjustedAmountNumber = parseFloat(adjustedAmount);
    
    // Validate inputs
    if (isNaN(adjustedAmountNumber) || adjustedAmountNumber < 0) {
      setError('Please enter a valid amount (cannot be negative)');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    // Business rule: Only allow reductions
    if (adjustedAmountNumber > currentAmountDollars) {
      setError(`Amount cannot exceed current fee of ${formatCurrency(currentAmount)}`);
      return;
    }

    // Business rule: No adjustments after approval and payment
    if (team.status === 'approved' && team.paymentStatus === 'paid') {
      setError('Cannot adjust fees for teams that have been approved and paid');
      return;
    }

    adjustFeeMutation.mutate({
      teamId: team.id,
      adjustedAmount: adjustedAmountNumber,
      reason: reason.trim(),
    });
  };

  const handleClose = () => {
    setAdjustedAmount('');
    setReason('');
    setError('');
    onOpenChange(false);
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Adjust Registration Fee - {team.name}
          </DialogTitle>
          <DialogDescription>
            Modify the registration fee for this team. Only reductions are permitted before approval and payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current fee information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Current Fee</Label>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentAmount)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Team Status</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant={team.status === 'approved' ? 'default' : 'secondary'}>
                    {team.status?.toUpperCase() || 'REGISTERED'}
                  </Badge>
                  {team.paymentStatus && (
                    <Badge variant={team.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                      {team.paymentStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business rules warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Fee adjustments are only allowed for reductions (downward). 
              Teams that have been approved and paid cannot have their fees adjusted.
            </AlertDescription>
          </Alert>

          {/* Adjustment form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustedAmount">New Fee Amount ($)</Label>
              <Input
                id="adjustedAmount"
                type="number"
                step="0.01"
                min="0"
                max={currentAmountDollars}
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(e.target.value)}
                placeholder={`Enter amount (max: $${currentAmountDollars.toFixed(2)})`}
                disabled={adjustFeeMutation.isPending}
              />
              {adjustedAmount && !isNaN(parseFloat(adjustedAmount)) && (
                <div className="text-sm text-muted-foreground">
                  Adjustment: {formatCurrency((parseFloat(adjustedAmount) - currentAmountDollars) * 100)} 
                  {parseFloat(adjustedAmount) < currentAmountDollars && (
                    <span className="text-green-600 ml-1">(Reduction)</span>
                  )}
                  {parseFloat(adjustedAmount) > currentAmountDollars && (
                    <span className="text-red-600 ml-1">(Increase - Not Allowed)</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for this fee adjustment..."
                rows={3}
                disabled={adjustFeeMutation.isPending}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={adjustFeeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  adjustFeeMutation.isPending ||
                  !adjustedAmount ||
                  !reason.trim() ||
                  isNaN(parseFloat(adjustedAmount)) ||
                  parseFloat(adjustedAmount) > currentAmountDollars
                }
              >
                {adjustFeeMutation.isPending ? 'Adjusting...' : 'Apply Adjustment'}
              </Button>
            </DialogFooter>
          </form>

          {/* Adjustment history */}
          {adjustmentHistory && adjustmentHistory.adjustments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <Label className="font-medium">Adjustment History</Label>
              </div>
              
              <ScrollArea className="h-40 border rounded-md p-3">
                <div className="space-y-3">
                  {adjustmentHistory.adjustments.map((adjustment: FeeAdjustment) => (
                    <div key={adjustment.id} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(adjustment.originalAmount)} → {formatCurrency(adjustment.adjustedAmount)}
                            <span className={`ml-2 text-sm ${
                              adjustment.adjustment < 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({adjustment.adjustment < 0 ? '' : '+'}{formatCurrency(adjustment.adjustment)})
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {adjustment.reason}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{new Date(adjustment.adjustedAt).toLocaleDateString()}</div>
                          <div>{adjustment.adminEmail}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}