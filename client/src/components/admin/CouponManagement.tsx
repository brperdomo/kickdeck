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
    <>
      <AdminBanner />
      <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 font-inter">Coupon Management</h2>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              setSelectedCoupon(null);
              setIsAddModalOpen(true);
            }}
            disabled={!eventId}
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
      <Card className="border border-gray-100 shadow-xl rounded-xl mb-8 overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Code</TableHead>
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Expires</TableHead>
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Uses</TableHead>
                <TableHead className="font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Event</TableHead>
                <TableHead className="text-right font-bold text-gray-900 px-6 py-5 text-sm uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsQuery.data?.map((coupon: SelectCoupon) => (
                <TableRow 
                  key={coupon.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200"
                >
                  <TableCell className="font-medium text-gray-900 px-6 py-5">{coupon.code}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge 
                      variant={coupon.discount_type === 'percentage' ? 'secondary' : 'outline'}
                      className={
                        coupon.discount_type === 'percentage' 
                          ? 'bg-[#6B7280] text-white' 
                          : 'border-[#6B7280] text-[#6B7280]'
                      }
                    >
                      {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {coupon.discount_type === 'percentage' ? `${coupon.amount}%` : `$${coupon.amount}`}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {coupon.expiration_date ? (
                      <span className={`${
                        new Date(coupon.expiration_date) < new Date() 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {new Date(coupon.expiration_date).toLocaleDateString()} 
                        {new Date(coupon.expiration_date) < new Date() && ' (Expired)'}
                      </span>
                    ) : (
                      <span className="text-gray-500">No expiration</span>
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
                      {events?.find(event => event.id === coupon.eventId)?.name || 'Global Coupon'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50/80 transition-colors"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-[#EF4444] hover:bg-red-50/80 transition-colors"
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
        eventId={eventId}
        couponToEdit={selectedCoupon}
      />
    </div>
    </>
  );
}