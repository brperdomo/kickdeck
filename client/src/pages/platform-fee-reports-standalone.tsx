import { PlatformFeeReports } from "@/components/admin/reports/PlatformFeeReports";

export default function PlatformFeeReportsStandalone() {
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