import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { EventTab } from "@/components/forms/event-form-types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Check, Users, Calendar, Flag, Settings, Building, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventFormLayoutProps {
  children: ReactNode;
  activeTab: EventTab;
  completedTabs: EventTab[];
  onTabChange: (tab: EventTab) => void;
  isEdit?: boolean;
}

// Sidebar animation variants
const sidebarVariants = {
  hidden: { 
    opacity: 0,
    x: -20,
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
};

const tabItemVariants = {
  hidden: { 
    opacity: 0,
    x: -20,
    filter: "blur(4px)"
  },
  visible: (index: number) => ({ 
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { 
      delay: 0.1 + (index * 0.05),
      duration: 0.4,
      type: "spring", 
      stiffness: 120,
      damping: 15
    }
  })
};

// Get icon for tab
const getTabIcon = (tab: EventTab) => {
  switch(tab) {
    case 'information': return <Calendar className="h-4 w-4" />;
    case 'age-groups': return <Users className="h-4 w-4" />;
    case 'scoring': return <Flag className="h-4 w-4" />;
    case 'complexes': return <Building className="h-4 w-4" />;
    case 'settings': return <Settings className="h-4 w-4" />;
    case 'administrators': return <User className="h-4 w-4" />;
    default: return <Plus className="h-4 w-4" />;
  }
};

// Get nice label for tab
const getTabLabel = (tab: EventTab) => {
  switch(tab) {
    case 'information': return 'Information';
    case 'age-groups': return 'Age Groups';
    case 'scoring': return 'Scoring Rules';
    case 'complexes': return 'Facilities';
    case 'settings': return 'Settings';
    case 'administrators': return 'Admins';
    default: return tab;
  }
};

export const EventFormLayout = ({ 
  children, 
  activeTab, 
  completedTabs, 
  onTabChange,
  isEdit = false 
}: EventFormLayoutProps) => {
  const [, navigate] = useLocation();
  
  // All tabs in order
  const TAB_ORDER: EventTab[] = [
    'information', 
    'age-groups', 
    'scoring', 
    'complexes', 
    'settings', 
    'administrators'
  ];

  // Handle back button click
  const handleBack = () => {
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit Event" : "Create Event"}
          </h1>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation */}
          <motion.div 
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="w-full md:w-64 bg-card border rounded-xl p-3 shadow-sm flex-shrink-0 self-start sticky top-24"
          >
            <div className="flex flex-col gap-2">
              {TAB_ORDER.map((tab, index) => (
                <motion.div
                  key={tab}
                  custom={index}
                  variants={tabItemVariants}
                  whileHover={{ x: 5 }}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start relative overflow-hidden group",
                      activeTab === tab 
                        ? "font-medium" 
                        : "opacity-80 hover:opacity-100"
                    )}
                    onClick={() => onTabChange(tab)}
                    style={{
                      backgroundColor: activeTab === tab 
                        ? 'rgba(79, 70, 229, 0.15)' 
                        : 'transparent',
                      color: activeTab === tab 
                        ? '#4F46E5' 
                        : undefined,
                      boxShadow: activeTab === tab ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none',
                      borderRadius: '0.375rem',
                      padding: '0.75rem 0.875rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Active indicator for current tab */}
                    {activeTab === tab && (
                      <>
                        <motion.div 
                          className="absolute left-0 top-[15%] bottom-[15%] w-1 rounded-full"
                          style={{ 
                            background: 'linear-gradient(to bottom, #4f46e5, #a78bfa)'
                          }}
                          initial={{ scaleY: 0, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        />
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-indigo-600/0 via-indigo-600/30 to-indigo-600/0 rounded-md" />
                      </>
                    )}
                    
                    {/* Content with icon and label */}
                    <div className="flex items-center gap-3">
                      <div 
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-md",
                          activeTab === tab 
                            ? "bg-gradient-to-br from-indigo-600/90 to-indigo-800/90 text-white shadow" 
                            : "bg-gray-200/50 dark:bg-gray-800/50"
                        )}
                      >
                        {getTabIcon(tab)}
                      </div>
                      <span>{getTabLabel(tab)}</span>
                    </div>
                    
                    {/* Completed checkmark */}
                    {completedTabs.includes(tab) && activeTab !== tab && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Main content */}
          <motion.div 
            className="flex-grow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="bg-card border rounded-xl shadow-sm p-6">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};