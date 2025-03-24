import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  name: string;
  amount: number;
  description?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  total: number;
  title?: string;
  showDetails?: boolean;
}

export default function OrderSummary({ 
  items, 
  total, 
  title = 'Order Summary',
  showDetails = true
}: OrderSummaryProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Review your registration fees</CardDescription>
      </CardHeader>
      <CardContent>
        {showDetails && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-muted-foreground text-xs">{item.description}</p>
                  )}
                </div>
                <p>${(item.amount / 100).toFixed(2)}</p>
              </div>
            ))}
            <Separator className="my-4" />
          </div>
        )}
        
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </CardContent>
      {!showDetails && (
        <CardFooter className="text-sm text-muted-foreground">
          <p>Registration fee for team participation</p>
        </CardFooter>
      )}
    </Card>
  );
}