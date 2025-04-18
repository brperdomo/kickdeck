import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useMobileContext } from '@/hooks/use-mobile';

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
  emptyMessage = 'No data available',
  keyField = 'id',
  className = '',
  cardClassName = '',
  showPagination = false,
  currentPage = 1,
  setCurrentPage,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  renderRowActions
}: ResponsiveCardTableProps<T>) {
  const { isMobile, isTablet } = useMobileContext();
  const isCardView = isMobile || isTablet;

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  const renderCellContent = (row: T, column: ResponsiveCardTableColumn<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    
    const value = row[column.accessorKey as keyof T];
    if (value === undefined || value === null) {
      return null;
    }
    
    return String(value);
  };

  // Get the primary column for card title
  const getPrimaryColumn = () => columns.find(col => col.primaryColumn) || columns[0];
  
  // Get the secondary column for card subtitle if defined
  const getSecondaryColumn = () => columns.find(col => col.secondaryColumn);
  
  // Get badge columns
  const getBadgeColumns = () => columns.filter(col => col.badgeColumn);
  
  // Get data columns (excluding primary, secondary, badges, and actions)
  const getDataColumns = () => columns.filter(
    col => !col.primaryColumn && !col.secondaryColumn && !col.badgeColumn && !col.disableCards
  );

  // For direct pagination number rendering
  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    
    // Adjust startPage if endPage is maxed out
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 2);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPage}
            onClick={() => setCurrentPage?.(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipses if needed
    if (startPage > 1) {
      pageNumbers.unshift(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      pageNumbers.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    return pageNumbers;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Card View for Mobile and Tablet */}
      {isCardView ? (
        <div className="space-y-4">
          {data.map((row) => {
            const primaryColumn = getPrimaryColumn();
            const secondaryColumn = getSecondaryColumn();
            const badgeColumns = getBadgeColumns();
            const dataColumns = getDataColumns();
            
            return (
              <Card 
                key={row[keyField as keyof T] as React.Key}
                className={cn(
                  "overflow-hidden",
                  onRowClick ? "cursor-pointer" : "",
                  cardClassName
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                <div className="p-4 space-y-4">
                  {/* Header with primary column and badges */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {/* Primary column (title) */}
                      <div className="font-medium text-lg">
                        {primaryColumn && renderCellContent(row, primaryColumn)}
                      </div>
                      
                      {/* Secondary column (subtitle) */}
                      {secondaryColumn && (
                        <div className="text-sm text-muted-foreground">
                          {renderCellContent(row, secondaryColumn)}
                        </div>
                      )}
                    </div>
                    
                    {/* Badge columns */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {badgeColumns.map((column) => (
                        <div key={column.accessorKey}>
                          {renderCellContent(row, column)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Data columns */}
                  <div className="space-y-2">
                    {dataColumns.map((column) => (
                      <div 
                        key={column.accessorKey} 
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="font-medium">{column.header}:</span>
                        <span>{renderCellContent(row, column)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  {renderRowActions && (
                    <div className="pt-2 border-t mt-2">
                      {renderRowActions(row)}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // Table View for Desktop - Fallback to regular table if needed
        <div className="border rounded-md overflow-hidden">
          {/* This implementation should be handled by the regular table component */}
          <div className="text-center p-4">
            Table view for desktop - Use regular table component
          </div>
        </div>
      )}
      
      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage?.(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {renderPageNumbers()}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage?.(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}