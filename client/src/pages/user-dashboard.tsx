import { useState } from "react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { FileManager } from "@/components/admin/FileManager.tsx";
import UserRegistrationsView from "@/components/UserRegistrationsView";
import { UserBanner } from "@/components/user/UserBanner";
import {
  LucideHome,
  User,
  ChevronDown,
  LogOut,
  Upload,
  ListTodo,
  ClipboardList
} from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserDashboard() {
  const { user, logout } = useUser();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  const handleLogout = () => {
    setShowLogoutOverlay(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Banner */}
      <UserBanner />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-green-600">MatchPro</h2>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                <Link href="/dashboard/my-household" className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <LucideHome className="h-5 w-5" />
                  My Household
                </Link>
                <Link href="/dashboard/my-account" className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="h-5 w-5" />
                  My Account
                </Link>
              </div>
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Welcome, {user?.firstName}!
                </CardTitle>
              </CardHeader>
            </Card>
            
            {/* User Registrations Section */}
            <div className="mt-8">
              <UserRegistrationsView />
            </div>
          </div>
        </div>
      </div>

      {/* File Manager Dialog */}
      <Dialog open={showFileManager} onOpenChange={setShowFileManager}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Logo</DialogTitle>
          </DialogHeader>
          <FileManager 
            onFileSelect={(file) => {
              setSelectedLogo(file.url);
              setShowFileManager(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {showLogoutOverlay && (
        <LogoutOverlay onFinished={async () => {
          try {
            console.log("Initiating user logout process...");
            await logout();
            console.log("User logout API call completed");
            
            // After logout, we need to clear all storage and force page reload
            // to completely reset the application state and prevent back navigation
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            
            // Create cache control meta tags
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Cache-Control';
            meta.content = 'no-store, no-cache, must-revalidate, max-age=0';
            document.head.appendChild(meta);
            
            const pragmaMeta = document.createElement('meta');
            pragmaMeta.httpEquiv = 'Pragma';
            pragmaMeta.content = 'no-cache';
            document.head.appendChild(pragmaMeta);
            
            // Use replace method which doesn't preserve history
            // Redirect to root, which will show login when user is null
            window.location.replace("/");
          } catch (error) {
            console.error("User logout failed:", error);
            // Force logout by clearing everything manually as a fallback
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            
            // Use replace method which doesn't preserve history
            // Redirect to root, which will show login when user is null
            window.location.replace("/");
          }
        }} />
      )}
    </div>
  );
}