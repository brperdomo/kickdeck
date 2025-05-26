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

  const handleToggleEligibility = async (ageGroupId: string | number, isEligible: boolean) => {
    // Update immediately for instant UI feedback
    setLocalAgeGroups((prevGroups) => 
      prevGroups.map(group => 
        group.id === ageGroupId ? { ...group, isEligible } : group
      )
    );

    // Save immediately to the safe eligibility endpoint
    try {
      const response = await fetch('/api/safe-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          ageGroupId: ageGroupId,
          isEligible: isEligible
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update eligibility');
      }

      toast({
        title: "Updated!",
        description: `Age group eligibility ${isEligible ? 'enabled' : 'disabled'}`,
      });

      // Update parent component immediately
      const updatedGroups = localAgeGroups.map(group => 
        group.id === ageGroupId ? { ...group, isEligible } : group
      );
      onAgeGroupsChange(updatedGroups);

    } catch (error) {
      console.error('Error updating eligibility:', error);
      
      // Revert the UI change if save failed
      setLocalAgeGroups((prevGroups) => 
        prevGroups.map(group => 
          group.id === ageGroupId ? { ...group, isEligible: !isEligible } : group
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to update eligibility. Changes reverted.",
        variant: "destructive",
      });
    }
  };



  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Age Group Eligibility</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Toggle age groups on/off for registration. Changes save instantly and disabled age groups won't appear in registration forms.
        </p>
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
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Constraint-Safe System</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              No database constraint violations - age groups are hidden from registration, not deleted.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};