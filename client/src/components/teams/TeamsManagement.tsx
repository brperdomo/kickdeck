import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TeamCard } from "./TeamCard";

interface Team {
  id: number;
  name: string;
  coach?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ageGroup: string;
}

interface AgeGroup {
  id: number;
  ageGroup: string;
  gender: string;
}

interface TeamsManagementProps {
  eventId: number;
}

export function TeamsManagement({ eventId }: TeamsManagementProps) {
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("all");

  const ageGroupsQuery = useQuery<AgeGroup[]>({
    queryKey: [`/api/admin/events/${eventId}/age-groups`],
    enabled: !!eventId,
  });

  const teamsQuery = useQuery<Team[]>({
    queryKey: [`/api/admin/teams?eventId=${eventId}${selectedAgeGroupId !== "all" ? `&ageGroupId=${selectedAgeGroupId}` : ''}`],
    enabled: !!eventId,
  });

  if (ageGroupsQuery.isLoading || teamsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ageGroupsQuery.error || teamsQuery.error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load teams data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedAgeGroupId}
          onValueChange={setSelectedAgeGroupId}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Age Groups</SelectItem>
            {ageGroupsQuery.data?.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {`${group.ageGroup} ${group.gender}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamsQuery.data?.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
        {teamsQuery.data?.length === 0 && (
          <Card className="col-span-full p-6 text-center text-muted-foreground">
            No teams found
          </Card>
        )}
      </div>
    </div>
  );
}