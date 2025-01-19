import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  content: string;
  type: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface ChatRoomProps {
  roomId: number;
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chat/rooms/${roomId}/messages`],
    enabled: !!roomId,
  });

  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket(`ws://${window.location.host}`);
    setWs(socket);

    socket.onopen = () => {
      // Join the chat room
      socket.send(JSON.stringify({
        type: 'join',
        chatRoomId: roomId,
        userId: user?.id,
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        // Update messages in cache
        queryClient.setQueryData(
          [`/api/chat/rooms/${roomId}/messages`],
          (old: Message[] = []) => [...old, data]
        );

        // Scroll to bottom
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    };

    return () => {
      socket.close();
    };
  }, [roomId, user?.id]);

  const handleSendMessage = () => {
    if (!ws || !newMessage.trim()) return;

    ws.send(JSON.stringify({
      type: 'message',
      content: newMessage.trim(),
      chatRoomId: roomId,
    }));

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.user.id === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar>
                <AvatarFallback>
                  {message.user.firstName[0]}
                  {message.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] ${
                  message.user.id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                } rounded-lg p-3`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.user.firstName} {message.user.lastName}
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
