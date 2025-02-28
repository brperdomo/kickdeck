import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FeeForm } from "../components/fee/FeeForm";
import { FeeTable } from "../components/fee/FeeTable";
import { Plus } from "lucide-react";

export function FeeManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: fees, isLoading, error } = useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      console.log("Fetching fees...");
      const response = await fetch("/api/admin/fees");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch fees:", errorData);
        throw new Error(errorData.error || "Failed to fetch fees");
      }
      const data = await response.json();
      console.log("Fetched fees:", data);
      return data;
    },
  });

  const { data: accountingCodes, isLoading: isLoadingCodes } = useQuery({
    queryKey: ["accountingCodes"],
    queryFn: async () => {
      console.log("Fetching accounting codes...");
      const response = await fetch("/api/admin/accounting-codes");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch accounting codes:", errorData);
        throw new Error(errorData.error || "Failed to fetch accounting codes");
      }
      const data = await response.json();
      console.log("Fetched accounting codes:", data);
      return data;
    },
  });

  if (error) {
    console.error("Fee management error:", error);
    return <div>Error: {error.message}</div>;
  }

  if (isLoading || isLoadingCodes) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-[#2196F3] hover:bg-[#1976D2]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Fee
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 mb-6">
          <FeeForm 
            onCancel={() => setIsCreating(false)}
            onSuccess={() => {
              setIsCreating(false);
              queryClient.invalidateQueries({ queryKey: ["fees"] });
              toast({
                title: "Success",
                description: "Fee created successfully",
              });
            }}
            accountingCodes={accountingCodes || []}
          />
        </Card>
      )}

      <Card className="p-6">
        <FeeTable 
          fees={fees || []} 
          accountingCodes={accountingCodes || []}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["fees"] });
          }}
        />
      </Card>
    </div>
  );
}