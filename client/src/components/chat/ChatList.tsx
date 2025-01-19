import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatRoom {
  room: {
    id: number;
    name: string;
    type: string;
    updatedAt: string;
  };
  unreadCount: number;
}

interface ChatListProps {
  onSelectRoom: (roomId: number) => void;
  selectedRoomId?: number;
}

export function ChatList({ onSelectRoom, selectedRoomId }: ChatListProps) {
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ['/api/chat/rooms'],
  });

  return (
    <Card>
      <ScrollArea className="h-[600px]">
        <div className="p-4 space-y-2">
          {rooms.map(({ room, unreadCount }) => (
            <Button
              key={room.id}
              variant={selectedRoomId === room.id ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => onSelectRoom(room.id)}
            >
              <span>{room.name}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </Button>
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-muted-foreground text-center p-4">
              No chat rooms available
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
