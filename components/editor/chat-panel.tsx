"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Document } from "./editor-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Plus, Loader2, ExternalLink, FileText, Check, Pen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageActions } from "./message-actions"
import { createChat, updateChat, generateChatTitle } from "@/lib/chat-service-client"
import { addToDocumentContextEvent } from "./text-editor" // Import the event name

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
  currentChatId?: string | null
  initialMessages?: Message[]
  onChatUpdated?: (chatId: string) => void
}

export function ChatPanel({
  document,
  allDocuments,
  webSources,
  setWebSources,
  documentSources,
  setDocumentSources,
  currentChatId = null,
  initialMessages = [],
  onChatUpdated,
}: ChatPanelProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [newWebSource, setNewWebSource] = useState("")
  const [showWebSourceInput, setShowWebSourceInput] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(currentChatId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const webSourceInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [contextSnippets, setContextSnippets] = useState<string[]>([])

  // Listen for the custom event to add text to document context
  useEffect(() => {
    const handleAddToDocumentContext = (event: CustomEvent) => {
      const { text } = event.detail

      // Add the text as a context snippet
      setContextSnippets((prev) => [...prev, text])

      // Show a toast notification
      toast({
        title: "Context Added",
        description: "Text has been added to document context",
      })
    }

    // Add event listener
    window.addEventListener(addToDocumentContextEvent, handleAddToDocumentContext as EventListener)

    // Clean up
    return () => {
      window.removeEventListener(addToDocumentContextEvent, handleAddToDocumentContext as EventListener)
    }
  }, [toast])

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`
    }
  }

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Update chatId when currentChatId changes
  useEffect(() => {
    setChatId(currentChatId)
  }, [currentChatId])

  // Adjust textarea height when input changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  // Scroll to bottom when messages change or when streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  // Focus web source input when shown
  useEffect(() => {
    if (showWebSourceInput && webSourceInputRef.current) {
      webSourceInputRef.current.focus()
    }
  }, [showWebSourceInput])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Always include the current document as context
  const currentDocumentContext = {
    id: document.id,
    title: document.title,
    content: document.content,
  }

  // Function to extract JSON objects from a string that might contain multiple JSON objects
  const extractJsonObjects = (str: string): { objects: any[]; remainingStr: string } => {
    const objects: any[] = []
    let remainingStr = str
    let startIndex = 0

    while (startIndex < remainingStr.length) {
      try {
        // Try to find the start of a JSON object
        const openBraceIndex = remainingStr.indexOf("{", startIndex)
        if (openBraceIndex === -1) break

        // Try to parse from this position to find a valid JSON object
        let endIndex = openBraceIndex + 1
        let openBraces = 1

        // Find the matching closing brace
        while (endIndex < remainingStr.length && openBraces > 0) {
          if (remainingStr[endIndex] === "{") openBraces++
          if (remainingStr[endIndex] === "}") openBraces--
          endIndex++
        }

        if (openBraces === 0) {
          // We found a potential JSON object, try to parse it
          try {
            const jsonStr = remainingStr.substring(openBraceIndex, endIndex)
            const obj = JSON.parse(jsonStr)
            objects.push(obj)

            // Move past this JSON object for next iteration
            startIndex = endIndex

            // Remove the processed part from the remaining string if this is our first object
            if (objects.length === 1) {
              remainingStr = remainingStr.substring(endIndex)
              startIndex = 0
            }
          } catch (e) {
            // Not valid JSON, move to the next character
            startIndex = openBraceIndex + 1
          }
        } else {
          // No matching closing brace found, move to the next character
          startIndex = openBraceIndex + 1
        }
      } catch (e) {
        // Error in processing, move to the next character
        startIndex++
      }
    }

    return { objects, remainingStr }
  }

  // Function to save chat to database
  const saveChat = async (newMessages: Message[]) => {
    try {
      if (chatId) {
        // Update existing chat
        await updateChat(chatId, { messages: newMessages })
      } else {
        // Create new chat with a title based on the first user message
        const firstUserMessage = newMessages.find((m) => m.role === "user")
        if (firstUserMessage) {
          const title = generateChatTitle(firstUserMessage.content)
          const newChat = await createChat(document.id, title, newMessages[0])
          setChatId(newChat.id)

          // Notify parent component that a chat was created
          if (onChatUpdated) {
            onChatUpdated(newChat.id)
          }
        }
      }
    } catch (error) {
      console.error("Error saving chat:", error)
      toast({
        title: "Error",
        description: "Failed to save chat history",
        variant: "destructive",
      })
    }
  }

  // Function to render HTML content safely with proper spacing
  const renderHtmlContent = (content: string) => {
    // Add space after each closing paragraph tag if not already present
    const formattedContent = content.replace(/<\/p>(?!\s)/g, "</p> ");
    return { __html: formattedContent };
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

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)
    setStreamingMessage("") // Start with empty string

    // Create a new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // Prepare chat request with your existing logic
      const chatRequest = {
        messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        documentContext: {
          title: document.title,
          content: document.content,
        },
        webSources: webSources.map((source) => ({ url: source.url })),
        documentSources: documentSources.map((source) => {
          const doc = allDocuments.find((d) => d.id === source.id)
          return {
            id: source.id,
            title: source.title,
            content: doc?.content || "",
          }
        }),
        // Add context snippets to the request
        contextSnippets: contextSnippets,
      }

      // Send request to API with streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatRequest),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response from AI")
      }

      // Process the streaming response - SIMPLIFIED VERSION
      const reader = response.body.getReader()
      let fullText = ""
      let buffer = ""
      let finalText = null

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Convert the chunk to text and add to buffer
          buffer += new TextDecoder().decode(value)

          // Simple JSON extraction - one object at a time
          while (buffer.includes("{") && buffer.includes("}")) {
            const startIndex = buffer.indexOf("{")
            const endIndex = buffer.indexOf("}", startIndex) + 1

            if (endIndex > startIndex) {
              try {
                // Try to parse this as JSON
                const jsonStr = buffer.substring(startIndex, endIndex)
                const data = JSON.parse(jsonStr)

                // Update the message content based on what we received
                if (data.chunk) {
                  fullText += data.chunk
                  setStreamingMessage(fullText)
                }

                if (data.done && data.analysis) {
                  finalText = data.analysis
                  setStreamingMessage(finalText)
                } else if (data.done && data.fullText) {
                  finalText = data.fullText
                  setStreamingMessage(finalText)
                }

                // Remove the processed part from the buffer
                buffer = buffer.substring(endIndex)
              } catch (e) {
                // If parsing fails, skip this character and try again
                buffer = buffer.substring(startIndex + 1)
              }
            } else {
              // No complete JSON object found, wait for more data
              break
            }
          }
        }

        // Add the final message when streaming is complete
        const responseText = finalText || fullText
        if (responseText.trim()) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: responseText,
          }

          // Clear streaming message first to avoid duplication
          setStreamingMessage(null)

          // Update messages state with the new AI message
          const newMessages = [...updatedMessages, aiMessage]
          setMessages(newMessages)

          // Clear context snippets after they've been used
          try {
            if (chatId) {
              // Update existing chat with all messages
              await updateChat(chatId, { messages: newMessages })
            } else {
              // Create a new chat with all messages at once
              const title = generateChatTitle(updatedMessages[0].content)
              const newChat = await createChat(document.id, title, newMessages)
              setChatId(newChat.id)
            }

            // Notify parent component that the chat was updated
            if (onChatUpdated && chatId) {
              onChatUpdated(chatId)
            }
          } catch (error) {
            console.error("Error saving chat:", error)
            toast({
              title: "Error",
              description: "Failed to save chat",
              variant: "destructive",
            })
          }
        }
      } catch (streamError) {
        console.error("Error processing stream:", streamError)

        // If we have partial content, still show it
        if (fullText.trim()) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: fullText + "\n\n[Error: Message was cut off due to a technical issue]",
          }
          setStreamingMessage(null)

          const newMessages = [...updatedMessages, aiMessage]
          setMessages(newMessages)

          // Save the complete conversation including the partial AI response
          if (chatId) {
            await updateChat(chatId, { messages: newMessages })

            // Notify parent component that the chat was updated
            if (onChatUpdated) {
              onChatUpdated(chatId)
            }
          }
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Request was aborted")
        return
      }

      console.error("Error sending message:", error)

      // Add an error message from the assistant to the chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "<p>I'm sorry, I encountered an error processing your request. Please try refreshing the page or contact support if the issue persists.</p>",
      }

      // Clear streaming message first
      setStreamingMessage(null)

      // Add the error message to the chat
      const newMessages = [...updatedMessages, errorMessage]
      setMessages(newMessages)

      // Save the error message to the chat history
      try {
        if (chatId) {
          // Update existing chat with all messages
          await updateChat(chatId, { messages: newMessages })
        } else {
          // Create a new chat with all messages at once
          const title = generateChatTitle(updatedMessages[0].content)
          const newChat = await createChat(document.id, title, newMessages)
          setChatId(newChat.id)
        }

        // Notify parent component that the chat was updated
        if (onChatUpdated && chatId) {
          onChatUpdated(chatId)
        }
      } catch (saveError) {
        console.error("Error saving chat with error message:", saveError)
      }

      // Also show toast notification
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setStreamingMessage(null)
      abortControllerRef.current = null
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

  // Handle removing a context snippet
  const handleRemoveContextSnippet = (index: number) => {
    setContextSnippets((prev) => prev.filter((_, i) => i !== index))
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

          {/* Display context snippets */}
          {contextSnippets.map((snippet, index) => (
            <div key={`snippet-${index}`} className="document-tag-selected-text bg-blue-500/20 border-white-500/30">
              <Pen className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[150px]" title={snippet}>
                {snippet.length > 20 ? snippet.substring(0, 20) + "..." : snippet}
              </span>
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveContextSnippet(index)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
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

      {messages.length > 0 || streamingMessage !== null ? (
        <div className="assistant-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg mb-4 ${message.role === "user" ? "bg-[#1a1a1a] ml-8" : "bg-[#111] mr-8"}`}
            >
              {/* Render HTML content for assistant messages, plain text for user messages */}
              {message.role === "assistant" ? (
                <div dangerouslySetInnerHTML={renderHtmlContent(message.content)} />
              ) : (
                message.content
              )}
              {message.role === "assistant" && <MessageActions messageId={message.id} content={message.content} />}
            </div>
          ))}

          {/* Only show streaming message if we're actively loading */}
          {isLoading && streamingMessage !== null && (
            <div className="bg-[#111] p-3 rounded-lg mb-4 mr-8">
              {/* Render streaming message as HTML */}
              <div dangerouslySetInnerHTML={renderHtmlContent(streamingMessage)} />
              <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse"></span>
            </div>
          )}

          {isLoading && streamingMessage === null && (
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
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="assistant-input-field"
            disabled={isLoading}
            rows={4}
            style={{
              resize: "none",
              minHeight: "120px", // Double the default height
              height: "auto",
              maxHeight: "300px", // Allow up to ~30% of panel height
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (input.trim()) handleSendMessage(e)
              }
            }}
          />
          <button type="submit" className="assistant-send-button" disabled={!input.trim() || isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}