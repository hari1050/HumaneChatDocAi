"use client"

import { useState } from "react"
import type { Document } from "./editor-container"
import { MessageSquare, Search, Clock, ChevronRight } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ResearchPanel } from "./research-panel"

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
  const [activeTab, setActiveTab] = useState<"chat" | "research">("chat")
  const [webSources, setWebSources] = useState<WebSource[]>([])
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([])

  return (
    <div className="assistant-sidebar">
      <div className="assistant-header">
        <h2 className="text-sm font-medium">Assistant</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
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
        />
      ) : (
        <ResearchPanel webSources={webSources} setWebSources={setWebSources} />
      )}
    </div>
  )
}

