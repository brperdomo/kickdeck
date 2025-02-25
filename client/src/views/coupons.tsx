import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CouponManagement as AdminCouponManagement } from "@/components/admin/CouponManagement";

export function CouponManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coupons</h2>
      </div>
      <AdminCouponManagement />
    </div>
  );
}