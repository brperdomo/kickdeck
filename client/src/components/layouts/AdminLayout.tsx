import React, { useState } from "react";
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

function StyleSettingsView() {
    const [styles, setStyles] = useState({
        adminNavBackground: '#FFFFFF',
        adminNavText: '#000000',
        adminNavHover: '#f3f4f6',
        adminNavActive: '#164e87',
        // Add other styles here...
    });

    const handleStyleChange = (e) => {
        const { name, value } = e.target;
        setStyles(prevStyles => ({ ...prevStyles, [name]: value }));
    };

    return (
        <div>
            {/* Style settings inputs */}
            <label>
                Admin Nav Background:
                <input type="color" name="adminNavBackground" value={styles.adminNavBackground} onChange={handleStyleChange} />
            </label>
            <label>
                Admin Nav Text:
                <input type="color" name="adminNavText" value={styles.adminNavText} onChange={handleStyleChange} />
            </label>
            {/* Add other style settings inputs as needed */}
        </div>
    );
}

export function AdminLayout({ children, sidebar, styles }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: styles?.adminNavBackground || '#FFFFFF'}}> {/* Added background color to the main layout */}
      <div className="w-64 border-r shrink-0" style={sidebarStyles}>
        {sidebar}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function AdminSidebar({ children, styles }) {
  return (
    <div className="h-full p-4" style={{ ...sidebarStyles, backgroundColor: styles?.adminNavBackground || '#FFFFFF' }}> {/* Applied background color from styles */}
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
      style={{ ...sidebarItemStyles, backgroundColor: active ? styles?.adminNavActive : (styles?.adminNavHover || sidebarItemStyles["&:hover"].backgroundColor), color: active ? '#FFFFFF' : styles?.adminNavText }} {/* Applied dynamic styles */}
      {...props}
    />
  );
}

export { StyleSettingsView };