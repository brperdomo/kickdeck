
import { useState, useEffect, useCallback } from 'react';

// Get the current host without the port
const host = window.location.hostname;
// Determine the WebSocket protocol (wss for https, ws for http)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// Determine the port from the current location or use the server port
const port = window.location.port || '5000';

// Create a WebSocket URL with fallback options
export const getWebSocketUrl = () => {
  return `${protocol}//${host}:${port}/ws`;
};

// Hook for using WebSocket
export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketUrl();
      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        // Try to reconnect after a delay
        setTimeout(() => connect(), 3000);
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
      };
      
      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err instanceof Error ? err : new Error('Unknown WebSocket error'));
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, isConnected]);

  // Connect on component mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  return { socket, isConnected, error, sendMessage, connect };
};
