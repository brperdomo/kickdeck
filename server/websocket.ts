import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import { db } from '@db';
import { messages, files } from '@db/schema';
import { eq } from 'drizzle-orm';

interface ChatClient extends WebSocket {
  userId?: number;
  chatRoomId?: number;
}

interface ChatMessage {
  type: 'message' | 'join' | 'leave';
  chatRoomId: number;
  content?: string;
  userId?: number;
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    verifyClient: ({ req }, done) => {
      // Skip verification for Vite HMR
      if (req.headers['sec-websocket-protocol'] === 'vite-hmr') {
        done(false); // Reject this connection, let Vite handle it
        return;
      }
      done(true); // Accept chat connections
    }
  });

  wss.on('connection', (ws: ChatClient) => {
    console.log('New chat WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const message: ChatMessage = JSON.parse(data);

        switch (message.type) {
          case 'join':
            ws.chatRoomId = message.chatRoomId;
            ws.userId = message.userId;
            // Notify others in the room
            broadcastToRoom(wss, message.chatRoomId, {
              type: 'system',
              content: `User ${message.userId} joined the chat`,
              userId: message.userId,
              chatRoomId: message.chatRoomId
            });
            break;

          case 'message':
            if (!ws.chatRoomId || !ws.userId || !message.content) return;

            try {
              // Store message in database
              const [newMessage] = await db.insert(messages).values({
                chatRoomId: ws.chatRoomId,
                userId: ws.userId,
                content: message.content,
                type: 'text',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }).returning();

              // Broadcast message to all clients in the room
              broadcastToRoom(wss, ws.chatRoomId, {
                type: 'message',
                content: message.content,
                userId: ws.userId,
                chatRoomId: ws.chatRoomId,
                messageId: newMessage.id
              });
            } catch (error) {
              console.error('Error storing message:', error);
              ws.send(JSON.stringify({
                type: 'error',
                content: 'Failed to save message'
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Failed to process message'
        }));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      if (ws.chatRoomId && ws.userId) {
        broadcastToRoom(wss, ws.chatRoomId, {
          type: 'system',
          content: `User ${ws.userId} left the chat`,
          userId: ws.userId,
          chatRoomId: ws.chatRoomId
        });
      }
    });
  });

  return wss;
}

function broadcastToRoom(wss: WebSocketServer, roomId: number, message: any) {
  wss.clients.forEach((client: ChatClient) => {
    if (client.chatRoomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}