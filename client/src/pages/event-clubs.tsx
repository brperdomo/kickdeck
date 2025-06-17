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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, PenLine, Image, Merge } from "lucide-react";

interface Club {
  id: number | null;
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
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [selectedClubsForMerge, setSelectedClubsForMerge] = useState<string[]>([]);
  const [targetClubName, setTargetClubName] = useState("");
  const [targetClubLogo, setTargetClubLogo] = useState("");
  
  // Fetch event details
  const eventQuery = useQuery<EventDetails>({
    queryKey: [`/api/admin/events/${eventId}`, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }
      const data = await response.json();
      console.log('Event data received:', data);
      return data;
    },
  });
  
  // Fetch clubs for this event
  const clubsQuery = useQuery<Club[]>({
    queryKey: [`/api/admin/event-clubs/${eventId}/clubs`, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/event-clubs/${eventId}/clubs`);
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
      
      const response = await fetch(`/api/admin/event-clubs/${eventId}/clubs/${editingClub.id}`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/event-clubs/${eventId}/clubs`] });
      
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

  // Merge clubs mutation
  const mergeClubsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/event-clubs/${eventId}/clubs/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetClubName: targetClubName,
          sourceClubNames: selectedClubsForMerge,
          logoUrl: targetClubLogo || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to merge clubs");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch the clubs query to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/admin/event-clubs/${eventId}/clubs`] });
      
      // Close the dialog and reset state
      setIsMergeDialogOpen(false);
      setSelectedClubsForMerge([]);
      setTargetClubName("");
      setTargetClubLogo("");
      
      // Show success toast
      toast({
        title: "Clubs merged successfully",
        description: `${data.mergedTeamsCount} teams have been consolidated into "${data.targetClub.name}".`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to merge clubs",
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
        </CardHeader>
        <CardContent className="pt-0">
          {eventQuery.isLoading ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading event details...</span>
            </div>
          ) : eventQuery.isError ? (
            <div className="text-sm text-red-500">Failed to load event details</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <div>Event: <span className="font-medium">{eventQuery.data?.name}</span></div>
              <div className="mt-1">
                <span className="font-medium">{eventQuery.data?.clubCount}</span> participating clubs with 
                <span className="font-medium"> {eventQuery.data?.teamCount}</span> total teams
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Participating Clubs
            {clubsQuery.data && clubsQuery.data.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMergeDialogOpen(true)}
                className="ml-4"
              >
                <Merge className="mr-2 h-4 w-4" />
                Merge Clubs
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm text-muted-foreground">
            Manage clubs that teams have selected during registration.
            Updates to club information will be reflected in all team registrations.
          </div>
        </CardContent>
        <CardContent>
          {clubsQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Loading clubs...</span>
              </div>
            </div>
          ) : clubsQuery.isError ? (
            <div className="py-10 text-center">
              <span className="block text-red-500">Failed to load clubs</span>
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
              <span className="block mt-2 text-gray-500">No clubs found for this event</span>
              <span className="block text-sm text-gray-400">Clubs will appear here when teams select them during registration</span>
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
          </DialogHeader>
          <div className="text-sm text-muted-foreground mt-2 mb-4">
            Update the information for {editingClub?.name}. Changes will be reflected for all teams associated with this club.
          </div>
          
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

      {/* Merge Clubs Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Clubs</DialogTitle>
            <DialogDescription>
              Consolidate multiple club entries into a single club. All teams from the selected clubs will be moved to the target club.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div>
              <Label className="text-sm font-medium">Select clubs to merge:</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {clubsQuery.data?.map((club) => (
                  <div key={club.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`club-${club.name}`}
                      checked={selectedClubsForMerge.includes(club.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClubsForMerge([...selectedClubsForMerge, club.name]);
                        } else {
                          setSelectedClubsForMerge(selectedClubsForMerge.filter(name => name !== club.name));
                        }
                      }}
                    />
                    <Label htmlFor={`club-${club.name}`} className="flex-1 cursor-pointer">
                      {club.name} ({club.teamCount} teams)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="target-club-name" className="text-sm font-medium">
                Target club name:
              </Label>
              <Input
                id="target-club-name"
                value={targetClubName}
                onChange={(e) => setTargetClubName(e.target.value)}
                placeholder="Enter the final club name"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be the name used for the merged club
              </p>
            </div>

            <div>
              <Label htmlFor="target-club-logo" className="text-sm font-medium">
                Logo URL (optional):
              </Label>
              <Input
                id="target-club-logo"
                value={targetClubLogo}
                onChange={(e) => setTargetClubLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="mt-1"
              />
            </div>

            {selectedClubsForMerge.length > 0 && targetClubName && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">Merge Summary:</p>
                <p className="text-sm text-blue-800">
                  {selectedClubsForMerge.length} clubs ({selectedClubsForMerge.join(", ")}) will be merged into "{targetClubName}"
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Total teams affected: {selectedClubsForMerge.reduce((sum, clubName) => {
                    const club = clubsQuery.data?.find(c => c.name === clubName);
                    return sum + (club?.teamCount || 0);
                  }, 0)}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsMergeDialogOpen(false);
                setSelectedClubsForMerge([]);
                setTargetClubName("");
                setTargetClubLogo("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => mergeClubsMutation.mutate()}
              disabled={mergeClubsMutation.isPending || selectedClubsForMerge.length === 0 || !targetClubName}
            >
              {mergeClubsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Merge Clubs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}