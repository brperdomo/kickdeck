import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AgeGroup, updateAgeGroupEligibilitySetting } from "../../../api/age-groups";
import { Loader2 } from "lucide-react";

interface AgeGroupEligibilityManagerProps {
  ageGroups: AgeGroup[];
  onAgeGroupsChange: (updatedAgeGroups: AgeGroup[]) => void;
  eventId: string | number;
}

export const AgeGroupEligibilityManager = ({
  ageGroups,
  onAgeGroupsChange,
  eventId
}: AgeGroupEligibilityManagerProps) => {
  const [localAgeGroups, setLocalAgeGroups] = useState<AgeGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Make sure to preserve the isEligible flag from the server
    setLocalAgeGroups(ageGroups.map(group => ({
      ...group,
      // Ensure isEligible is explicitly boolean, default to true if undefined
      isEligible: group.isEligible === undefined ? true : Boolean(group.isEligible)
    })));
  }, [ageGroups]);

  const handleToggleEligibility = (ageGroupId: string | number, isEligible: boolean) => {
    setLocalAgeGroups((prevGroups) => 
      prevGroups.map(group => 
        group.id === ageGroupId ? { ...group, isEligible } : group
      )
    );
  };

  const handleSaveEligibility = async () => {
    try {
      setIsSaving(true);
      
      // Create a composite key for each age group
      // Format: gender-birthYear-ageGroup (e.g., "male-2014-U11")
      const savePromises = localAgeGroups.map(async (group) => {
        // Generate a string-based composite ID
        const compositeId = `${group.gender.toLowerCase()}-${group.birthYear}-${group.ageGroup}`;
        
        console.log(`Updating eligibility for age group ${compositeId} to ${group.isEligible}`);
        
        return updateAgeGroupEligibilitySetting({
          eventId: eventId,
          ageGroupId: compositeId,
          isEligible: group.isEligible === undefined ? true : Boolean(group.isEligible)
        });
      });
      
      const results = await Promise.all(savePromises);
      
      // Check if all updates were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        // Update parent component with the changes
        onAgeGroupsChange(localAgeGroups);
        
        toast({
          title: "Eligibility settings saved",
          description: "Age group eligibility settings have been updated successfully.",
        });
      } else {
        throw new Error("One or more eligibility updates failed");
      }
    } catch (error) {
      console.error("Failed to save eligibility settings:", error);
      toast({
        title: "Failed to save eligibility settings",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Age Group Eligibility</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Age Group</th>
                  <th className="px-4 py-2 text-left font-medium">Division Code</th>
                  <th className="px-4 py-2 text-left font-medium">Eligible for Registration</th>
                </tr>
              </thead>
              <tbody>
                {localAgeGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No age groups have been defined for this event.
                    </td>
                  </tr>
                ) : (
                  localAgeGroups.map((group) => (
                    <tr key={group.id} className="border-b">
                      <td className="px-4 py-2">
                        {group.ageGroup} {group.gender}
                      </td>
                      <td className="px-4 py-2">{group.divisionCode || "N/A"}</td>
                      <td className="px-4 py-2">
                        <Switch
                          checked={group.isEligible === undefined ? true : group.isEligible}
                          onCheckedChange={(checked) => handleToggleEligibility(group.id, checked)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveEligibility} 
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Eligibility Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};