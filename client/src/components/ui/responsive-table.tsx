import React, { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMobileContext } from "@/hooks/use-mobile";
import { Search, ArrowUpDown, Filter, MoreHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T = any> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  meta?: Record<string, any>;
  className?: string;
  isHiddenOnMobile?: boolean;
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableFiltering?: boolean;
  rowClassName?: (row: T) => string;
  cardView?: boolean;
  getRowId?: (row: T) => string;
  getCardTitle?: (row: T) => string;
  getCardBadge?: (row: T) => { text: string; variant?: string } | null;
  getCardSubtitle?: (row: T) => string;
  showPagination?: boolean;
  pageSize?: number;
  onSearch?: (term: string) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (column: string, value: any) => void;
  className?: string;
}

export function ResponsiveTable<T = any>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  enableSearch = false,
  searchPlaceholder = "Search...",
  enableFiltering = false,
  rowClassName,
  cardView,
  getRowId,
  getCardTitle,
  getCardBadge,
  getCardSubtitle,
  className,
  showPagination = false,
  pageSize = 10,
  onSearch,
  onSort,
  onFilter
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useMobileContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Force card view on mobile if not explicitly set
  const useCardView = cardView === undefined ? isMobile : cardView;
  
  // Filter columns for mobile view
  const visibleColumns = useMemo(() => {
    return columns.filter(col => !col.isHiddenOnMobile || !isMobile);
  }, [columns, isMobile]);
  
  // Handle local search if onSearch not provided
  const filteredData = useMemo(() => {
    if (!searchTerm || onSearch) return data;
    
    return data.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm, onSearch]);
  
  // Handle local sorting if onSort not provided
  const sortedData = useMemo(() => {
    if (!sortColumn || onSort) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];
      
      if (aValue === bValue) return 0;
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  }, [filteredData, sortColumn, sortDirection, onSort]);
  
  // Handle pagination
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, showPagination, currentPage, pageSize]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  // Handle column sort
  const handleSort = (column: string) => {
    const col = columns.find(c => c.accessorKey === column);
    if (!col?.enableSorting) return;
    
    if (sortColumn === column) {
      // Toggle direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      if (onSort) onSort(column, newDirection);
    } else {
      // New sort column
      setSortColumn(column);
      setSortDirection('asc');
      if (onSort) onSort(column, 'asc');
    }
  };
  
  // Table view rendering
  const renderTableView = () => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead 
                key={column.accessorKey}
                className={cn(
                  column.enableSorting && "cursor-pointer select-none",
                  column.className
                )}
                onClick={() => column.enableSorting && handleSort(column.accessorKey)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.enableSorting && (
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="text-center p-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <span className="mt-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="text-center p-8">
                <div className="text-muted-foreground">{emptyMessage}</div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <TableRow 
                key={getRowId ? getRowId(row) : rowIndex}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50",
                  rowClassName && rowClassName(row)
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {visibleColumns.map((column) => (
                  <TableCell key={column.accessorKey} className={column.className}>
                    {column.cell 
                      ? column.cell(row) 
                      : (row[column.accessorKey as keyof T] as any)?.toString?.() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between p-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * pageSize >= sortedData.length}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Card view rendering for mobile
  const renderCardView = () => (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="mt-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </div>
      ) : (
        paginatedData.map((row, rowIndex) => {
          const cardBadge = getCardBadge?.(row);
          
          return (
            <Card 
              key={getRowId ? getRowId(row) : rowIndex}
              className={cn(
                "overflow-hidden",
                onRowClick && "cursor-pointer hover:bg-muted/50",
                rowClassName && rowClassName(row)
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getCardTitle && (
                      <h3 className="font-medium text-md">
                        {getCardTitle(row)}
                      </h3>
                    )}
                    
                    {cardBadge && (
                      <Badge variant={cardBadge.variant as any || "outline"}>
                        {cardBadge.text}
                      </Badge>
                    )}
                  </div>
                  
                  {getCardSubtitle && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {getCardSubtitle(row)}
                    </p>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="space-y-2">
                    {visibleColumns.map((column) => (
                      <div key={column.accessorKey} className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-muted-foreground">{column.header}</div>
                        <div className="col-span-2">
                          {column.cell 
                            ? column.cell(row) 
                            : (row[column.accessorKey as keyof T] as any)?.toString?.() || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {onRowClick && (
                  <div className="flex items-center justify-end px-4 py-2 bg-muted/30 text-sm">
                    <span className="text-muted-foreground mr-1">View details</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
      
      {/* Mobile Pagination */}
      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground text-center flex-grow">
            Page {currentPage} of {Math.ceil(sortedData.length / pageSize)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * pageSize >= sortedData.length}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
  
  return (
    <div className={cn("w-full", className)}>
      {/* Search and filter controls */}
      {(enableSearch || enableFiltering) && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          {enableSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9"
              />
            </div>
          )}
          
          {enableFiltering && (
            <Button variant="outline" size="sm" className="h-10 px-3 whitespace-nowrap">
              <Filter className="mr-2 h-4 w-4" />
              <span>Filters</span>
            </Button>
          )}
        </div>
      )}
      
      {/* Render table or card view based on screen size and props */}
      {useCardView ? renderCardView() : renderTableView()}
    </div>
  );
}