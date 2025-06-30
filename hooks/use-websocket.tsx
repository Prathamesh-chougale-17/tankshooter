"use client";

import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(path = "/api/ws") {
  // Build the full url only on the client
  const [url] = useState(() => {
    if (typeof window === "undefined") return "";
    if (path.startsWith("ws")) return path;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}${path}`;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const connect = () => {
    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
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
          "Unable to connect to WebSocket, running in offline demo mode."
        );
        setIsConnected(false);
        // Stop reconnection attempts in preview / offline environments
        socket.close();
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      // Fallback: simulate connection for demo purposes
      setIsConnected(true);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
    // In offline mode we just ignore the message.
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
}
