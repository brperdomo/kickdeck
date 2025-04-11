import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-md">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      style={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        overflow: 'hidden'
      }}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn("[&_tr]:border-b", className)} 
    style={{
      backgroundColor: 'var(--table-header-bg, var(--admin-nav-bg, #FFFFFF))',
      color: 'var(--table-header-text, var(--admin-nav-text, #000000))',
      borderBottom: '1px solid var(--table-header-border, var(--border, #E5E7EB))'
    }}
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t font-medium [&>tr]:last:border-b-0",
      className
    )}
    style={{
      backgroundColor: 'var(--table-header-bg, var(--admin-nav-bg, #FFFFFF))',
      color: 'var(--table-header-text, var(--admin-nav-text, #000000))',
      borderTop: '1px solid var(--table-header-border, var(--border, #E5E7EB))'
    }}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors",
      className
    )}
    style={{
      borderColor: 'var(--table-border, #E5E7EB)',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--table-row-hover, var(--admin-nav-hover, #f3f4f6))';
    }}
    onMouseOut={(e) => {
      if (e.currentTarget.getAttribute('data-state') !== 'selected') {
        e.currentTarget.style.backgroundColor = '';
      }
    }}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0",
      className
    )}
    style={{
      color: 'var(--table-header-text, var(--admin-nav-text, #000000))',
    }}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm", className)}
    style={{
      color: 'var(--table-header-text, var(--admin-nav-text, #000000))'
    }}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
