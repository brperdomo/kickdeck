import { useState } from "react";
import { ChatList } from "./ChatList";
import { ChatRoom } from "./ChatRoom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function ChatInterface() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={20}>
        <ChatList
          onSelectRoom={setSelectedRoomId}
          selectedRoomId={selectedRoomId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        {selectedRoomId ? (
          <ChatRoom roomId={selectedRoomId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a chat room to start messaging
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
