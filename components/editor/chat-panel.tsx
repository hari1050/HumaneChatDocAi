"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Document } from "./editor-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Plus, Loader2, ExternalLink, FileText, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface ChatPanelProps {
  document: Document
  allDocuments: Document[]
  webSources: WebSource[]
  setWebSources: React.Dispatch<React.SetStateAction<WebSource[]>>
  documentSources: DocumentSource[]
  setDocumentSources: React.Dispatch<React.SetStateAction<DocumentSource[]>>
}

export function ChatPanel({
  document,
  allDocuments,
  webSources,
  setWebSources,
  documentSources,
  setDocumentSources,
}: ChatPanelProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [newWebSource, setNewWebSource] = useState("")
  const [showWebSourceInput, setShowWebSourceInput] = useState(false)
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

  // Get other documents (excluding current document)
  const otherDocuments = allDocuments.filter((doc) => doc.id !== document.id)

  // Check if a document is selected as context
  const isDocumentSelected = (docId: string) => {
    return documentSources.some((source) => source.id === docId)
  }

  return (
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
  )
}

