
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react";
import { AdminModal } from "@/components/admin/AdminModal";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<any>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["administrators"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch administrators");
      }
      return response.json();
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete administrator");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrators"] });
      toast({
        title: "Administrator deleted",
        description: "The administrator has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleEditAdmin = (admin: any) => {
    setAdminToEdit(admin);
    setIsAddModalOpen(true);
  };

  const handleDeleteAdmin = (adminId: number) => {
    if (confirm("Are you sure you want to remove this administrator?")) {
      deleteAdminMutation.mutate(adminId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Administrators</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Administrator
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrator List</CardTitle>
          <CardDescription>
            Manage user accounts with administrative access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins?.map((admin: any) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.firstName} {admin.lastName}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {admin.roles?.map((role: string) => (
                      <Badge key={role} variant="outline" className="mr-1">
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        adminToEdit={adminToEdit}
      />
    </>
  );
}
