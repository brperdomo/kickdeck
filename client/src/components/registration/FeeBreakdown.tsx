import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, CreditCard, DollarSign } from "lucide-react";

interface FeeBreakdownProps {
  tournamentCost: number; // in cents
  selectedFeeName?: string;
  requiredFees?: { name: string; amount: number }[];
  appliedCoupon?: {
    code: string;
    discountType: 'fixed' | 'percentage';
    amount: number;
  };
}

export function FeeBreakdown({
  tournamentCost,
  selectedFeeName = "Registration Fee",
  requiredFees = [],
  appliedCoupon
}: FeeBreakdownProps) {
  // Platform fee calculation (matches server logic)
  const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4%
  const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
  const STRIPE_FIXED_FEE = 30; // $0.30 in cents

  // Calculate the total amount needed to cover tournament cost + fees
  const kickdeckTargetMargin = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE);
  const totalChargedAmount = Math.round((tournamentCost + kickdeckTargetMargin + STRIPE_FIXED_FEE) / (1 - STRIPE_PERCENTAGE_FEE));
  const platformFeeAmount = totalChargedAmount - tournamentCost;
  const stripeFeeAmount = Math.round(totalChargedAmount * STRIPE_PERCENTAGE_FEE) + STRIPE_FIXED_FEE;

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Card className="rounded-xl" style={{
      background: 'rgba(15, 15, 35, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-300">
          <Calculator className="h-5 w-5" />
          Payment Amount Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tournament Cost */}
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="font-medium text-gray-200">Tournament Registration</span>
            </div>
            <span className="font-semibold text-green-400">
              {formatCurrency(tournamentCost)}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {selectedFeeName}
            {requiredFees.length > 0 && ` + ${requiredFees.length} required fee${requiredFees.length > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Required Fees Breakdown (if any) */}
        {requiredFees.length > 0 && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-sm font-medium text-gray-200 mb-2">Additional Required Fees:</div>
            {requiredFees.map((fee, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{fee.name}</span>
                <span className="font-medium text-gray-200">{formatCurrency(fee.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Coupon Discount (if applied) */}
        {appliedCoupon && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-400">Coupon Applied: {appliedCoupon.code}</span>
              </div>
              <span className="font-semibold text-green-400">
                -{appliedCoupon.discountType === 'percentage'
                  ? `${appliedCoupon.amount}%`
                  : formatCurrency(appliedCoupon.amount * 100)
                }
              </span>
            </div>
          </div>
        )}

        {/* Platform Fee */}
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-orange-400">Platform & Processing Fee</span>
              <div className="text-xs text-orange-400/80 mt-1">
                Includes payment processing and platform services (4%)
              </div>
            </div>
            <span className="font-semibold text-orange-400">
              {formatCurrency(platformFeeAmount)}
            </span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-blue-600 text-white p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-lg font-semibold">Total Amount to be Charged</span>
            </div>
            <span className="text-xl font-bold">
              {formatCurrency(totalChargedAmount)}
            </span>
          </div>
          <div className="text-blue-100 text-sm mt-2">
            Your card will be charged this amount when your team is approved
          </div>
        </div>

        {/* Fee Explanation */}
        <div className="p-3 rounded-lg text-xs text-gray-400" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="font-medium mb-1 text-gray-300">How fees work:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Tournament registration fee goes directly to the tournament organizer</li>
            <li>Platform fee covers payment processing, customer support, and platform services</li>
            <li>No additional charges - this is the final amount</li>
            <li>Secure payment processing via Stripe</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
