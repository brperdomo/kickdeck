import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Ban,
  RefreshCw
} from "lucide-react";

type PaymentMethodDisplayProps = {
  team: any;
  showCardDetails?: boolean;
};

/**
 * Enhanced payment method display component with user-friendly status descriptions
 */
export function PaymentMethodDisplay({ team, showCardDetails = true }: PaymentMethodDisplayProps) {
  const teamData = team.team || team;
  
  // If we have successful payment with card details
  if (teamData.paymentStatus === 'paid' && teamData.cardBrand && teamData.cardLast4 && showCardDetails) {
    const brandName = teamData.cardBrand.charAt(0).toUpperCase() + teamData.cardBrand.slice(1);
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-500/90 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <CreditCard className="w-3 h-3" />
          <span>{brandName} ••••{teamData.cardLast4}</span>
        </div>
      </div>
    );
  }

  // Map raw payment statuses to user-friendly displays
  switch (teamData.paymentStatus) {
    case 'paid':
      return (
        <Badge className="bg-green-500/90 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payment Complete
        </Badge>
      );

    case 'setup_intent_completed':
    case 'payment_info_provided':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-400">
          <CreditCard className="w-3 h-3 mr-1" />
          Card Ready
        </Badge>
      );

    case 'setup_intent_created':
    case 'payment_info_pending':
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-400">
          <Clock className="w-3 h-3 mr-1" />
          Setup Started
        </Badge>
      );

    case 'payment_failed':
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Payment Failed
        </Badge>
      );

    case 'requires_payment_method':
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Card Needed
        </Badge>
      );

    case 'refunded':
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-400">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refunded
        </Badge>
      );

    case 'no_payment_required':
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-400">
          <Ban className="w-3 h-3 mr-1" />
          No Payment
        </Badge>
      );

    case 'pending':
    case 'payment_pending':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-400">
          <Clock className="w-3 h-3 mr-1" />
          Payment Pending
        </Badge>
      );

    default:
      // Handle "pay later" option
      if (teamData.addRosterLater) {
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            <DollarSign className="w-3 h-3 mr-1" />
            Pay Later
          </Badge>
        );
      }
      
      // Default fallback
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          {teamData.paymentStatus || 'Unknown'}
        </Badge>
      );
  }
}

/**
 * Payment Status Legend Component
 */
export function PaymentStatusLegend() {
  const statusItems = [
    {
      badge: <Badge className="bg-green-500/90 text-white"><CheckCircle className="w-3 h-3 mr-1" />Payment Complete</Badge>,
      description: "Payment successfully processed"
    },
    {
      badge: <Badge variant="outline" className="text-blue-600 border-blue-400"><CreditCard className="w-3 h-3 mr-1" />Card Ready</Badge>,
      description: "Payment method saved, ready for approval"
    },
    {
      badge: <Badge variant="outline" className="text-amber-600 border-amber-400"><Clock className="w-3 h-3 mr-1" />Setup Started</Badge>,
      description: "Payment setup in progress, needs completion"
    },
    {
      badge: <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Payment Failed</Badge>,
      description: "Payment processing failed, needs attention"
    },
    {
      badge: <Badge variant="outline" className="text-orange-600 border-orange-400"><AlertCircle className="w-3 h-3 mr-1" />Card Needed</Badge>,
      description: "Team needs to provide payment method"
    },
    {
      badge: <Badge variant="outline" className="text-purple-600 border-purple-400"><RefreshCw className="w-3 h-3 mr-1" />Refunded</Badge>,
      description: "Payment was refunded"
    },
    {
      badge: <Badge variant="outline" className="text-orange-500 border-orange-500"><DollarSign className="w-3 h-3 mr-1" />Pay Later</Badge>,
      description: "Team chose to pay later option"
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Payment Status Guide</h4>
      <div className="space-y-2">
        {statusItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0">{item.badge}</div>
            <span className="text-sm text-muted-foreground">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}