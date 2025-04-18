import React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column {
  key: string;
  header: React.ReactNode;
  cell: (item: any, index: number) => React.ReactNode;
  mobileLabel?: string; // Optional override for mobile card label
  hideOnMobile?: boolean; // Optional flag to hide column on mobile
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
  headerClassName?: string;
  rowClassName?: (item: any, index: number) => string;
  onRowClick?: (item: any) => void;
}

export function ResponsiveTable({
  data,
  columns,
  className,
  emptyMessage = "No data to display",
  isLoading = false,
  loadingRows = 5,
  headerClassName,
  rowClassName,
  onRowClick,
}: ResponsiveTableProps) {
  const { isMobile, isTablet } = useBreakpoint();
  
  if (!data || data.length === 0) {
    if (isLoading) {
      // Loading skeleton
      return (
        <div className={cn("w-full", className)}>
          {!isMobile ? (
            <Table>
              <TableHeader className={headerClassName}>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: loadingRows }).map((_, index) => (
                  <TableRow key={`loading-row-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={`loading-cell-${column.key}-${index}`}>
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: loadingRows }).map((_, index) => (
                <div 
                  key={`loading-card-${index}`}
                  className="mobile-table-card animate-pulse"
                >
                  {columns
                    .filter(col => !col.hideOnMobile)
                    .map((column) => (
                      <div key={`loading-card-row-${column.key}-${index}`} className="mobile-table-card__row">
                        <div className="mobile-table-card__label">{column.mobileLabel || column.header}</div>
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (isMobile) {
    // Mobile card view
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <div 
            key={`card-${index}`}
            className={cn(
              "mobile-table-card", 
              onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
            )}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map((column) => (
                <div key={`card-row-${column.key}-${index}`} className="mobile-table-card__row">
                  <div className="mobile-table-card__label">{column.mobileLabel || column.header}</div>
                  <div>{column.cell(item, index)}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // Tablet/Desktop table view
  return (
    <div className={cn("responsive-table-container", className)}>
      <Table>
        <TableHeader className={headerClassName}>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={`row-${index}`}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors",
                rowClassName && rowClassName(item, index)
              )}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column) => (
                <TableCell key={`cell-${column.key}-${index}`}>
                  {column.cell(item, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}