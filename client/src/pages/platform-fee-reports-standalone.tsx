import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PlatformFeeReports } from "@/components/admin/reports/PlatformFeeReports";

export default function PlatformFeeReportsStandalone() {
  const userQuery = useQuery({
    queryKey: ["/api/user"],
    queryFn: () => apiRequest("GET", "/api/user"),
  });

  if (userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userQuery.isError || !userQuery.data?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access Platform Fee Reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Platform Fee Reports</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive breakdown of platform fees, Stripe charges, and MatchPro revenue
        </p>
      </div>
      <PlatformFeeReports />
    </div>
  );
}