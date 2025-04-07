"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Document } from "./editor-container"
import { MessageSquare, Search, Clock, ChevronRight, Plus, Trash2 } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ResearchPanel } from "./research-panel"
import { ResizeHandle } from "@/components/ui/resize-handle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { fetchRecentChats, deleteChat } from "@/lib/chat-service-client"
import { useToast } from "@/hooks/use-toast"
import type { Chat } from "@/lib/chat-service"

interface AssistantSidebarProps {
  document: Document
  allDocuments?: Document[]
  onToggleSidebar: () => void
}

type WebSource = {
  url: string
  title?: string
  isLoading?: boolean
  error?: string
}

type DocumentSource = {
  id: string
  title: string
}

export function AssistantSidebar({ document, allDocuments = [], onToggleSidebar }: AssistantSidebarProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"chat" | "research">("chat")
  const [webSources, setWebSources] = useState<WebSource[]>([])
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentMessages, setCurrentMessages] = useState<any[]>([])

  // Fetch recent chats when the component mounts
  useEffect(() => {
    const loadRecentChats = async () => {
      try {
        setIsLoadingChats(true)
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
        setIsLoadingChats(false)
      }
    }

    loadRecentChats()
  }, [toast])

  const handleResize = (delta: number) => {
    setSidebarWidth((prev) => {
      // Limit the minimum and maximum width
      const newWidth = prev - delta
      return Math.min(Math.max(newWidth, 300), 600)
    })
  }

  const handleSelectChat = (chat: Chat) => {
    setCurrentChatId(chat.id)
    setCurrentMessages(chat.messages)
    toast({
      title: "Chat loaded",
      description: `Loaded chat: ${chat.title}`,
    })
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      setRecentChats(recentChats.filter((chat) => chat.id !== chatId))

      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setCurrentMessages([])
      }

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

  const handleNewChat = () => {
    setCurrentChatId(null)
    setCurrentMessages([])
  }

  return (
    <div
      className="assistant-sidebar"
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        transition: isDragging ? "none" : "width 0.1s ease-out, min-width 0.1s ease-out",
      }}
    >
      <ResizeHandle
        className="left-0"
        onResize={handleResize}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      />
      <div className="assistant-header">
        <h2 className="text-sm font-medium">Assistant</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#111] border border-[#333]">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Chat History</div>
              <DropdownMenuSeparator className="bg-[#333]" />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs" onClick={handleNewChat}>
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#333]" />
              {isLoadingChats ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">Loading chats...</div>
              ) : recentChats.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">No recent chats</div>
              ) : (
                recentChats.map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    className="flex items-center justify-between cursor-pointer text-xs py-2"
                    onClick={() => handleSelectChat(chat)}
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
          <button
            className="p-2 rounded hover:bg-[#1a1a1a] transition-colors"
            onClick={onToggleSidebar}
            title="Hide assistant sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="assistant-tabs">
        <button
          className={`assistant-tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <div className="flex items-center justify-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-sm">Chat</span>
          </div>
        </button>
        <button
          className={`assistant-tab ${activeTab === "research" ? "active" : ""}`}
          onClick={() => setActiveTab("research")}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span className="text-sm">Research</span>
          </div>
        </button>
      </div>

      {activeTab === "chat" ? (
        <ChatPanel
          document={document}
          allDocuments={allDocuments}
          webSources={webSources}
          setWebSources={setWebSources}
          documentSources={documentSources}
          setDocumentSources={setDocumentSources}
          currentChatId={currentChatId}
          initialMessages={currentMessages}
          onChatUpdated={(chatId) => {
            // Refresh the chat list when a chat is updated
            fetchRecentChats(10).then(setRecentChats).catch(console.error)
          }}
        />
      ) : (
        <ResearchPanel webSources={webSources} setWebSources={setWebSources} />
      )}
    </div>
  )
}

