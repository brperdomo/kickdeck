import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  FileText,
  Users,
  Layers,
  Trophy,
  MapPin,
  Settings,
  CreditCard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type EventTab, TAB_ORDER } from "@/components/forms/event-form-types";

// Tab configuration for edit mode
const EDIT_TAB_CONFIG: Record<
  EventTab,
  { label: string; shortLabel: string; icon: React.ElementType }
> = {
  information: { label: "Event Information", shortLabel: "Info", icon: FileText },
  "age-groups": { label: "Age Groups", shortLabel: "Ages", icon: Users },
  flights: { label: "Flights", shortLabel: "Flights", icon: Layers },
  scoring: { label: "Scoring", shortLabel: "Scoring", icon: Trophy },
  complexes: { label: "Venues & Fields", shortLabel: "Venues", icon: MapPin },
  settings: { label: "Settings", shortLabel: "Settings", icon: Settings },
  banking: { label: "Banking", shortLabel: "Banking", icon: CreditCard },
  administrators: { label: "Administrators", shortLabel: "Admins", icon: Shield },
};

interface EventEditLayoutProps {
  children: React.ReactNode;
  title: string;
  activeTab: EventTab;
  onTabChange: (tab: EventTab) => void;
  tabs: EventTab[];
  onSave: () => void;
  isSaving: boolean;
}

export function EventEditLayout({
  children,
  title,
  activeTab,
  onTabChange,
  tabs,
  onSave,
  isSaving,
}: EventEditLayoutProps) {
  const [, setLocation] = useLocation();
  const tabConfig = EDIT_TAB_CONFIG[activeTab];

  // Apply dashboard dark theme to body for portalled elements
  useEffect(() => {
    document.body.classList.add("dashboard-dark-active");
    return () => {
      document.body.classList.remove("dashboard-dark-active");
    };
  }, []);

  return (
    <div
      className="min-h-screen dashboard-dark relative overflow-x-hidden"
      style={{
        backgroundColor: "#0f0f1a",
        backgroundImage: [
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 3px)",
          "linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)",
          "linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%)",
        ].join(", "),
        backgroundSize: "100% 3px, 60px 60px, 60px 60px, 100% 100%",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: "8%",
          right: "10%",
          width: "250px",
          height: "250px",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: "15%",
          left: "5%",
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Sticky header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(15, 15, 35, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.1)",
          boxShadow:
            "0 4px 30px rgba(0,0,0,0.3), 0 0 15px rgba(124,58,237,0.05)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-violet-500/10"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div
              className="h-5 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(124,58,237,0) 0%, rgba(124,58,237,0.3) 50%, rgba(124,58,237,0) 100%)",
              }}
            />
            <h1 className="text-base sm:text-lg font-semibold text-white">
              {title}
            </h1>
          </div>

          {/* Active tab name badge */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span className="text-violet-300 font-medium">
              {tabConfig?.label}
            </span>
          </div>
        </div>
      </header>

      {/* Horizontal tab navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const config = EDIT_TAB_CONFIG[tab];
            const isActive = activeTab === tab;
            const Icon = config.icon;

            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(109,40,217,0.15) 100%)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "rgba(156, 163, 175, 0.8)",
                  border: isActive
                    ? "1px solid rgba(124,58,237,0.3)"
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? "0 0 15px rgba(124,58,237,0.15), 0 0 30px rgba(124,58,237,0.05)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(156, 163, 175, 0.8)";
                  }
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.shortLabel}</span>
                {/* Mobile: show only icon */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.6) 50%, rgba(124,58,237,0) 100%)",
                    }}
                    layoutId="editTabIndicator"
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab title + description */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <motion.div
          key={activeTab + "-title"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {tabConfig?.label}
          </h2>
        </motion.div>
      </div>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
        <div
          className="rounded-xl p-4 sm:p-6 md:p-8"
          style={{
            background: "rgba(15, 15, 35, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 0 30px rgba(124,58,237,0.08), 0 0 60px rgba(6,182,212,0.04), 0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {children}
        </div>
      </main>

      {/* Sticky bottom footer with Save button */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "rgba(15, 15, 35, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(124, 58, 237, 0.1)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.3)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Left: Back to dashboard */}
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600/50 text-gray-300 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/30"
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          {/* Right: Save Changes */}
          <Button
            size="sm"
            className="px-6 font-medium"
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow:
                "0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)",
            }}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* Floor grid effect */}
      <div className="neon-floor-grid" aria-hidden="true" />
    </div>
  );
}
