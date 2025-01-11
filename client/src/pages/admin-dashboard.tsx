import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { SelectUser } from "@db/schema";
import { Loader2 } from "lucide-react";

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: users, isLoading, error } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminUser(user),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 3600000, // Keep unused data for 1 hour
  });

  // Return null during initial load or if user is not admin
  if (!isAdminUser(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Dashboard</CardTitle>
          <Button onClick={() => navigate("/")} variant="outline">Back to Profile</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-destructive">
                        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
                      </TableCell>
                    </TableRow>
                  ) : !users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {user.isAdmin
                            ? "Admin"
                            : user.isParent
                            ? "Parent"
                            : "Player"}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}