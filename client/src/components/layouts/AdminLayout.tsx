import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from 'wouter';

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
            <label>
                Admin Nav Hover:
                <input type="color" name="adminNavHover" value={styles.adminNavHover} onChange={handleStyleChange} />
            </label>
            <label>
                Admin Nav Active:
                <input type="color" name="adminNavActive" value={styles.adminNavActive} onChange={handleStyleChange} />
            </label>
            {/* Add other style settings inputs as needed */}
        </div>
    );
}

export function AdminLayout({ children, sidebar, styles }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: styles?.adminNavBackground || '#FFFFFF'}}> 
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
    <div className="h-full p-4" style={{ ...sidebarStyles, backgroundColor: styles?.adminNavBackground || '#FFFFFF' }}> 
      {children}
    </div>
  );
}

export function AdminSidebarItem({ activePath, item, styles, ...props }) { // Removed active prop
  return (
    <Link
      href={item.path} // Use href for Link component (proper for wouter)
      key={item.path}
      className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-colors`}
      style={{
        backgroundColor: activePath === item.path ? (styles?.adminNavActive || '#E6F7FF') : 'transparent',
        color: activePath === item.path ? (styles?.adminNavText || '#000000') : (styles?.adminNavText || '#666666'),
        fontWeight: activePath === item.path ? 'medium' : 'normal',
      }}
      onMouseOver={(e) => {
        if (activePath !== item.path) {
          e.currentTarget.style.backgroundColor = styles?.adminNavHover || '#f3f4f6';
        }
      }}
      onMouseOut={(e) => {
        if (activePath !== item.path) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      {...props}
    >
      {item.icon && <span className="mr-2">{item.icon}</span>}
      {item.label} {/* Added item.label to display link text */}
    </Link>
  );
}

export { StyleSettingsView };