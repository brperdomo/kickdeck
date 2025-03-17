import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface SidebarProps {
  activeSettingsView: string;
  setActiveView: (view: string) => void;
  setActiveSettingsView: (view: string) => void;
}

export function Sidebar({ activeSettingsView, setActiveView, setActiveSettingsView }: SidebarProps) {
  return (
    <div>
      <Button
        variant={activeSettingsView === 'emailTemplates' ? 'secondary' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveView('settings');
          setActiveSettingsView('emailTemplates');
        }}
      >
        <Mail className="mr-2 h-4 w-4" />
        Email Templates
      </Button>
      {/* Rest of the Sidebar content */}
    </div>
  );
}