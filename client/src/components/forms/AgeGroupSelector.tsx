import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface AgeGroup {
  birthYear: number;
  divisionCode: string;
  ageGroup: string;
  gender: string;
}

interface AgeGroupSelectorProps {
  selectedGroups: string[];
  onSelectionChange: (selectedDivisionCodes: string[]) => void;
}

const DEFAULT_AGE_GROUPS: AgeGroup[] = [
  { birthYear: 2021, divisionCode: 'B2021', ageGroup: 'U4', gender: 'Boys' },
  { birthYear: 2021, divisionCode: 'G2021', ageGroup: 'U4', gender: 'Girls' },
  { birthYear: 2020, divisionCode: 'B2020', ageGroup: 'U5', gender: 'Boys' },
  { birthYear: 2020, divisionCode: 'G2020', ageGroup: 'U5', gender: 'Girls' },
  { birthYear: 2019, divisionCode: 'B2019', ageGroup: 'U6', gender: 'Boys' },
  { birthYear: 2019, divisionCode: 'G2019', ageGroup: 'U6', gender: 'Girls' },
  { birthYear: 2018, divisionCode: 'B2018', ageGroup: 'U7', gender: 'Boys' },
  { birthYear: 2018, divisionCode: 'G2018', ageGroup: 'U7', gender: 'Girls' },
  { birthYear: 2017, divisionCode: 'B2017', ageGroup: 'U8', gender: 'Boys' },
  { birthYear: 2017, divisionCode: 'G2017', ageGroup: 'U8', gender: 'Girls' },
];

export function AgeGroupSelector({ 
  selectedGroups, 
  onSelectionChange 
}: AgeGroupSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedGroups);

  const handleToggle = (divisionCode: string) => {
    const updatedSelection = selected.includes(divisionCode)
      ? selected.filter(code => code !== divisionCode)
      : [...selected, divisionCode];

    setSelected(updatedSelection);
    onSelectionChange(updatedSelection);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Birth Year</TableHead>
            <TableHead>Division Code</TableHead>
            <TableHead>Age Group</TableHead>
            <TableHead>Gender</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEFAULT_AGE_GROUPS.map((group) => (
            <TableRow
              key={group.divisionCode}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleToggle(group.divisionCode)}
            >
              <TableCell>
                <Checkbox
                  checked={selected.includes(group.divisionCode)}
                  onCheckedChange={() => handleToggle(group.divisionCode)}
                />
              </TableCell>
              <TableCell>{group.birthYear}</TableCell>
              <TableCell className="font-medium">{group.divisionCode}</TableCell>
              <TableCell>{group.ageGroup}</TableCell>
              <TableCell>{group.gender}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}