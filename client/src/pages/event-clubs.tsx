import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Plus,
  X,
  Upload,
  Loader2,
  AlertTriangle,
  Building2
} from "lucide-react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define a type for club data
interface Club {
  id: number;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Form validation schema
const clubFormSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  logo: z.instanceof(FileList).optional().refine(
    (files) => !files || files.length === 0 || Array.from(files).every(file => file.type.startsWith('image/')),
    "Only image files are allowed"
  )
});

type ClubFormValues = z.infer<typeof clubFormSchema>;

export default function EventClubsPage() {
  const { eventId } = useParams();
  const [location, navigate] = useLocation();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event details
  const eventQuery = useQuery({
    queryKey: ['/api/admin/events', eventId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/events/${eventId}`);
      return response.data;
    }
  });

  // Fetch clubs for this event
  const clubsQuery = useQuery({
    queryKey: ['/api/admin/events/clubs', eventId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/events/${eventId}/clubs`);
      return response.data;
    }
  });

  // Edit club mutation
  const editClubMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
      const response = await axios.put(`/api/admin/clubs/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Club updated",
        description: "The club information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events/clubs', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update club information. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add club mutation
  const addClubMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(`/api/admin/events/${eventId}/clubs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Club added",
        description: "The new club has been added successfully.",
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events/clubs', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add new club. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Edit club form
  const editForm = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: selectedClub?.name || "",
    }
  });

  // Add club form
  const addForm = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
    }
  });

  // Update form values when selected club changes
  useEffect(() => {
    if (selectedClub) {
      editForm.reset({
        name: selectedClub.name
      });
    }
  }, [selectedClub, editForm]);

  // Handle edit submission
  const onEditSubmit = (values: ClubFormValues) => {
    if (!selectedClub) return;
    
    const formData = new FormData();
    formData.append('name', values.name);
    
    // Only append logo if a file was selected
    if (values.logo && values.logo.length > 0) {
      formData.append('logo', values.logo[0]);
    }
    
    editClubMutation.mutate({ id: selectedClub.id, formData });
  };

  // Handle add submission
  const onAddSubmit = (values: ClubFormValues) => {
    const formData = new FormData();
    formData.append('name', values.name);
    
    // Only append logo if a file was selected
    if (values.logo && values.logo.length > 0) {
      formData.append('logo', values.logo[0]);
    }
    
    addClubMutation.mutate(formData);
  };

  // Initialize edit dialog
  const handleEditClick = (club: Club) => {
    setSelectedClub(club);
    setIsEditDialogOpen(true);
  };

  if (eventQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error loading event</h2>
        <p className="text-muted-foreground">
          There was a problem loading the event information.
        </p>
        <Button
          variant="secondary"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const event = eventQuery.data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container py-6 space-y-6"
    >
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/admin/events">Events</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{event.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Participating Clubs</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Participating Clubs
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage clubs participating in {event.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/admin/events`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Club
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clubs</CardTitle>
          <CardDescription>
            Clubs with teams registered in this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : clubsQuery.isError ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="text-muted-foreground">
                Failed to load clubs. Please try again.
              </p>
            </div>
          ) : clubsQuery.data.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Building2 className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-center text-muted-foreground">
                No clubs have registered teams for this event yet.
              </p>
              <Button
                variant="outline"
                size="sm" 
                className="mt-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Club
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubsQuery.data.map((club: Club & { teamCount: number }) => (
                  <TableRow key={club.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        {club.logoUrl ? (
                          <AvatarImage src={club.logoUrl} alt={club.name} />
                        ) : (
                          <AvatarFallback>
                            {club.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.teamCount} teams</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(club)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update the club information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="logo"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Club Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        {selectedClub?.logoUrl && (
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground mb-1">Current logo:</p>
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={selectedClub.logoUrl} alt={selectedClub.name} />
                              <AvatarFallback>
                                {selectedClub.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          {...field}
                          onChange={(e) => {
                            onChange(e.target.files);
                          }}
                          className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground">
                          Recommended size: 200x200 pixels, max 5MB.
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editClubMutation.isPending}
                >
                  {editClubMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Club Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Club</DialogTitle>
            <DialogDescription>
              Enter the details of the new club
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="logo"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Club Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          {...field}
                          onChange={(e) => {
                            onChange(e.target.files);
                          }}
                          className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground">
                          Recommended size: 200x200 pixels, max 5MB.
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addClubMutation.isPending}
                >
                  {addClubMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Club"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}