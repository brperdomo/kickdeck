import React from 'react';
import { 
  Calendar, 
  Shield, 
  Users, 
  Settings, 
  Home, 
  User, 
  Building2, 
  CalendarDays, 
  FileText, 
  ImageIcon,
  FormInput,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
};

interface AdminNavigationBarProps {
  activeView: string;
  onNavigate: (path: string) => void;
}

export function AdminNavigationBar({ activeView, onNavigate }: AdminNavigationBarProps) {
  // Define navigation items with their respective icons
  const navItems: NavItem[] = [
    { id: 'events', label: 'Events', icon: <Calendar className="h-5 w-5" />, path: '/admin/events' },
    { id: 'teams', label: 'Teams', icon: <Users className="h-5 w-5" />, path: '/admin/teams' },
    { id: 'administrators', label: 'Administrators', icon: <Shield className="h-5 w-5" />, path: '/admin/administrators' },
    { id: 'households', label: 'Households', icon: <Home className="h-5 w-5" />, path: '/admin/households' },
    { id: 'members', label: 'Members', icon: <User className="h-5 w-5" />, path: '/admin/members' },
    { id: 'complexes', label: 'Complexes', icon: <Building2 className="h-5 w-5" />, path: '/admin/complexes' },
    { id: 'scheduling', label: 'Scheduling', icon: <CalendarDays className="h-5 w-5" />, path: '/admin/scheduling' },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" />, path: '/admin/reports' },
    { id: 'files', label: 'File Manager', icon: <ImageIcon className="h-5 w-5" />, path: '/admin/file-manager' },
    { id: 'formTemplates', label: 'Form Templates', icon: <FormInput className="h-5 w-5" />, path: '/admin/form-templates' },
    { id: 'roles', label: 'Roles & Permissions', icon: <KeyRound className="h-5 w-5" />, path: '/admin/roles' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin/settings' },
    { id: 'account', label: 'Account', icon: <User className="h-5 w-5" />, path: '/admin/account' },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={activeView === item.id ? "secondary" : "ghost"}
          className="w-full justify-start py-2 px-3"
          onClick={() => onNavigate(item.path)}
        >
          <span className="mr-3">{item.icon}</span>
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  );
}