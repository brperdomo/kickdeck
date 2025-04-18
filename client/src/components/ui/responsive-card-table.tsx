import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useMobileContext } from "@/hooks/use-mobile";

export interface ResponsiveCardTableColumn<T = any> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  enableSorting?: boolean;
  disableCards?: boolean; // Skip this column in card view
  primaryColumn?: boolean; // Use as title in card view
  secondaryColumn?: boolean; // Use as subtitle in card view
  badgeColumn?: boolean; // Render as badge in card view
}

interface ResponsiveCardTableProps<T = any> {
  data: T[];
  columns: ResponsiveCardTableColumn<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  keyField?: string; // The field to use as a unique key
  className?: string;
  cardClassName?: string;
  showPagination?: boolean;
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  renderRowActions?: (row: T) => React.ReactNode; // For custom action buttons
}

export function ResponsiveCardTable<T = any>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data found",
  onSearch,
  searchPlaceholder = "Search...",
  keyField = "id",
  className,
  cardClassName,
  showPagination = false,
  currentPage = 1,
  setCurrentPage,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  renderRowActions
}: ResponsiveCardTableProps<T>) {
  const { isMobile } = useMobileContext();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Handle local search if onSearch is not provided
  const filteredData = useMemo(() => {
    if (!onSearch && searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return data.filter(row => {
        return Object.entries(row as Record<string, any>).some(([key, value]) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearchTerm);
          }
          if (typeof value === 'number') {
            return value.toString().includes(lowerSearchTerm);
          }
          return false;
        });
      });
    }
    return data;
  }, [data, searchTerm, onSearch]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  // Pagination handlers
  const handlePreviousPage = () => {
    if (setCurrentPage && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (setCurrentPage && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Get primary column for card title
  const getPrimaryColumn = () => columns.find(col => col.primaryColumn);
  
  // Get secondary column for card subtitle
  const getSecondaryColumn = () => columns.find(col => col.secondaryColumn);
  
  // Get badge column for card badge
  const getBadgeColumn = () => columns.find(col => col.badgeColumn);
  
  // Helper to render cell content
  const renderCellContent = (row: T, column: ResponsiveCardTableColumn<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    
    const value = (row as any)[column.accessorKey];
    
    if (value === null || value === undefined) {
      return "-";
    }
    
    return value;
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search input */}
      {onSearch !== undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : isMobile ? (
        // Mobile card view
        <div className="space-y-3">
          {filteredData.map((row, rowIndex) => {
            const primaryCol = getPrimaryColumn() || columns[0];
            const secondaryCol = getSecondaryColumn();
            const badgeCol = getBadgeColumn();
            
            return (
              <Card 
                key={rowIndex}
                className={cn(
                  "border overflow-hidden", 
                  onRowClick && "cursor-pointer hover:border-primary transition-colors",
                  cardClassName
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                <CardContent className="p-0">
                  {/* Card header with primary and badge if available */}
                  <div className="flex items-start justify-between border-b p-4">
                    <div>
                      <div className="font-medium text-base">
                        {renderCellContent(row, primaryCol)}
                      </div>
                      
                      {secondaryCol && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {renderCellContent(row, secondaryCol)}
                        </div>
                      )}
                    </div>
                    
                    {badgeCol && (
                      <div>
                        {typeof renderCellContent(row, badgeCol) === 'string' ? (
                          <Badge variant="outline">
                            {renderCellContent(row, badgeCol)}
                          </Badge>
                        ) : (
                          renderCellContent(row, badgeCol)
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Card body with remaining columns */}
                  <div className="p-4 pt-3 space-y-2">
                    {columns.filter(col => 
                      !col.primaryColumn && 
                      !col.secondaryColumn && 
                      !col.badgeColumn && 
                      !col.disableCards
                    ).map((column, colIndex) => (
                      <div key={colIndex} className="flex justify-between items-start gap-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          {column.header}:
                        </div>
                        <div className="text-sm text-right">
                          {renderCellContent(row, column)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Row actions if provided */}
                  {renderRowActions && (
                    <div className="border-t px-4 py-3 bg-muted/10">
                      {renderRowActions(row)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Desktop table view (using standard table)
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={index} 
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                
                {renderRowActions && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={cn(
                    "border-t",
                    onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={cn("px-4 py-3 text-sm", column.className)}
                    >
                      {renderCellContent(row, column)}
                    </td>
                  ))}
                  
                  {renderRowActions && (
                    <td className="px-4 py-3 text-right">
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1 || !setCurrentPage}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || !setCurrentPage}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}