import { ReactNode } from "react";
import { MemberSidebar } from "./MemberSidebar";
import { motion } from "framer-motion";

interface MemberLayoutProps {
  children: ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <MemberSidebar />

      {/* Main Content */}
      <motion.main 
        className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
    </div>
  );
}