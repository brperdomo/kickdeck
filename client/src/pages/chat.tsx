import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin-dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Team Chat</h1>
        </div>
        <ChatInterface />
      </div>
    </div>
  );
}