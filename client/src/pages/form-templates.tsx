import { FormTemplatesView } from "@/components/admin/FormTemplatesView";
import { AdminLayout, AdminSidebar, AdminSidebarItem } from "@/components/layouts/AdminLayout.tsx";
import { useLocation } from "wouter";
import { Users, Settings, FileText, LayoutTemplate } from "lucide-react";

export default function FormTemplatesPage() {
  const [location] = useLocation();
  
  // Default admin styling
  const adminStyles = {
    adminNavBackground: '#f8f9fa',
    adminNavText: '#333333',
    adminNavActive: '#e6f7ff',
    adminNavHover: '#f0f0f0'
  };
  
  // Sidebar navigation items
  const sidebarItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutTemplate size={18} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { path: '/admin/form-templates', label: 'Form Templates', icon: <FileText size={18} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];
  
  // Create sidebar
  const sidebar = (
    <AdminSidebar styles={adminStyles}>
      <div className="mb-6 px-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav className="space-y-1">
        {sidebarItems.map(item => (
          <AdminSidebarItem 
            key={item.path}
            item={item}
            activePath={location}
            styles={adminStyles}
          />
        ))}
      </nav>
    </AdminSidebar>
  );
  
  return (
    <AdminLayout sidebar={sidebar} styles={adminStyles}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Form Templates</h1>
        <FormTemplatesView />
      </div>
    </AdminLayout>
  );
}