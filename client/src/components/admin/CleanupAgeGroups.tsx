
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useParams } from "wouter";

export function CleanupAgeGroups() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const eventId = params.id;

  const handleCleanup = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/age-groups/cleanup/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to clean up age groups");
      }
      
      const data = await response.json();
      
      toast({
        title: "Age Groups Cleaned Up",
        description: `Successfully reduced age groups from ${data.totalBefore} to ${data.totalAfter}`,
      });
      
      // Reload the page to see the changes
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clean up age groups",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleCleanup} 
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cleaning up...
        </>
      ) : (
        "Clean Up Age Groups"
      )}
    </Button>
  );
}
