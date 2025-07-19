"use client"

import React, { useState, useCallback } from 'react';
import { useStateTogether, useFunctionTogether, useConnectedUsers, useMyId } from 'react-together';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { 
  MessageCircle, 
  Users, 
  Send
} from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: number;
  type?: string;
}

export function SimpleMultisynqChat({ className }: { className?: string }) {
  // Local state
  const [messageInput, setMessageInput] = useState('')
  
  // React Together integration
  const myId = useMyId()
  const connectedUsers = useConnectedUsers()
  const [messages, setMessages] = useStateTogether<ChatMessage[]>('chat-messages', [])
  const [userNicknames, setUserNicknames] = useStateTogether<Record<string, string>>('user-nicknames', {})
  
  // Use useFunctionTogether for sending messages
  const broadcastMessage = useFunctionTogether('broadcastMessage', useCallback((message: ChatMessage) => {
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) return prev
      return [...prev, message].slice(-100) // Keep last 100 messages
    })
  }, [setMessages]))

  // Derived state
  const isConnected = !!myId

  // Send message function
  const sendMessage = useCallback((text: string, type = 'text') => {
    if (!text.trim() || !isConnected || !myId) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: myId,
      nickname: userNicknames[myId] || `User${myId.slice(-4)}`,
      text: text.trim(),
      timestamp: Date.now(),
      type
    }

    broadcastMessage(message)
  }, [isConnected, myId, userNicknames, broadcastMessage])

  // Handle message input
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim())
      setMessageInput('')
    }
  }, [messageInput, sendMessage])

  // Handle enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  return (
    <div className={className}>
      <Card className="h-96 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Farm Chat
            <div className="flex items-center gap-1 ml-auto">
              <Users className="h-4 w-4" />
              <span className="text-sm">{connectedUsers.length}</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-3 p-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="text-sm">
                  <span className="font-medium text-blue-400">
                    {message.nickname}:
                  </span>{' '}
                  <span className={message.type === 'system' ? 'text-green-400' : 'text-gray-300'}>
                    {message.text}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!isConnected || !messageInput.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!isConnected && (
            <div className="text-center text-yellow-500 text-sm">
              Connecting to chat...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
