"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Document } from "./editor-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Search,
  X,
  Plus,
  Loader2,
  ExternalLink,
  FileText,
  Clock,
  Check,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AssistantSidebarProps {
  document: Document
  allDocuments?: Document[]
  onToggleSidebar: () => void
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [webSources, setWebSources] = useState<WebSource[]>([])
  const [newWebSource, setNewWebSource] = useState("")
  const [showWebSourceInput, setShowWebSourceInput] = useState(false)
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "research">("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const webSourceInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus web source input when shown
  useEffect(() => {
    if (showWebSourceInput && webSourceInputRef.current) {
      webSourceInputRef.current.focus()
    }
  }, [showWebSourceInput])

  // Always include the current document as context
  const currentDocumentContext = {
    id: document.id,
    title: document.title,
    content: document.content,
  }

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get document sources content
      const docSourcesWithContent = documentSources.map((source) => {
        const doc = allDocuments.find((d) => d.id === source.id)
        return {
          id: source.id,
          title: source.title,
          content: doc?.content || "",
        }
      })

      // Prepare chat request - simplified to just include document and web sources
      const chatRequest = {
        messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        documentContext: {
          title: currentDocumentContext.title,
          content: currentDocumentContext.content,
        },
        webSources: webSources.map((source) => ({ url: source.url })),
        documentSources: docSourcesWithContent,
      }

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response from AI")
      }

      const data = await response.json()

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle adding a web source
  const handleAddWebSource = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!newWebSource.trim()) {
      setShowWebSourceInput(false)
      return
    }

    // Validate URL
    try {
      new URL(newWebSource)
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      })
      return
    }

    // Add web source
    setWebSources((prev) => [
      ...prev,
      {
        url: newWebSource,
        isLoading: false,
      },
    ])

    setNewWebSource("")
    setShowWebSourceInput(false)
  }

  // Handle removing a web source
  const handleRemoveWebSource = (url: string) => {
    setWebSources((prev) => prev.filter((source) => source.url !== url))
  }

  // Handle toggling a document source
  const handleToggleDocumentSource = (doc: Document) => {
    setDocumentSources((prev) => {
      const exists = prev.some((source) => source.id === doc.id)

      if (exists) {
        return prev.filter((source) => source.id !== doc.id)
      } else {
        return [...prev, { id: doc.id, title: doc.title }]
      }
    })
  }

  // Handle web search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch("/api/web-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to perform web search")
      }

      const data = await response.json()

      if (data.results && Array.isArray(data.results)) {
        setSearchResults(data.results)
      } else {
        console.error("Unexpected search results format:", data)
        toast({
          title: "Search Error",
          description: "Received unexpected search results format",
          variant: "destructive",
        })
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error performing search:", error)
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to perform web search",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle adding a search result as a web source
  const handleAddSearchResult = (url: string) => {
    if (webSources.some((source) => source.url === url)) {
      toast({
        title: "Already Added",
        description: "This URL is already in your web sources",
      })
      return
    }

    setWebSources((prev) => [...prev, { url }])

    toast({
      title: "Source Added",
      description: "The web source has been added to your context",
    })
  }

  // Get other documents (excluding current document)
  const otherDocuments = allDocuments.filter((doc) => doc.id !== document.id)

  // Check if a document is selected as context
  const isDocumentSelected = (docId: string) => {
    return documentSources.some((source) => source.id === docId)
  }

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
        <div className="assistant-content">
          <div className="assistant-section">
            <div className="assistant-section-header">
              <span className="assistant-section-title text-xs">DOCUMENT CONTEXT</span>
              {otherDocuments.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 flex items-center gap-1 text-xs hover:bg-[#2a2a2a]"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-[#2a2a2a]">
                    {otherDocuments.map((doc) => (
                      <DropdownMenuItem
                        key={doc.id}
                        onClick={() => handleToggleDocumentSource(doc)}
                        className="flex items-center gap-2 hover:bg-[#2a2a2a]"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          {isDocumentSelected(doc.id) && <Check className="h-3 w-3" />}
                        </div>
                        <FileText className="h-4 w-4 mr-1" />
                        {doc.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="document-tag">
                <FileText className="h-3 w-3 mr-1" />
                <span>{document.title}</span>
              </div>

              {documentSources.map((source) => {
                const doc = allDocuments.find((d) => d.id === source.id)
                if (!doc) return null

                return (
                  <div key={source.id} className="document-tag">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>{doc.title}</span>
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleDocumentSource(doc)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="assistant-section">
            <div className="assistant-section-header">
              <span className="assistant-section-title text-xs">WEB SOURCES</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 flex items-center gap-1 text-xs hover:bg-[#2a2a2a]"
                onClick={() => {
                  if (showWebSourceInput && newWebSource) {
                    handleAddWebSource()
                  } else {
                    setShowWebSourceInput(!showWebSourceInput)
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {webSources.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {webSources.map((source, index) => (
                  <div key={index} className="document-tag">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[150px]">{source.url}</span>
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveWebSource(source.url)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="web-source-empty mt-2">No web sources added. Click + to add a source.</div>
            )}

            {showWebSourceInput && (
              <form onSubmit={handleAddWebSource} className="mt-2 flex gap-2">
                <Input
                  ref={webSourceInputRef}
                  value={newWebSource}
                  onChange={(e) => setNewWebSource(e.target.value)}
                  placeholder="Enter URL (https://...)"
                  className="h-8 text-sm bg-[#1a1a1a] border-none"
                />
                <Button type="submit" size="sm" className="h-8 bg-white text-black hover:bg-white/90">
                  Add
                </Button>
              </form>
            )}
          </div>

          {messages.length > 0 ? (
            <div className="assistant-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg mb-4 ${message.role === "user" ? "bg-[#1a1a1a] ml-8" : "bg-[#111] mr-8"}`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="empty-state">
              <MessageSquare className="empty-state-icon" />
              <h3 className="empty-state-title">Chat with your AI assistant</h3>
              <p className="empty-state-description">
                Discuss and refine your content with an AI assistant that understands the context of your writing.
              </p>
              <div className="empty-state-suggestions">
                <div className="empty-state-suggestion">Get feedback on your writing</div>
                <div className="empty-state-suggestion">Brainstorm ideas for your content</div>
                <div className="empty-state-suggestion">Request suggestions for improvements</div>
              </div>
            </div>
          )}

          <div className="assistant-input">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="assistant-input-field"
                disabled={isLoading}
              />
              <button type="submit" className="assistant-send-button" disabled={!input.trim() || isLoading}>
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="assistant-content">
          <div className="assistant-section">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the web..."
                className="h-9 bg-[#1a1a1a] border-none"
                disabled={isSearching}
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-white text-black hover:bg-white/90"
                disabled={!searchQuery.trim() || isSearching}
              >
                {isSearching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                Search
              </Button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isSearching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div key={index} className="border border-[#2a2a2a] rounded-md p-3 bg-[#0a0a0a]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{result.title}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-[#1a1a1a] hover:bg-[#1a1a1a]"
                        onClick={() => handleAddSearchResult(result.url)}
                      >
                        Add Source
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{result.snippet}</p>
                    <div className="flex items-center text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 truncate hover:underline"
                      >
                        {result.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search className="empty-state-icon" />
                <h3 className="empty-state-title">Research Assistant</h3>
                <p className="empty-state-description">
                  Search the web and explore topics in depth to enhance your document with accurate information.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

