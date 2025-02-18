import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CouponModal } from "@/components/CouponModal";
import type { SelectCoupon } from "@db/schema";

export function CouponManagement() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<SelectCoupon | null>(null);
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const eventId = location?.split('/')[2] || '';

  const couponsQuery = useQuery({
    queryKey: ['/api/admin/coupons', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/coupons?eventId=${eventId}`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch coupons');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching coupons:', error);
        throw error;
      }
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: number) => {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete coupon');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons', eventId] });
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditCoupon = (coupon: SelectCoupon) => {
    setSelectedCoupon(coupon);
    setIsAddModalOpen(true);
  };

  const handleDeleteCoupon = async (couponId: number) => {
    try {
      await deleteCouponMutation.mutateAsync(couponId);
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleSaveAndExit = () => {
    toast({
      title: "Success",
      description: "All changes have been saved",
    });
    navigate("/admin");
  };

  if (couponsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 font-inter">Coupon Management</h2>
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
          <Button 
            onClick={handleSaveAndExit}
            variant="outline"
            className="border-[#6B7280] text-[#6B7280] hover:bg-gray-50"
          >
            Save & Exit
          </Button>
        </div>
      </div>
      <Card className="border border-gray-200 shadow-sm rounded-lg mb-8">
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Code</TableHead>
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                <TableHead className="font-semibold text-gray-700">Expires</TableHead>
                <TableHead className="font-semibold text-gray-700">Uses</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsQuery.data?.map((coupon: SelectCoupon) => (
                <TableRow 
                  key={coupon.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium text-gray-900">{coupon.code}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={coupon.discountType === 'percentage' ? 'secondary' : 'outline'}
                      className={
                        coupon.discountType === 'percentage' 
                          ? 'bg-[#6B7280] text-white' 
                          : 'border-[#6B7280] text-[#6B7280]'
                      }
                    >
                      {coupon.discountType === 'percentage' ? `${coupon.amount}%` : `$${coupon.amount}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">{coupon.amount}</TableCell>
                  <TableCell className="text-gray-700">
                    {coupon.expirationDate ? 
                      new Date(coupon.expirationDate).toLocaleDateString() : 
                      'No expiration'
                    }
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {coupon.usageCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={coupon.isActive ? 'default' : 'secondary'}
                      className={coupon.isActive ? 'bg-[#10B981] text-white' : 'bg-[#6B7280] text-white'}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleEditCoupon(coupon)}
                      className="text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-[#EF4444] hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CouponModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        eventId={eventId}
        couponToEdit={selectedCoupon}
      />
    </div>
  );
}