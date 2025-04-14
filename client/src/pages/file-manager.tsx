import React from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/hooks/use-user';
import { FileManager } from '@/components/admin/file-manager';
import { AdminLayout, AdminSidebar, AdminSidebarItem } from '@/components/layouts/AdminLayout.tsx';
import { Loader2 } from 'lucide-react';

const FileManagerPage: React.FC = () => {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    } else if (!isLoading && user && !user.isAdmin) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || !user.isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <AdminLayout 
      sidebar={
        <AdminSidebar styles={{}}>
          <h2 className="text-lg font-bold mb-4">Admin</h2>
          <nav className="space-y-2">
            <AdminSidebarItem 
              activePath="/admin/file-manager"
              item={{ path: "/admin", label: "Dashboard" }}
              styles={{}}
            />
            <AdminSidebarItem 
              activePath="/admin/file-manager"
              item={{ path: "/admin/events", label: "Events" }}
              styles={{}}
            />
            <AdminSidebarItem 
              activePath="/admin/file-manager"
              item={{ path: "/admin/file-manager", label: "File Manager" }}
              styles={{}}
            />
          </nav>
        </AdminSidebar>
      }
      styles={{}}
    >
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">File Manager</h1>
        <p className="text-muted-foreground">
          Organize and manage your files with a drag-and-drop interface. Upload, download, rename, and move files between folders.
        </p>
        <FileManager />
      </div>
    </AdminLayout>
  );
};

export default FileManagerPage;