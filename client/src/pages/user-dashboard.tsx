import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import {
  LucideHome,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Link } from "wouter";

export default function UserDashboard() {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-green-600">MatchPro</h2>
          </div>
          
          {/* Navigation Links */}
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

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.firstName}!</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>My Household</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Manage your household information and members.
                </p>
                <Link href="/household">
                  <Button className="mt-4">View Household</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Update your personal information and preferences.
                </p>
                <Link href="/account">
                  <Button className="mt-4">Manage Account</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
