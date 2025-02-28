import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface Fee {
  id: number;
  name: string;
  amount: number;
  beginDate: string | null;
  endDate: string | null;
  applyToAll: boolean;
  accountingCodeId: number | null;
}

interface FeeTableProps {
  fees: Fee[];
  accountingCodes: Array<{ id: number; name: string; code: string }>;
  onUpdate: () => void;
}

export function FeeTable({ fees, accountingCodes, onUpdate }: FeeTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getAccountingCodeLabel = (id: number | null) => {
    if (!id) return "-";
    const code = accountingCodes.find((c) => c.id === id);
    return code ? `${code.code} - ${code.name}` : "-";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Begin Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Accounting Code</TableHead>
          <TableHead>Apply to All</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fees.map((fee) => (
          <TableRow key={fee.id}>
            <TableCell>{fee.name}</TableCell>
            <TableCell>{formatAmount(fee.amount)}</TableCell>
            <TableCell>{formatDate(fee.beginDate)}</TableCell>
            <TableCell>{formatDate(fee.endDate)}</TableCell>
            <TableCell>{getAccountingCodeLabel(fee.accountingCodeId)}</TableCell>
            <TableCell>{fee.applyToAll ? "Yes" : "No"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Handle edit
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => {
                    // Handle delete
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
