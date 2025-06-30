"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X } from "lucide-react"

interface ChatMessage {
  id: string
  playerName: string
  message: string
  timestamp: Date
  type: "chat" | "system" | "kill"
}

interface ChatPanelProps {
  onSendMessage: (message: string) => void
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      playerName: "System",
      message: "Welcome to the game! Use WASD to move and mouse to aim.",
      timestamp: new Date(),
      type: "system",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        playerName: "You",
        message: inputMessage.trim(),
        timestamp: new Date(),
        type: "chat",
      }

      setMessages((prev) => [...prev, newMessage])
      onSendMessage(inputMessage.trim())
      setInputMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const getMessageColor = (type: string) => {
    switch (type) {
      case "system":
        return "text-blue-400"
      case "kill":
        return "text-red-400"
      default:
        return "text-white"
    }
  }

  return (
    <Card className="w-80 h-64 bg-black/80 border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          Chat
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex flex-col h-full">
        <ScrollArea className="flex-1 mb-3" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-xs">
                <span className="text-gray-400">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>{" "}
                <span className="font-medium text-purple-400">{msg.playerName}:</span>{" "}
                <span className={getMessageColor(msg.type)}>{msg.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-xs"
            maxLength={100}
          />
          <Button onClick={handleSendMessage} size="sm" className="bg-purple-600 hover:bg-purple-700 px-3">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
