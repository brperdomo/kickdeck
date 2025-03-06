import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgeGroupData {
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
  isSelected: boolean;
  projectedTeams: number;
  fieldSize: string;
  amountDue?: number;
  // Fees removed - now managed in Fee Management
}

const DEFAULT_AGE_GROUPS: AgeGroupData[] = [
  { ageGroup: "U4", birthYear: 2021, gender: "Boys", divisionCode: "B2021", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U4", birthYear: 2021, gender: "Girls", divisionCode: "G2021", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U5", birthYear: 2020, gender: "Boys", divisionCode: "B2020", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U5", birthYear: 2020, gender: "Girls", divisionCode: "G2020", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U6", birthYear: 2019, gender: "Boys", divisionCode: "B2019", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U6", birthYear: 2019, gender: "Girls", divisionCode: "G2019", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U7", birthYear: 2018, gender: "Boys", divisionCode: "B2018", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U7", birthYear: 2018, gender: "Girls", divisionCode: "G2018", isSelected: false, projectedTeams: 0, fieldSize: "4v4" },
  { ageGroup: "U8", birthYear: 2017, gender: "Boys", divisionCode: "B2017", isSelected: false, projectedTeams: 0, fieldSize: "5v5" },
  { ageGroup: "U8", birthYear: 2017, gender: "Girls", divisionCode: "G2017", isSelected: false, projectedTeams: 0, fieldSize: "5v5" },
  { ageGroup: "U9", birthYear: 2016, gender: "Boys", divisionCode: "B2016", isSelected: false, projectedTeams: 0, fieldSize: "7v7" },
  { ageGroup: "U9", birthYear: 2016, gender: "Girls", divisionCode: "G2016", isSelected: false, projectedTeams: 0, fieldSize: "7v7" },
  { ageGroup: "U10", birthYear: 2015, gender: "Boys", divisionCode: "B2015", isSelected: false, projectedTeams: 0, fieldSize: "7v7" },
  { ageGroup: "U10", birthYear: 2015, gender: "Girls", divisionCode: "G2015", isSelected: false, projectedTeams: 0, fieldSize: "7v7" },
  { ageGroup: "U11", birthYear: 2014, gender: "Boys", divisionCode: "B2014", isSelected: false, projectedTeams: 0, fieldSize: "9v9" },
  { ageGroup: "U11", birthYear: 2014, gender: "Girls", divisionCode: "G2014", isSelected: false, projectedTeams: 0, fieldSize: "9v9" },
  { ageGroup: "U12", birthYear: 2013, gender: "Boys", divisionCode: "B2013", isSelected: false, projectedTeams: 0, fieldSize: "9v9" },
  { ageGroup: "U12", birthYear: 2013, gender: "Girls", divisionCode: "G2013", isSelected: false, projectedTeams: 0, fieldSize: "9v9" },
  { ageGroup: "U13", birthYear: 2012, gender: "Boys", divisionCode: "B2012", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U13", birthYear: 2012, gender: "Girls", divisionCode: "G2012", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U14", birthYear: 2011, gender: "Boys", divisionCode: "B2011", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U14", birthYear: 2011, gender: "Girls", divisionCode: "G2011", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U15", birthYear: 2010, gender: "Boys", divisionCode: "B2010", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U15", birthYear: 2010, gender: "Girls", divisionCode: "G2010", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U16", birthYear: 2009, gender: "Boys", divisionCode: "B2009", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U16", birthYear: 2009, gender: "Girls", divisionCode: "G2009", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U17", birthYear: 2008, gender: "Boys", divisionCode: "B2008", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U17", birthYear: 2008, gender: "Girls", divisionCode: "G2008", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U18", birthYear: 2007, gender: "Boys", divisionCode: "B2007", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
  { ageGroup: "U18", birthYear: 2007, gender: "Girls", divisionCode: "G2007", isSelected: false, projectedTeams: 0, fieldSize: "11v11" },
];

interface AgeGroupSelectorProps {
  onAgeGroupsChange: (selectedGroups: AgeGroupData[]) => void;
}

export function AgeGroupSelector({ onAgeGroupsChange }: AgeGroupSelectorProps) {
  const [ageGroups, setAgeGroups] = useState<AgeGroupData[]>(DEFAULT_AGE_GROUPS);

  // When the component mounts, if onAgeGroupsChange is provided, call it with current age groups
  useEffect(() => {
    if (onAgeGroupsChange) {
      onAgeGroupsChange(ageGroups);
    }
  }, []);  // Only run once on mount

  // When ageGroups change, update parent if callback exists
  useEffect(() => {
    if (onAgeGroupsChange) {
      onAgeGroupsChange(ageGroups);
    }
  }, [ageGroups, onAgeGroupsChange]);

  const handleSelectionChange = (index: number, checked: boolean) => {
    // Keep all groups selected regardless of user input
    console.log("All age groups are automatically included - manual selection is disabled");

    // Pass all groups as selected to the parent component
    const allGroups = ageGroups.map(group => ({
      ...group,
      isSelected: true,
      projectedTeams: group.projectedTeams || 0,
      fieldSize: group.fieldSize || '11v11',
      scoringRule: group.scoringRule || null,
      amountDue: group.amountDue || null
    }));

    const uniqueGroups = Array.from(
      new Map(allGroups.map(group => 
        [`${group.gender}-${group.ageGroup}-${group.birthYear}`, group]
      )).values()
    );

    // Only call onAgeGroupsChange if it's a function
    if (typeof onAgeGroupsChange === 'function') {
      onAgeGroupsChange(uniqueGroups);
    }
  };

  const handleProjectedTeamsChange = (index: number, value: string) => {
    const parsedValue = parseInt(value);
    const updatedGroups = [...ageGroups];
    updatedGroups[index] = { 
      ...updatedGroups[index], 
      projectedTeams: isNaN(parsedValue) ? 0 : parsedValue 
    };
    setAgeGroups(updatedGroups);
    if (updatedGroups[index].isSelected) {
      const selectedGroups = updatedGroups.filter(group => group.isSelected);
      onAgeGroupsChange(selectedGroups);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Select</TableHead>
            <TableHead>Age Group</TableHead>
            <TableHead>Birth Year</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Division Code</TableHead>
            <TableHead>Projected Teams</TableHead>
            <TableHead>Field Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ageGroups.map((group, index) => (
            <TableRow key={`${group.gender}-${group.birthYear}`}>
              <TableCell>
                <Checkbox
                  checked={group.isSelected}
                  onCheckedChange={(checked) => handleSelectionChange(index, checked as boolean)}
                />
              </TableCell>
              <TableCell>{group.ageGroup}</TableCell>
              <TableCell>{group.birthYear}</TableCell>
              <TableCell>{group.gender}</TableCell>
              <TableCell>{group.divisionCode}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  value={group.projectedTeams}
                  onChange={(e) => handleProjectedTeamsChange(index, e.target.value)}
                  className="w-20"
                  disabled={!group.isSelected}
                />
              </TableCell>
              <TableCell>{group.fieldSize}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}