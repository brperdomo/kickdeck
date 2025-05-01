import { useState } from "react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { FileManager } from "@/components/admin/FileManager.tsx";
import UserRegistrationsView from "@/components/UserRegistrationsView";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import { motion } from "framer-motion";
import { RecentProductUpdates } from "@/components/RecentProductUpdates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserDashboard() {
  const { user } = useUser();
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  return (
    <MemberLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-5xl mx-auto"
      >
        {/* Welcome Card */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-2xl font-bold">
              Welcome, {user?.firstName}!
            </CardTitle>
            <CardDescription>
              Your account dashboard with quick access to your registrations and information
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Product Updates - only visible to admins */}
        {user?.isAdmin && (
          <div className="mb-8">
            <RecentProductUpdates limit={3} />
          </div>
        )}
        
        {/* User Registrations Section */}
        <div className="mt-8">
          <UserRegistrationsView />
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