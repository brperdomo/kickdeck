import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "../ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Define types
type SortDirection = "asc" | "desc";
type SortField = "name" | "amount" | "beginDate" | "endDate";

const feeFormSchema = z.object({
  name: z.string().min(1, { message: "Fee name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  beginDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  accountingCodeId: z.number().nullable(),
  feeType: z.string().default("registration"),
  isRequired: z.boolean().default(true),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

export function FeeManagement() {
  const params = useParams();
  const eventId = params.id;
  const [location, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [isAssignFeeOpen, setIsAssignFeeOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [newlyCreatedFee, setNewlyCreatedFee] = useState(null);
  const [newFee, setNewFee] = useState({
    name: "",
    amount: "",
    beginDate: null,
    endDate: null,
    applyToAll: false,
  });
  const [selectedAgeGroups, setSelectedAgeGroups] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get eventId from the URL parameter
  const eventIdMatch = location.match(/\/admin\/events\/(\d+)\/fees/);
  const eventIdParam = eventIdMatch ? eventIdMatch[1] : eventId;

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      beginDate: "",
      endDate: "",
      accountingCodeId: null,
      feeType: "registration",
      isRequired: true,
    },
  });

  // Fetch event fees
  const feesQuery = useQuery({
    queryKey: ["fees", eventIdParam],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventIdParam}/fees`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch fees");
      const fees = await response.json();

      // Keep the original date format from the server
      return fees.map((fee) => ({
        ...fee,
        beginDate: fee.beginDate || null,
        endDate: fee.endDate || null,
      }));
    },
    enabled: !!eventIdParam,
  });

  // Fetch accounting codes
  const accountingCodesQuery = useQuery({
    queryKey: ["accountingCodes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/accounting-codes", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch accounting codes");
      return response.json();
    },
  });

  // Query to fetch age groups
  const ageGroupsQuery = useQuery({
    queryKey: ["eventAgeGroups", eventIdParam],
    queryFn: async () => {
      console.log(`Fetching age groups for event: ${eventIdParam}`);
      const response = await fetch(
        `/api/admin/events/${eventIdParam}/age-groups`,
        {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to fetch age groups:", error);
        throw new Error(`Failed to fetch age groups: ${error}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        return [];
      }
      // Don't filter by divisionCode, as this can cause inconsistencies with the rest of the application
      // Use the full dataset instead to ensure all age groups are displayed correctly
      const uniqueAgeGroups = data;
      
      // Sort age groups properly to fix display order issue
      console.log('Sample age group data:', uniqueAgeGroups[0]);
      const sortedAgeGroups = uniqueAgeGroups.sort((a, b) => {
        // First sort by age group number (U4, U5, U6, etc.)
        // Use the correct field name - check both ageGroup and name fields
        const getAgeNumber = (ageGroupName) => {
          if (ageGroupName && ageGroupName.startsWith('U')) {
            return parseInt(ageGroupName.substring(1));
          }
          return 999; // Put non-U groups at the end
        };
        
        // Use whichever field contains the age group (U7, U15, etc.)
        const ageGroupA = a.ageGroup || a.name || '';
        const ageGroupB = b.ageGroup || b.name || '';
        
        console.log(`Comparing: ${ageGroupA} (${getAgeNumber(ageGroupA)}) vs ${ageGroupB} (${getAgeNumber(ageGroupB)})`);
        
        const ageA = getAgeNumber(ageGroupA);
        const ageB = getAgeNumber(ageGroupB);
        
        if (ageA !== ageB) {
          return ageA - ageB;
        }
        
        // Within same age, sort by gender: Boys, Girls, Coed
        const genderOrder = { 'Boys': 0, 'Girls': 1, 'Coed': 2 };
        return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3);
      });
      
      console.log(
        `Found ${sortedAgeGroups.length} unique age groups for event ${eventIdParam}, sorted properly`,
      );
      return sortedAgeGroups;
    },
    enabled: !!eventIdParam && !isNaN(parseInt(eventIdParam)),
  });

  // Fetch fee assignments
  const feeAssignmentsQuery = useQuery({
    queryKey: ["feeAssignments", eventIdParam],
    queryFn: async () => {
      console.log(`Fetching fee assignments for event ${eventIdParam}`);
      try {
        const response = await fetch(
          `/api/admin/events/${eventIdParam}/fee-assignments`,
          {
            // Add cache control headers to prevent browser caching
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch fee assignments: ${response.status}`);
          throw new Error(`Failed to fetch fee assignments: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Server returned non-JSON response:", text);
          return []; // Return empty array on invalid response
        }
        
        const data = await response.json();
        console.log("Received fee assignments:", data);
        
        // Return just the assignments array if the response has the new format
        const assignments = data.assignments || data;
        
        if (!Array.isArray(assignments)) {
          console.error("Unexpected assignments format:", assignments);
          return [];
        }
        
        return assignments;
      } catch (error) {
        console.error("Error fetching fee assignments:", error);
        return []; // Return empty array on error
      }
    },
    enabled: !!eventIdParam,
    staleTime: 300000, // Cache for 5 minutes to prevent disruption during demos
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refresh when window regains focus to prevent demo disruption
    refetchOnMount: true, // Still refetch when component mounts
    retry: 1 // Only retry once to avoid too many failed requests
  });

  // Initialize selected age groups when fee assignments load
  useEffect(() => {
    // Debug info to help diagnose routing issues
    console.log("Current location:", location);
    console.log("Event ID from parameter:", eventIdParam);
    console.log("Age groups data:", ageGroupsQuery.data);
    console.log("Fee assignments data:", feeAssignmentsQuery.data);

    if (ageGroupsQuery.data && feeAssignmentsQuery.data && feesQuery.data) {
      const assignmentMap = {};

      // First initialize all groups and fees with false (not assigned)
      ageGroupsQuery.data.forEach((group) => {
        const groupId = group.id;
        if (!groupId) return; // Skip if no ID
        
        assignmentMap[groupId] = {};

        feesQuery.data.forEach((fee) => {
          assignmentMap[groupId][fee.id] = false;
        });
      });

      // Then mark assignments as true based on the fetched data
      if (Array.isArray(feeAssignmentsQuery.data)) {
        feeAssignmentsQuery.data.forEach((assignment) => {
          const ageGroupId = assignment.ageGroupId;
          const feeId = assignment.feeId;
          
          if (ageGroupId && feeId && assignmentMap[ageGroupId]) {
            assignmentMap[ageGroupId][feeId] = true;
          }
        });
      }

      console.log("Setting selected age groups with assignments:", assignmentMap);
      setSelectedAgeGroups(assignmentMap);
    }
  }, [feeAssignmentsQuery.data, ageGroupsQuery.data, feesQuery.data, location, eventIdParam]);

  // Add fee mutation
  const addFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      // Format dates properly to avoid JSON parsing issues
      const cleanedData = {
        ...feeData,
        amount: Number(feeData.amount),
        beginDate: feeData.beginDate
          ? new Date(feeData.beginDate).toISOString().split("T")[0]
          : null,
        endDate: feeData.endDate
          ? new Date(feeData.endDate).toISOString().split("T")[0]
          : null,
        accountingCodeId: feeData.accountingCodeId || null,
      };

      console.log("Sending new fee data:", JSON.stringify(cleanedData));

      try {
        const response = await fetch(`/api/admin/events/${eventIdParam}/fees`, {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanedData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Failed to create fee: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Fee creation error:", error);
        throw error;
      }
    },
    onSuccess: (newFee) => {
      queryClient.invalidateQueries(["fees", eventIdParam]);
      setIsDialogOpen(false);
      form.reset();
      
      // Store the newly created fee and immediately prompt for age group assignment
      setNewlyCreatedFee(newFee);
      setSelectedFeeId(newFee.id);
      setIsQuickAssignOpen(true);
      
      toast({
        title: "Success", 
        description: "Fee created! Now select which age groups to assign it to.",
      });
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
      toast({
        title: "Error",
        description: `Failed to create fee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async (feeData) => {
      // Ensure we're sending valid JSON data
      const cleanedData = {
        ...feeData,
        amount: Number(feeData.amount),
        beginDate: feeData.beginDate
          ? new Date(feeData.beginDate).toISOString().split("T")[0]
          : null,
        endDate: feeData.endDate
          ? new Date(feeData.endDate).toISOString().split("T")[0]
          : null,
        accountingCodeId: feeData.accountingCodeId || null,
      };

      try {
        const response = await fetch(
          `/api/admin/events/${eventIdParam}/fees/${feeData.id}`,
          {
            method: "PATCH",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cleanedData),
          },
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Server error response:", errorData);
          throw new Error(`Failed to update fee: ${errorData}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Fee update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["fees", eventIdParam]);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Fee updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update fee",
        variant: "destructive",
      });
    },
  });

  // Delete fee mutation
  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId) => {
      const response = await fetch(
        `/api/admin/events/${eventIdParam}/fees/${feeId}`,
        {
          method: "DELETE",
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete fee");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["fees", eventIdParam]);
      toast({
        title: "Success",
        description: "Fee deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee",
        variant: "destructive",
      });
    },
  });

  // Update fee assignments mutation
  const updateAssignmentsMutation = useMutation({
    mutationFn: async ({ feeId, ageGroupIds }) => {
      console.log(`Sending request to update fee assignments for fee ${feeId} with ${ageGroupIds.length} age groups`);

      const response = await fetch(
        `/api/admin/events/${eventIdParam}/fee-assignments`,
        {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feeId,
            ageGroupIds,
          }),
        },
      );

      // Log the response status to help with debugging
      console.log(`Fee assignment update response status: ${response.status}`);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server error: ${response.status}`,
          );
        } else {
          const text = await response.text();
          console.error("Server returned non-JSON error response:", text);
          throw new Error(
            `Server error: ${response.status}. The server returned an invalid response.`,
          );
        }
      }

      // Safely handle JSON parsing
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const jsonData = await response.json();
        console.log("Received JSON response:", jsonData);
        return jsonData;
      } else {
        const text = await response.text();
        console.warn("Server returned non-JSON response:", text);
        // Return a valid object since we know the operation was successful
        return { success: true };
      }
    },
    onSuccess: (data) => {
      console.log("Fee assignment mutation succeeded:", data);
      queryClient.invalidateQueries(["feeAssignments", eventIdParam]);
      // We'll handle dialog closing in the handleSaveAssignments function
    },
    onError: (error) => {
      console.error("Fee assignment mutation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update fee assignments",
        variant: "destructive",
      });
    },
  });

  const handleAddFee = () => {
    // Ensure proper date formatting
    const feeData = {
      ...newFee,
      amount: parseFloat(newFee.amount) * 100, // Convert to cents,
      beginDate: newFee.beginDate
        ? new Date(newFee.beginDate).toISOString().split("T")[0]
        : null,
      endDate: newFee.endDate
        ? new Date(newFee.endDate).toISOString().split("T")[0]
        : null,
    };

    addFeeMutation.mutate(feeData);
  };

  const handleUpdateFee = () => {
    // Ensure proper date formatting
    const feeData = {
      ...editingFee,
      amount: parseFloat(editingFee.amount) * 100, // Convert to cents
      beginDate: editingFee.beginDate
        ? new Date(editingFee.beginDate).toISOString().split("T")[0]
        : null,
      endDate: editingFee.endDate
        ? new Date(editingFee.endDate).toISOString().split("T")[0]
        : null,
    };

    updateFeeMutation.mutate(feeData);
  };

  const handleDeleteFee = (feeId) => {
    if (window.confirm("Are you sure you want to delete this fee?")) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  // Handle saving fee assignments
  const handleSaveAssignments = async () => {
    // Determine which fee we're working with
    const currentFeeId = selectedFeeId || (feesQuery.data && feesQuery.data.length > 0 ? feesQuery.data[0].id : null);
    
    if (!currentFeeId) {
      console.error("No fee selected and no fees available");
      toast({
        title: "Error",
        description: "No fee selected",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare assignments data
    const ageGroupIds = [];

    // Collect all selected age group IDs for the current fee
    ageGroupsQuery.data?.forEach((ageGroup) => {
      const groupId = ageGroup.id;
      if (
        groupId && 
        selectedAgeGroups[groupId] &&
        selectedAgeGroups[groupId][currentFeeId]
      ) {
        ageGroupIds.push(groupId);
      }
    });

    console.log(
      "Saving fee assignments:",
      JSON.stringify({
        ageGroupIds,
        feeId: currentFeeId,
      }),
    );

    try {
      if (!eventIdParam) {
        throw new Error("Event ID is missing");
      }

      // Use the React Query mutation with retry logic
      try {
        // First attempt
        let result;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            result = await updateAssignmentsMutation.mutateAsync({
              feeId: currentFeeId,
              ageGroupIds,
            });
            
            // If successful, break out of retry loop
            console.log(`Attempt ${retryCount + 1} succeeded:`, result);
            break;
          } catch (err) {
            retryCount++;
            console.error(`Attempt ${retryCount} failed:`, err);
            
            if (retryCount > maxRetries) {
              throw err; // All retries failed, propagate the error
            }
            
            // Wait a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        console.log("Fee assignment update result:", result);
        
        // Show success message
        toast({
          title: "Success",
          description: `Fee assignments updated successfully. ${ageGroupIds.length} age groups assigned.`,
        });

        // Force fresh data retrieval from server
        queryClient.removeQueries(['feeAssignments', eventIdParam]); // Remove from cache completely
        queryClient.removeQueries(['fees', eventIdParam]);
        queryClient.removeQueries(['eventAgeGroups', eventIdParam]);
        
        // Wait a moment for server to process changes
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Immediately refetch to update the UI with fresh data
        await Promise.all([
          feeAssignmentsQuery.refetch({ throwOnError: true }), 
          feesQuery.refetch({ throwOnError: true }), 
          ageGroupsQuery.refetch({ throwOnError: true })
        ]);
        
        // Close dialog if we're in one
        if (isAssignFeeOpen) {
          setIsAssignFeeOpen(false);
        }

      } catch (mutationError) {
        console.error("Mutation error:", mutationError);
        throw new Error(`Failed to save assignments: ${mutationError.message}`);
      }
    } catch (error) {
      console.error("Fee assignment error:", error);
      toast({
        title: "Error",
        description: `Failed to save assignments: ${error.message}`,
        variant: "destructive",
      });
      // Keep the dialog open so user can retry
    }
  };

  const openAssignFeeDialog = (feeId) => {
    setSelectedFeeId(feeId);
    setIsAssignFeeOpen(true);
  };

  const handleFormSubmit = (data: FeeFormValues) => {
    // Convert amount from string to number in cents
    const amountInCents = Math.round(parseFloat(data.amount) * 100);

    // Log the data being submitted for debugging
    console.log("Submitting fee data:", {...data, amount: amountInCents});

    if (editingFee) {
      // Update existing fee
      updateFeeMutation.mutate({
        id: editingFee.id,
        ...data,
        amount: amountInCents,
        feeType: data.feeType || "registration",
        isRequired: typeof data.isRequired === "boolean" ? data.isRequired : true,
      });
    } else {
      // Add new fee
      addFeeMutation.mutate({
        ...data,
        amount: amountInCents,
        feeType: data.feeType || "registration",
        isRequired: typeof data.isRequired === "boolean" ? data.isRequired : true,
      });
    }

    setIsDialogOpen(false);
    setEditingFee(null);
    form.reset();
  };

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  if (
    feesQuery.isLoading ||
    accountingCodesQuery.isLoading ||
    ageGroupsQuery.isLoading
  ) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (feesQuery.error || accountingCodesQuery.error || ageGroupsQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="text-red-500 font-semibold">
          Failed to load fee management data
        </div>
        <Button variant="outline" onClick={() => setLocation("/admin/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold">Fee Management</h1>
        </div>
        <Button
          onClick={() => {
            setEditingFee(null);
            form.reset();
            setIsDialogOpen(true);
          }}
        >
          Add New Fee
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Event Fees</CardTitle>
          <CardDescription>
            Manage fees for this event and assign them to age groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fees">
            <TabsList>
              <TabsTrigger value="fees">Fee List</TabsTrigger>
              <TabsTrigger value="chart">Fee Assignment Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="fees" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Begin Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesQuery.data?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No fees have been added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    feesQuery.data?.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>{fee.name}</TableCell>
                        <TableCell>{formatCurrency(fee.amount)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            {fee.feeType === "registration" ? "Registration" :
                             fee.feeType === "uniform" ? "Uniform" :
                             fee.feeType === "equipment" ? "Equipment" :
                             fee.feeType === "tournament" ? "Tournament" : "Other"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {fee.isRequired !== false ? 
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Required</span> :
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Optional</span>
                          }
                        </TableCell>
                        <TableCell>
                          {fee.beginDate
                            ? format(new Date(fee.beginDate), "MMM d, yyyy")
                            : null}
                        </TableCell>
                        <TableCell>
                          {fee.endDate
                            ? format(new Date(fee.endDate), "MMM d, yyyy")
                            : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Pre-fill form with existing fee data
                                form.reset({
                                  name: fee.name,
                                  amount: (fee.amount / 100).toString(),
                                  beginDate: fee.beginDate ? fee.beginDate : "",
                                  endDate: fee.endDate ? fee.endDate : "",
                                  accountingCodeId: fee.accountingCodeId || null,
                                  feeType: fee.feeType || "registration",
                                  isRequired: typeof fee.isRequired === "boolean" ? fee.isRequired : true,
                                });
                                setEditingFee(fee);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFee(fee.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignFeeDialog(fee.id)}
                            >
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              {ageGroupsQuery.isLoading || feesQuery.isLoading || feeAssignmentsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : ageGroupsQuery.data?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No age groups have been added to this event yet
                </div>
              ) : feesQuery.data?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No fees have been added to this event yet
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-sm text-gray-600 mb-2">
                    This chart shows which age groups have fees assigned. Click on a cell to toggle the assignment.
                  </div>
                  
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="grid" style={{ 
                      gridTemplateColumns: `minmax(180px, auto) repeat(${feesQuery.data?.length || 0}, 1fr)`,
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" 
                    }}>
                      {/* Header Row */}
                      <div className="bg-gray-50 p-3 font-medium border-b">
                        Age Group / Division
                      </div>
                      
                      {/* Fee Column Headers */}
                      {feesQuery.data?.map((fee) => (
                        <div key={fee.id} className="bg-gray-50 p-3 text-center border-b border-l">
                          <div className="flex flex-col items-center">
                            <span className="font-medium truncate max-w-full" title={fee.name}>
                              {fee.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatCurrency(fee.amount)}
                            </span>
                            <div className="mt-1 flex flex-col items-center gap-1">
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                {fee.feeType === "registration" ? "Registration" :
                                 fee.feeType === "uniform" ? "Uniform" :
                                 fee.feeType === "equipment" ? "Equipment" :
                                 fee.feeType === "tournament" ? "Tournament" : "Other"}
                              </span>
                              {fee.isRequired !== false && (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Age Groups and Assignment Cells */}
                      {ageGroupsQuery.data?.map((ageGroup) => (
                        <React.Fragment key={ageGroup.id}>
                          {/* Age Group Column */}
                          <div className="p-3 font-medium border-b">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {ageGroup.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {ageGroup.gender} • {ageGroup.divisionCode}
                              </span>
                            </div>
                          </div>
                          
                          {/* Fee Assignment Cells */}
                          {feesQuery.data?.map((fee) => {
                            const isAssigned = 
                              selectedAgeGroups[ageGroup.id]?.[fee.id] === true || 
                              feeAssignmentsQuery.data?.some(
                                a => a.ageGroupId === ageGroup.id && a.feeId === fee.id
                              ) === true;
                            
                            return (
                              <div 
                                key={`${ageGroup.id}-${fee.id}`} 
                                className={`p-3 border-b border-l flex items-center justify-center cursor-pointer transition-colors ${
                                  isAssigned 
                                    ? 'bg-green-50 hover:bg-green-100' 
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                                onClick={() => {
                                  setSelectedAgeGroups(prev => {
                                    const newState = {...prev};
                                    if (!newState[ageGroup.id]) {
                                      newState[ageGroup.id] = {};
                                    }
                                    newState[ageGroup.id][fee.id] = !isAssigned;
                                    return newState;
                                  });
                                }}
                              >
                                {isAssigned && (
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700">Assigned</span>
                      <div className="w-4 h-4 rounded-full bg-gray-200 ml-4"></div>
                      <span className="text-sm text-gray-700">Not Assigned</span>
                    </div>
                    <Button onClick={handleSaveAssignments}>
                      Save Assignments
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Fee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingFee ? "Edit Fee" : "Add New Fee"}</DialogTitle>
            <DialogDescription>
              {editingFee
                ? "Update the fee details below."
                : "Add a new fee for this event."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter fee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beginDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Begin Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accountingCodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting Code</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select accounting code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountingCodesQuery.data?.map((code) => (
                          <SelectItem key={code.id} value={code.id.toString()}>
                            {code.code} - {code.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="feeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="registration">Registration Fee</SelectItem>
                        <SelectItem value="uniform">Uniform Fee</SelectItem>
                        <SelectItem value="equipment">Equipment Fee</SelectItem>
                        <SelectItem value="tournament">Tournament Fee</SelectItem>
                        <SelectItem value="other">Other Fee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required Fee</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        If checked, this fee will be automatically added to all registrations
                        for the assigned age groups
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingFee(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFee ? "Update Fee" : "Create Fee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Fee Dialog (simplified) */}
      <Dialog open={isAssignFeeOpen} onOpenChange={setIsAssignFeeOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Fee to Age Groups</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Select the age groups this fee should be assigned to. The fee will
              be applied to all participants in the selected age groups.
            </p>
          </DialogHeader>

          {/* Fee being assigned */}
          {selectedFeeId && feesQuery.data && (
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                Selected Fee
              </h4>
              <p className="text-sm text-blue-900">
                {feesQuery.data.find((f) => f.id === selectedFeeId)?.name} -
                {formatCurrency(
                  feesQuery.data.find((f) => f.id === selectedFeeId)?.amount ||
                    0,
                )}
              </p>
              <div className="mt-1 flex space-x-2">
                {(() => {
                  const fee = feesQuery.data.find((f) => f.id === selectedFeeId);
                  return (
                    <>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        {fee?.feeType === "registration" ? "Registration" :
                         fee?.feeType === "uniform" ? "Uniform" :
                         fee?.feeType === "equipment" ? "Equipment" :
                         fee?.feeType === "tournament" ? "Tournament" : "Other"}
                      </span>
                      {fee?.isRequired !== false && (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Required
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search age groups..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                // Implement search functionality if needed
              }}
            />
          </div>

          <div className="space-y-2 border rounded-md p-3 bg-gray-50">
            {ageGroupsQuery.data?.map((ageGroup) => (
              <div
                key={ageGroup.id}
                className={`flex items-center p-2 hover:bg-gray-100 rounded-md ${
                  selectedAgeGroups[ageGroup.id]?.[selectedFeeId] ||
                  feeAssignmentsQuery.data?.some(
                    (a) =>
                      a.ageGroupId === ageGroup.id && a.feeId === selectedFeeId,
                  )
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <Checkbox
                  id={`age-group-${ageGroup.id || ageGroup.divisionCode}`}
                  className="h-5 w-5 border-2 rounded-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                  checked={
                    selectedAgeGroups[ageGroup.id]?.[selectedFeeId] === true || 
                    feeAssignmentsQuery.data?.some(
                      a => (a.ageGroupId === ageGroup.id || a.divisionCode === ageGroup.divisionCode) && 
                           a.feeId === selectedFeeId
                    ) === true
                  }
                  onCheckedChange={(checked) => {
                    setSelectedAgeGroups(prev => {
                      const newState = {...prev};
                      if (!newState[ageGroup.id]) {
                        newState[ageGroup.id] = {};
                      }
                      newState[ageGroup.id][selectedFeeId] = checked === true;
                      return newState;
                    });
                  }}
                />
                <div className="ml-2 flex-1">
                  <Label
                    htmlFor={`age-group-${ageGroup.id}`}
                    className="font-medium"
                  >
                    {ageGroup.name}
                  </Label>
                  <div className="text-xs text-gray-500">
                    {ageGroup.gender} • {ageGroup.divisionCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Select all age groups
                  setSelectedAgeGroups(prev => {
                    const newSelections = { ...prev };
                    ageGroupsQuery.data?.forEach((ageGroup) => {
                      if (!newSelections[ageGroup.id]) {
                        newSelections[ageGroup.id] = {};
                      }
                      newSelections[ageGroup.id][selectedFeeId] = true;
                    });
                    return newSelections;
                  });
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Deselect all age groups
                  setSelectedAgeGroups(prev => {
                    const newSelections = { ...prev };
                    ageGroupsQuery.data?.forEach((ageGroup) => {
                      if (!newSelections[ageGroup.id]) {
                        newSelections[ageGroup.id] = {};
                      }
                      newSelections[ageGroup.id][selectedFeeId] = false;
                    });
                    return newSelections;
                  });
                }}
              >
                Deselect All
              </Button>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAssignFeeOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAssignments}>Save Assignments</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Assign Dialog - Shows immediately after fee creation */}
      <Dialog open={isQuickAssignOpen} onOpenChange={setIsQuickAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Fee to Age Groups</DialogTitle>
            <DialogDescription>
              {newlyCreatedFee && `Your fee "${newlyCreatedFee.name}" has been created successfully! Now select which age groups should have this fee.`}
            </DialogDescription>
          </DialogHeader>

          {/* Show the newly created fee */}
          {newlyCreatedFee && (
            <div className="bg-green-50 p-3 rounded-md mb-4">
              <h4 className="text-sm font-medium text-green-800 mb-1">
                Newly Created Fee
              </h4>
              <p className="text-sm text-green-900">
                {newlyCreatedFee.name} - {formatCurrency(newlyCreatedFee.amount || 0)}
              </p>
              <div className="mt-1 flex space-x-2">
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {newlyCreatedFee.feeType === "registration" ? "Registration" :
                   newlyCreatedFee.feeType === "uniform" ? "Uniform" :
                   newlyCreatedFee.feeType === "equipment" ? "Equipment" :
                   newlyCreatedFee.feeType === "tournament" ? "Tournament" : "Other"}
                </span>
                {newlyCreatedFee.isRequired !== false && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    Required
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Age group selection with simplified interface */}
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3 bg-gray-50">
            {ageGroupsQuery.data?.map((ageGroup) => (
              <div
                key={ageGroup.id}
                className="flex items-center p-2 hover:bg-gray-100 rounded-md"
              >
                <Checkbox
                  id={`quick-assign-${ageGroup.id}`}
                  className="h-5 w-5 border-2 rounded-sm data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white"
                  checked={selectedAgeGroups[ageGroup.id]?.[selectedFeeId] === true}
                  onCheckedChange={(checked) => {
                    setSelectedAgeGroups(prev => {
                      const newState = {...prev};
                      if (!newState[ageGroup.id]) {
                        newState[ageGroup.id] = {};
                      }
                      newState[ageGroup.id][selectedFeeId] = checked === true;
                      return newState;
                    });
                  }}
                />
                <div className="ml-2 flex-1">
                  <Label
                    htmlFor={`quick-assign-${ageGroup.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {ageGroup.name}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {ageGroup.gender} • {ageGroup.divisionCode || "No Division"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsQuickAssignOpen(false);
                setNewlyCreatedFee(null);
                setSelectedFeeId(null);
              }}
            >
              Skip for Now
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Select all age groups for convenience
                  if (ageGroupsQuery.data && selectedFeeId) {
                    setSelectedAgeGroups(prev => {
                      const newState = {...prev};
                      ageGroupsQuery.data.forEach(ageGroup => {
                        if (!newState[ageGroup.id]) {
                          newState[ageGroup.id] = {};
                        }
                        newState[ageGroup.id][selectedFeeId] = true;
                      });
                      return newState;
                    });
                  }
                }}
              >
                Select All
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await handleSaveAssignments();
                  setIsQuickAssignOpen(false);
                  setNewlyCreatedFee(null);
                }}
                disabled={updateAssignmentsMutation.isPending}
              >
                {updateAssignmentsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Assignments"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}