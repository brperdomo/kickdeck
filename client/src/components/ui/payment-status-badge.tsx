import { CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PaymentStatusBadgeProps = {
  status: string | undefined | null;
};

/**
 * A consistent badge component for displaying payment status
 * This ensures payment status display is uniform across all views
 */
export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500"><CreditCard className="w-3 h-3 mr-1" /> Refunded</Badge>;
    case 'failed':
      return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Payment Failed</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> Payment Pending</Badge>;
  }
}

/**
 * A consistent badge component for displaying team status
 * This ensures team status display is uniform across all views
 */
export function TeamStatusBadge({ status }: { status: string | undefined | null }) {
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
    default:
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending Approval</Badge>;
  }
}