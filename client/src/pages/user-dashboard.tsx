import { useState } from "react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { FileManager } from "@/components/admin/FileManager";
import {
  LucideHome,
  User,
  ChevronDown,
  LogOut,
  Upload,
  Menu,
} from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function UserDashboard() {
  const { user, logout } = useUser();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
    }, 1500);
  };

  const Navigation = () => (
    <nav className="flex-1 p-4">
      <div className="space-y-2">
        <Link href="/household">
          <a className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <LucideHome className="h-5 w-5" />
            My Household
          </a>
        </Link>
        <Link href="/account">
          <a className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <User className="h-5 w-5" />
            My Account
          </a>
        </Link>
      </div>
    </nav>
  );

  const UserProfile = () => (
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
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Responsive Sidebar/Drawer */}
      {isMobile ? (
        <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                <h2 className="text-xl font-bold text-green-600">MatchPro</h2>
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col h-full">
              <Navigation />
              <UserProfile />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <div className="w-64 bg-white shadow-lg hidden md:block">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-green-600">MatchPro</h2>
            </div>
            <Navigation />
            <UserProfile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                Welcome, {user?.firstName}!
              </CardTitle>
            </CardHeader>
          </Card>
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
        <LogoutOverlay onFinished={() => setShowLogoutOverlay(false)} />
      )}
    </div>
  );
}