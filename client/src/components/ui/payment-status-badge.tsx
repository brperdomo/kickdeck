import { CheckCircle, Clock, XCircle, CreditCard, AlertCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PaymentStatusBadgeProps = {
  status: string | undefined | null;
  hasPaymentInfo?: boolean;
  payLater?: boolean;
};

/**
 * A consistent badge component for displaying payment status
 * This ensures payment status display is uniform across all views
 */
export function PaymentStatusBadge({ status, hasPaymentInfo, payLater }: PaymentStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500"><RotateCcw className="w-3 h-3 mr-1" /> Refunded</Badge>;
    case 'partially_refunded':
      return <Badge className="bg-purple-400"><RotateCcw className="w-3 h-3 mr-1" /> Partially Refunded</Badge>;
    case 'failed':
      return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Payment Failed</Badge>;
    case 'payment_info_provided':
      return <Badge variant="outline" className="text-blue-600 border-blue-400 whitespace-nowrap font-medium">
        <CreditCard className="w-3 h-3 mr-1" /> Card on File
      </Badge>;
    case 'pending':
    default:
      if (hasPaymentInfo) {
        return <Badge variant="outline" className="text-blue-600 border-blue-400 whitespace-nowrap font-medium">
          <CreditCard className="w-3 h-3 mr-1" /> Card on File
        </Badge>;
      }
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> Payment Pending</Badge>;
  }
}

type TeamStatusBadgeProps = {
  status: string | undefined | null;
  payLater?: boolean;
  setupIntentId?: string | null;
  hasPaymentMethod?: boolean;
};

/**
 * A consistent badge component for displaying team status
 * This ensures team status display is uniform across all views
 */
export function TeamStatusBadge({ 
  status, 
  payLater = false, 
  setupIntentId = null,
  hasPaymentMethod = false 
}: TeamStatusBadgeProps) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    case 'withdrawn':
      return <Badge className="bg-slate-500"><XCircle className="w-3 h-3 mr-1" /> Withdrawn</Badge>;
    case 'waitlisted':
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> Waitlisted</Badge>;
    case 'registered':
    case 'pending_payment':
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500"><RotateCcw className="w-3 h-3 mr-1" /> Refunded</Badge>;
    default:
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
  }
}