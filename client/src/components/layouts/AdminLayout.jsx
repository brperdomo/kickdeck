
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function AdminSidebarItem({ to, children, icon, active, className, styles, ...props }) {
  const [location] = useLocation();
  const isActive = active || (to && location === to);
  
  // Apply style classes
  const baseClasses = "inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full justify-start admin-sidebar-item";
  
  // Use the Link component from wouter for client-side navigation
  return (
    <Link 
      href={to}
      className={cn(
        baseClasses,
        isActive ? "active" : "",
        className
      )}
      style={{
        backgroundColor: isActive ? (styles?.adminNavActive || "#E6F7FF") : "transparent",
        color: styles?.adminNavText || "#000000",
      }}
      {...props}
    >
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </Link>
  );
}

export function updateAdminStyles(styles) {
  const styleElement = document.getElementById('admin-dashboard-styles');
  if (styleElement) {
    styleElement.innerHTML = `
      :root {
        --admin-nav-bg: ${styles.adminNavBackground || '#FFFFFF'};
        --admin-nav-text: ${styles.adminNavText || '#000000'};
        --admin-nav-active: ${styles.adminNavActive || '#E6F7FF'};
        --admin-nav-hover: ${styles.adminNavHover || '#f3f4f6'};
      }
      
      .admin-sidebar-item {
        transition: background-color 0.2s ease;
      }
      
      .admin-sidebar-item:hover {
        background-color: var(--admin-nav-hover) !important;
      }
      
      .admin-sidebar-item.active {
        background-color: var(--admin-nav-active) !important;
      }
    `;
  }
}

