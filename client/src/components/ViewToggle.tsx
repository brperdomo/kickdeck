import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LayoutDashboard, User } from "lucide-react";

type ViewToggleProps = {
  currentView: 'admin' | 'member';
};

/**
 * ViewToggle component allows users to switch between admin and member dashboards
 * if they have permission to access both views
 */
export function ViewToggle({ currentView }: ViewToggleProps) {
  const [, navigate] = useLocation();

  const handleToggleView = () => {
    if (currentView === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/admin');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleView}
      className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
    >
      {currentView === 'admin' ? (
        <>
          <User className="h-4 w-4" />
          <span>Switch to Member View</span>
        </>
      ) : (
        <>
          <LayoutDashboard className="h-4 w-4" />
          <span>Switch to Admin View</span>
        </>
      )}
    </Button>
  );
}