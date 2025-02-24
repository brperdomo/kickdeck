import { useState } from "react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Menu, Home, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function UserDashboard() {
  const { user, logout } = useUser();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
    }, 1500);
  };

  const MenuItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
    <Link href={href}>
      <a className="flex items-center gap-3 p-4 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-lg">
        <Icon className="h-6 w-6" />
        <span className="text-base">{children}</span>
      </a>
    </Link>
  );

  const MobileMenu = () => (
    <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle>
            <h2 className="text-xl font-bold text-primary">MatchPro</h2>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-base">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-2 space-y-1">
            <MenuItem href="/household" icon={Home}>
              My Household
            </MenuItem>
            <MenuItem href="/account" icon={User}>
              My Account
            </MenuItem>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 p-4 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-6 w-6" />
              <span className="text-base">Logout</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-primary">MatchPro</h1>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-primary">MatchPro</h2>
            </div>
            <div className="flex-1 p-4 space-y-2">
              <MenuItem href="/household" icon={Home}>
                My Household
              </MenuItem>
              <MenuItem href="/account" icon={User}>
                My Account
              </MenuItem>
            </div>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobile && <MobileMenu />}

      {/* Main Content */}
      <main className={`p-4 ${!isMobile ? 'ml-64' : ''}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">
                Welcome, {user?.firstName}!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access your household information and manage your account settings from here.
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/household">
              <a>
                <Card className="border-none shadow-sm hover:shadow transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Home className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Household</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
            <Link href="/account">
              <a>
                <Card className="border-none shadow-sm hover:shadow transition-shadow">
                  <CardContent className="p-4 text-center">
                    <User className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Account</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          </div>
        </div>
      </main>

      {showLogoutOverlay && (
        <LogoutOverlay onFinished={() => setShowLogoutOverlay(false)} />
      )}
    </div>
  );
}