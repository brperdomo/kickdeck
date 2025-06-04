import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProductUpdates } from "../components/ProductUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface RecentProductUpdatesProps {
  limit?: number;
  showViewAll?: boolean;
}

export function RecentProductUpdates({ limit = 3, showViewAll = true }: RecentProductUpdatesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Product Updates</CardTitle>
          {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/product-updates">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ProductUpdates limit={limit} onlyHighlighted={true} />
      </CardContent>
    </Card>
  );
}