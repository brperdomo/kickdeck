
import React from "react";
import { cn } from "@/lib/utils";

// Add CSS to use admin dashboard variables
const sidebarStyles = {
  background: 'var(--admin-nav-bg, #FFFFFF)',
  color: 'var(--admin-nav-text, #000000)',
};

const sidebarItemStyles = {
  "&:hover": {
    backgroundColor: 'var(--admin-nav-hover, #f3f4f6)',
  },
  "&.active": {
    backgroundColor: 'var(--admin-nav-active, #164e87)',
    color: '#FFFFFF',
  }
};

export function AdminLayout({ children, sidebar }) {
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r shrink-0" style={sidebarStyles}>
        {sidebar}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function AdminSidebar({ children }) {
  return (
    <div className="h-full p-4" style={sidebarStyles}>
      {children}
    </div>
  );
}

export function AdminSidebarItem({ active, className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
        active && "active",
        className
      )}
      style={active ? { ...sidebarItemStyles, ...sidebarItemStyles["&.active"] } : sidebarItemStyles}
      {...props}
    />
  );
}

