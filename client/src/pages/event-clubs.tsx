import { useParams } from "wouter";
import { AdminPageLayout } from "@/components/layouts/AdminPageLayout";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PenLine, Image } from "lucide-react";

interface Club {
  id: number;
  name: string;
  logoUrl: string | null;
  teamCount?: number;
}

interface EventDetails {
  id: number;
  name: string;
  clubCount: number;
  teamCount: number;
}

export default function EventClubsPage() {
  const params = useParams();
  const eventId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  // Fetch event details
  const eventQuery = useQuery<EventDetails>({
    queryKey: [`/api/admin/events/${eventId}/clubs`, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/clubs`);
      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }
      return response.json();
    },
  });
  
  // Fetch clubs for this event
  const clubsQuery = useQuery<Club[]>({
    queryKey: [`/api/admin/events/${eventId}/clubs/clubs`, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/clubs/clubs`);
      if (!response.ok) {
        throw new Error("Failed to fetch clubs");
      }
      return response.json();
    },
  });
  
  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (clubData: Partial<Club>) => {
      if (!editingClub) return null;
      
      const response = await fetch(`/api/admin/events/${eventId}/clubs/${editingClub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: clubData.name,
          logoUrl: clubData.logoUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update club");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the clubs query to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}/clubs/clubs`] });
      
      // Close the dialog and clear the editing club
      setIsEditDialogOpen(false);
      setEditingClub(null);
      
      // Show success toast
      toast({
        title: "Club updated",
        description: "Club information has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update club",
        variant: "destructive",
      });
    },
  });
  
  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setIsEditDialogOpen(true);
  };
  
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    
    updateClubMutation.mutate({
      name: editingClub.name,
      logoUrl: editingClub.logoUrl,
    });
  };
  
  return (
    <AdminPageLayout 
      title="Participating Clubs" 
      subtitle="Manage Club Information"
      icon={<Users className="h-5 w-5 text-indigo-300" />}
      backUrl={`/admin/events/${eventId}/edit`}
      backLabel="Back to Event"
    >
      <Card className="mb-6 bg-white shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>
            {eventQuery.isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading event details...</span>
              </div>
            ) : eventQuery.isError ? (
              <span className="text-red-500">Failed to load event details</span>
            ) : (
              <>
                <p>Event: <span className="font-medium">{eventQuery.data?.name}</span></p>
                <p className="mt-1">
                  <span className="font-medium">{eventQuery.data?.clubCount}</span> participating clubs with 
                  <span className="font-medium"> {eventQuery.data?.teamCount}</span> total teams
                </p>
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle>Participating Clubs</CardTitle>
          <CardDescription>
            Manage clubs that teams have selected during registration.
            Updates to club information will be reflected in all team registrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubsQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">Loading clubs...</p>
              </div>
            </div>
          ) : clubsQuery.isError ? (
            <div className="py-10 text-center">
              <p className="text-red-500">Failed to load clubs</p>
              <Button 
                variant="outline" 
                onClick={() => clubsQuery.refetch()} 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : clubsQuery.data?.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No clubs found for this event</p>
              <p className="text-sm text-gray-400">Clubs will appear here when teams select them during registration</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-indigo-900">Club Name</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Logo</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Teams</TableHead>
                    <TableHead className="font-semibold text-indigo-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubsQuery.data?.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>
                        {club.logoUrl ? (
                          <div className="h-10 w-10 overflow-hidden rounded-md">
                            <img 
                              src={club.logoUrl} 
                              alt={`${club.name} logo`} 
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                            <Image className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{club.teamCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditClub(club)}
                        >
                          <PenLine className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update the information for {editingClub?.name}. Changes will be reflected for all teams associated with this club.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="club-name" className="text-right">
                  Club Name
                </Label>
                <Input
                  id="club-name"
                  value={editingClub?.name || ''}
                  onChange={(e) => setEditingClub(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="logo-url" className="text-right">
                  Logo URL
                </Label>
                <Input
                  id="logo-url"
                  value={editingClub?.logoUrl || ''}
                  onChange={(e) => setEditingClub(prev => prev ? {...prev, logoUrl: e.target.value} : null)}
                  placeholder="https://example.com/logo.png"
                  className="col-span-3"
                />
              </div>
              
              {editingClub?.logoUrl && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Preview</Label>
                  <div className="col-span-3">
                    <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                      <img 
                        src={editingClub.logoUrl} 
                        alt="Logo preview" 
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Invalid+URL';
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingClub(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateClubMutation.isPending}
              >
                {updateClubMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}