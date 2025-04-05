
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormTemplateEditor } from "@/components/admin/FormTemplateEditor";
import { AdminLayout, AdminSidebar, AdminSidebarItem } from "@/components/layouts/AdminLayout.tsx";
import { useLocation, useRoute, Link } from "wouter";
import { Users, Settings, FileText, LayoutTemplate, ArrowLeft } from "lucide-react";

export default function FormTemplateEditPage() {
  const [, params] = useRoute("/admin/form-templates/:id/edit");
  const [location, navigate] = useLocation();
  const [template, setTemplate] = useState(null);

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["form-template", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/form-templates/${params?.id}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      return response.json();
    },
    enabled: !!params?.id
  });

  useEffect(() => {
    if (data) {
      setTemplate(data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      navigate("/admin/form-templates");
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <AdminLayout sidebar={sidebar} styles={adminStyles}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/admin/form-templates" className="mr-4 text-blue-600 hover:text-blue-800">
              <ArrowLeft size={16} className="inline mr-1" /> Back to Templates
            </Link>
            <h1 className="text-2xl font-bold">Loading Template...</h1>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded mb-6 w-3/4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout sidebar={sidebar} styles={adminStyles}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/form-templates" className="mr-4 text-blue-600 hover:text-blue-800">
            <ArrowLeft size={16} className="inline mr-1" /> Back to Templates
          </Link>
          <h1 className="text-2xl font-bold">Edit Form Template</h1>
        </div>
        <FormTemplateEditor editMode={true} existingTemplate={template} />
      </div>
    </AdminLayout>
  );
}
