"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useEffect } from "react"
import { Clock, Plus, Trash2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { fetchRecentChats, deleteChat } from "@/lib/chat-service-client"
import { useToast } from "@/hooks/use-toast"
import type { Chat } from "@/lib/chat-service"

interface ChatHistoryDropdownProps {
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
}

export function ChatHistoryDropdown({ onSelectChat, onNewChat }: ChatHistoryDropdownProps) {
  const { toast } = useToast()
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch recent chats when the component mounts
  useEffect(() => {
    const loadRecentChats = async () => {
      try {
        setIsLoading(true)
        const chats = await fetchRecentChats(10)
        setRecentChats(chats)
      } catch (error) {
        console.error("Error loading recent chats:", error)
        toast({
          title: "Error",
          description: "Failed to load recent chats",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadRecentChats()
  }, [toast])

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      setRecentChats(recentChats.filter((chat) => chat.id !== chatId))

      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#111] border border-[#333]">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Chat History</div>
        <DropdownMenuSeparator className="bg-[#333]" />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs" onClick={onNewChat}>
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#333]" />
        {isLoading ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground flex items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            Loading chats...
          </div>
        ) : recentChats.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">No recent chats</div>
        ) : (
          recentChats.map((chat) => (
            <DropdownMenuItem
              key={chat.id}
              className="flex items-center justify-between cursor-pointer text-xs py-2"
              onClick={() => onSelectChat(chat)}
            >
              <span className="truncate max-w-[180px]">{chat.title}</span>
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDeleteChat(chat.id, e)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

