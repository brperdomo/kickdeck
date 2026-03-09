import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingCodeModal } from "@/components/admin/AccountingCodeModal";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";

export default function AccountingCodeManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<{
    id: number;
    code: string;
    name: string;
    description?: string;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const accountingCodesQuery = useQuery({
    queryKey: ['/api/admin/accounting-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    }
  });

  const deleteAccountingCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/accounting-codes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete accounting code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/accounting-codes']);
      toast({
        title: "Success",
        description: "Accounting code deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete accounting code",
        variant: "destructive"
      });
    }
  });

  const handleEditCode = (code: typeof selectedCode) => {
    setSelectedCode(code);
    setIsModalOpen(true);
  };

  const handleDeleteCode = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this accounting code?')) {
      await deleteAccountingCodeMutation.mutateAsync(id);
    }
  };

  return (
    <AdminPageWrapper
      title="Accounting Codes"
      backUrl="/admin"
      backLabel="Back to Dashboard"
    >
      <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Accounting Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Accounting Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {accountingCodesQuery.isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : accountingCodesQuery.isError ? (
            <div className="text-center text-red-500">
              Error loading accounting codes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountingCodesQuery.data?.map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">{code.code}</TableCell>
                    <TableCell>{code.name}</TableCell>
                    <TableCell>{code.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCode(code)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCode(code.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AccountingCodeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        codeToEdit={selectedCode}
      />
      </div>
    </AdminPageWrapper>
  );
}
