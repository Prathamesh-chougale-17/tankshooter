"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(url = "ws://localhost:3001/ws") {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected to", url);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };

      socket.onerror = () => {
        // Connection failed – fall back to offline mode
        console.warn(
          "Unable to connect to WebSocket server, running in offline demo mode."
        );
        setIsConnected(false);
        // Stop reconnection attempts in preview / offline environments
        socket.close();
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      // Fallback: simulate connection for demo purposes
      setIsConnected(false);
    }
  }, [url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
    // In offline mode we just ignore the message.
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
}
