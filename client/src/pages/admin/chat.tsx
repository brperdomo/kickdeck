
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";

export default function AdminChatPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Admin Chat</h2>
      </div>

      <div className="bg-background rounded-lg border shadow-sm h-[calc(100vh-200px)]">
        <ChatInterface />
      </div>
    </div>
  );
}
