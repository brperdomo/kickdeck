import { useState } from "react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { FileManager } from "@/components/admin/FileManager.tsx";
import UserRegistrationsView from "@/components/UserRegistrationsView";
import { MyTeams } from "@/components/member/MyTeams";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import { motion } from "framer-motion";
import { Calendar, User, UserPlus, ExternalLink, Upload, Users } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserDashboard() {
  const { user } = useUser();
  const { isMobile } = useBreakpoint();
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  // Quick access links for the dashboard
  const quickAccessLinks = [
    {
      title: "My Account",
      description: "Update your personal information and contact details",
      icon: <User className="h-8 w-8 text-primary" />,
      href: "/dashboard/my-account",
    },
    {
      title: "My Household",
      description: "Manage family members and household information",
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      href: "/dashboard/my-household",
    },
    {
      title: "My Registrations",
      description: "View your current and past event registrations",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/dashboard/registrations",
    },
    {
      title: "Team Management",
      description: "Manage your team registrations and update contact information",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/dashboard/member-roster",
    },
  ];

  return (
    <MemberLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-8 mx-auto responsive-container"
      >
        {/* Welcome Card with gradient border effect */}
        <Card className="member-card overflow-hidden border border-primary/20">
          <CardHeader className="member-card-header">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                Welcome, {user?.firstName}!
              </CardTitle>
              <CardDescription className="text-sm sm:text-lg">
                Your account dashboard with quick access to your registrations and information
              </CardDescription>
            </motion.div>
          </CardHeader>
        </Card>
        
        {/* Quick Access Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 section-header">Quick Access</h2>
          {isMobile ? (
            // Mobile Quick Access - Icon Grid Layout
            <div className="grid grid-cols-3 gap-3">
              {quickAccessLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Card className="member-card h-full flex flex-col items-center justify-center py-4 px-2">
                    <a href={link.href} className="flex flex-col items-center text-center">
                      <div className="mb-2">{link.icon}</div>
                      <CardTitle className="text-sm">{link.title}</CardTitle>
                    </a>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            // Desktop Quick Access - Detailed Cards
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickAccessLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Card className="member-card h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        {link.icon}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={link.href}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription className="mt-1">{link.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={link.href}>Go to {link.title}</a>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* My Teams Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 section-header">My Teams</h2>
          <MyTeams />
        </div>
        
        {/* User Registrations Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 section-header">My Registrations</h2>
          <Card className="member-card">
            <CardContent className={isMobile ? "p-2 sm:p-4 pt-4" : "pt-6"}>
              <UserRegistrationsView />
            </CardContent>
          </Card>
        </div>
      </motion.div>

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
    </MemberLayout>
  );
}