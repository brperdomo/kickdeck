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
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function UserDashboard() {
  const { user, logout } = useUser();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
    }, 1500);
  };

  const MenuItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start text-base py-6"
      >
        <Icon className="h-5 w-5 mr-3" />
        {children}
      </Button>
    </Link>
  );

  const MobileNavigation = () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-semibold">Menu</h2>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-2 py-4">
          {/* User Profile Section */}
          <div className="px-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <MenuItem href="/household" icon={Home}>
              My Household
            </MenuItem>
            <MenuItem href="/account" icon={User}>
              My Account
            </MenuItem>
          </div>

          {/* Logout Button */}
          <div className="px-2 pt-6">
            <Button
              variant="destructive"
              className="w-full py-6 text-base"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
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
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
          <MobileNavigation />
          <h1 className="text-lg font-semibold text-primary">MatchPro</h1>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </header>
      )}

      {/* Desktop Sidebar - Hidden on Mobile */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r hidden md:block">
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
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${isMobile ? 'pt-16' : 'ml-64'} p-4 md:p-6`}>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Welcome Card */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl">
                Welcome back!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg">
                What would you like to do today?
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/household">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Home className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium text-lg">Household</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/account">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <User className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium text-lg">Account</p>
                </CardContent>
              </Card>
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