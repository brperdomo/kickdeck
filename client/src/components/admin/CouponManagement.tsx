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

import { AdminBanner } from "./AdminBanner";

export function CouponManagement() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<SelectCoupon | null>(null);
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const eventId = location?.includes('/events/') ? 
    parseInt(location.split('/events/')[1]?.split('/')[0], 10) : 
    null;

  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const events = eventsQuery.data;

  const couponsQuery = useQuery({
    queryKey: ['/api/admin/coupons', eventId],
    queryFn: async () => {
      try {
        const url = `/api/admin/coupons${eventId ? `?eventId=${eventId}` : ''}`;
        const response = await fetch(url, {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
          <p className="text-sm text-gray-600 mt-1">Manage promotional codes and discounts for your events</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setSelectedCoupon(null);
              setIsAddModalOpen(true);
            }}
            disabled={!eventId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
          <Button 
            onClick={handleSaveAndExit}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Save & Exit
          </Button>
        </div>
      </div>
      <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50/50">
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Code</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Type</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Amount</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Expires</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Usage</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4 text-sm">Event</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 px-6 py-4 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsQuery.data?.map((coupon: SelectCoupon) => (
                <TableRow 
                  key={coupon.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
                >
                  <TableCell className="font-medium text-gray-900 px-6 py-4">
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                      {coupon.code}
                    </code>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge 
                      variant={coupon.discountType === 'percentage' ? 'default' : 'secondary'}
                      className={
                        coupon.discountType === 'percentage' 
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }
                    >
                      {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-700 font-medium">
                    {coupon.discountType === 'percentage' ? `${coupon.amount}%` : `$${coupon.amount}`}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {coupon.expirationDate ? (
                      <span className={`${
                        new Date(coupon.expirationDate) < new Date() 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {new Date(coupon.expirationDate).toLocaleDateString()} 
                        {new Date(coupon.expirationDate) < new Date() && ' (Expired)'}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">No expiration</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <span>{coupon.usageCount}</span>
                      {coupon.maxUses && (
                        <>
                          <span className="text-gray-400">/</span>
                          <span>{coupon.maxUses}</span>
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-gray-700">
                      {events?.find((event: any) => event.id === coupon.eventId)?.name || 'Global Coupon'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </Button>
                    </div>
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
        eventId={eventId?.toString() || ""}
        couponToEdit={selectedCoupon}
      />
    </div>
  );
}