"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Document } from "./editor-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, X, Plus, Loader2, ExternalLink, FileText, History, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AssistantSidebarProps {
  document: Document
  allDocuments?: Document[]
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

export function AssistantSidebar({ document, allDocuments = [] }: AssistantSidebarProps) {
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
        documentContext: currentDocumentContext.content,
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
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-border/40">
        <h2 className="font-semibold text-lg">Assistant</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary/40">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary/40">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        <button
          className={cn(
            "flex-1 py-3 px-4 flex justify-center items-center gap-2 font-medium text-sm",
            activeTab === "chat"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare className="h-5 w-5" />
          Chat
        </button>
        <button
          className={cn(
            "flex-1 py-3 px-4 flex justify-center items-center gap-2 font-medium text-sm",
            activeTab === "research"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("research")}
        >
          <Search className="h-5 w-5" />
          Research
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Document Context Section */}
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">DOCUMENT CONTEXT</h3>
              {otherDocuments.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 flex items-center gap-1 text-xs border-border/40 hover:bg-secondary/40"
                    >
                      <Plus className="h-3 w-3" />
                      Add Document
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-border/40">
                    {otherDocuments.map((doc) => (
                      <DropdownMenuItem
                        key={doc.id}
                        onClick={() => handleToggleDocumentSource(doc)}
                        className="flex items-center gap-2 hover:bg-secondary/40"
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
            <div className="flex flex-wrap gap-2">
              {/* Current document (always included) */}
              <div className="bg-secondary/20 rounded-md py-1 px-3 text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                <span>{document.title}</span>
              </div>

              {/* Additional selected documents */}
              {documentSources.map((source) => {
                const doc = allDocuments.find((d) => d.id === source.id)
                if (!doc) return null

                return (
                  <div key={source.id} className="bg-secondary/20 rounded-md py-1 px-3 text-sm flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{doc.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 hover:bg-secondary/40"
                      onClick={() => handleToggleDocumentSource(doc)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Web Sources Section */}
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">WEB SOURCES</h3>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 flex items-center gap-1 text-xs border-border/40 hover:bg-secondary/40"
                onClick={() => {
                  if (showWebSourceInput && newWebSource) {
                    handleAddWebSource()
                  } else {
                    setShowWebSourceInput(!showWebSourceInput)
                  }
                }}
              >
                <Plus className="h-3 w-3" />
                Add URL
              </Button>
            </div>

            {webSources.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {webSources.map((source, index) => (
                  <div key={index} className="bg-secondary/20 rounded-md py-1 px-3 text-sm flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span className="truncate max-w-[150px]">{source.url}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 hover:bg-secondary/40"
                      onClick={() => handleRemoveWebSource(source.url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No web sources added. Click "Add URL" to add a source.
              </div>
            )}

            {showWebSourceInput && (
              <form onSubmit={handleAddWebSource} className="mt-2 flex gap-2">
                <Input
                  ref={webSourceInputRef}
                  value={newWebSource}
                  onChange={(e) => setNewWebSource(e.target.value)}
                  placeholder="Enter URL (https://...)"
                  className="h-8 text-sm bg-background border-border/40"
                />
                <Button type="submit" size="sm" className="h-8">
                  Add
                </Button>
              </form>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length > 0 ? (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.role === "user" ? "bg-primary/20 text-foreground ml-8" : "bg-secondary/20 mr-8"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="h-10 w-10 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Chat with your AI assistant</h3>
                <p className="text-muted-foreground mb-6 max-w-xs">
                  Discuss and refine your content with an AI assistant that understands the context of your writing.
                </p>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>• Get feedback on your writing</p>
                  <p>• Brainstorm ideas for your content</p>
                  <p>• Request suggestions for improvements</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border/40">
            <form onSubmit={handleSendMessage}>
              <div className="mb-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full border-2 border-border/40 rounded-xl p-4 h-auto text-base bg-background"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 h-auto"
                disabled={!input.trim() || isLoading}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-border/40">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the web..."
                  className="pr-16 h-10 bg-background border-border/40"
                  disabled={isSearching}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 h-8"
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Search className="h-3 w-3 mr-1" />
                  )}
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {isSearching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div key={index} className="border border-border/40 rounded-md p-3 bg-secondary/10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{result.title}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-border/40 hover:bg-secondary/40"
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
                        className="text-primary truncate hover:underline"
                      >
                        {result.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <h3 className="font-medium mb-1">Research Assistant</h3>
                <p className="text-sm max-w-xs">
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

