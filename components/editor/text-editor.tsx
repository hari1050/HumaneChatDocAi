"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import type { Document } from "./editor-container"
import { useEditor as useTiptapEditor, EditorContent } from "@tiptap/react"
import { useEditor } from "@/context/editor-context"
import type { EditorChange } from "@/types/editor-types"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Strikethrough,
  UnderlineIcon,
  LinkIcon,
  Code,
  List,
  ListOrdered,
  Download,
  Copy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportHtmlAsDocx } from "@/lib/docx-export"
import { SelectionToolbar } from "./selection-toolbar"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { BlockIndependence, ImprovedBackspace } from "./custom-extensions"
import { LimitWarning } from "@/components/subscription/limit-warning"

interface TextEditorProps {
  document: Document
  onUpdateDocument: (updates: Partial<Document>) => void
  onToggleDocumentSidebar: () => void
  onToggleAssistantSidebar: () => void
  showDocumentSidebar: boolean
  showAssistantSidebar: boolean
}

export function TextEditor({
  document: documentData,
  onUpdateDocument,
  onToggleDocumentSidebar,
  onToggleAssistantSidebar,
  showDocumentSidebar,
  showAssistantSidebar,
}: TextEditorProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState(documentData.title)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [contentChanged, setContentChanged] = useState(false)
  const [titleChanged, setTitleChanged] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef(documentData.content)
  const lastTitleRef = useRef(documentData.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [transformLimitReached, setTransformLimitReached] = useState(false)

  // Selection toolbar state
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const editorContentRef = useRef<HTMLDivElement>(null)
  const [editorBounds, setEditorBounds] = useState<DOMRect | null>(null)
  const selectionDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Get editor context
  const { editorRef, activeChange, setActiveChange } = useEditor()

  // Create a unique class name for highlighting changes
  const changeHighlightClass = "editor-change-highlight"

  // Add these new states inside the TextEditor component
  const [showTransformInput, setShowTransformInput] = useState(false)
  const [transformInput, setTransformInput] = useState("")
  const [transformInputPosition, setTransformInputPosition] = useState({ x: 0, y: 0 })
  const transformInputRef = useRef<HTMLInputElement>(null)

  const editor = useTiptapEditor({
    extensions: [
      StarterKit.configure({
        // Configure paragraph to be a proper block
        paragraph: {
          HTMLAttributes: {
            class: "editor-paragraph",
          },
        },
        // Configure heading with proper styling
        heading: {
          levels: [1, 2, 3, 4],
          HTMLAttributes: {
            class: "editor-heading",
          },
        },
        // Ensure each block is independent
        hardBreak: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4],
        HTMLAttributes: ({ level }: { level: number }) => ({
          class: `editor-heading editor-heading-${level}`,
        }),
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      Placeholder.configure({
        placeholder: "New document",
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-node-empty",
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      // Add our custom extensions
      BlockIndependence,
      ImprovedBackspace,
    ],
    content: documentData.content,
    onUpdate: ({ editor, transaction }) => {
      // Only trigger save if this is a user input transaction (typing)
      if (transaction.docChanged) {
        // If there's an active change and the user is typing, clear it
        if (activeChange && transaction.docChanged) {
          setActiveChange(null)
        }

        const html = editor.getHTML()
        debouncedSaveContent(html)
      }
    },
    onSelectionUpdate: () => {
      checkSelectionWithDebounce()
    },
    editorProps: {
      // Add custom attributes to ensure blocks are properly separated
      attributes: {
        class: "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none editor-content",
      },
      // Handle backspace and delete to prevent formatting propagation
      handleKeyDown: (view, event) => {
        // Custom handling for backspace and delete to prevent formatting issues
        if (event.key === "Backspace" || event.key === "Delete") {
          const { state } = view
          const { selection } = state
          const { empty } = selection

          // Let the editor handle the default case
          return false
        }
        return false
      },
    },
  })

  // Set up editor ref methods
  useEffect(() => {
    if (!editor) return

    // Create a plugin key that we can reference later
    const highlightPluginKey = new PluginKey("changeHighlight")

    // Add extension for custom highlighting
    const highlightPlugin = new Plugin({
      key: highlightPluginKey,
      props: {
        decorations: (state) => {
          if (!activeChange) return DecorationSet.empty

          // Only apply decoration if we have an active change
          const { from, to } = activeChange
          return DecorationSet.create(state.doc, [
            Decoration.inline(from, to, {
              class: `${changeHighlightClass}-added`,
            }),
          ])
        },
      },
    })

    editor.registerPlugin(highlightPlugin)

    // Expose editor methods through ref
    editorRef.current = {
      editor,
      applyText: async (text, messageId) => {
        if (!editor) return null

        // Get current selection or cursor position
        const { from, to } = editor.state.selection

        // Generate a unique ID for this change
        const changeId = `change-${Date.now()}`

        // Store the original text
        const originalText = editor.state.doc.textBetween(from, to)

        // Apply the change
        editor.chain().focus().deleteRange({ from, to }).insertContent(text).run()

        // Create change object
        const change: EditorChange = {
          id: changeId,
          appliedMessageId: messageId,
          originalText,
          newText: text,
          from,
          to: from + text.length,
        }

        // Set as active change
        setActiveChange(change)

        return change
      },
      acceptChange: (changeId) => {
        if (!activeChange || activeChange.id !== changeId) return

        // Simply clear the active change to remove highlighting
        setActiveChange(null)
      },
      rejectChange: (changeId) => {
        if (!editor || !activeChange || activeChange.id !== changeId) return

        // Revert to original text
        const { from, to, originalText } = activeChange
        editor.chain().focus().deleteRange({ from, to }).insertContent(originalText).run()

        // Clear active change
        setActiveChange(null)
      },
      hasActiveChange: !!activeChange,
    }

    return () => {
      // Clean up plugin when component unmounts
      if (editor) {
        editor.unregisterPlugin(highlightPluginKey)
      }
    }
  }, [editor, activeChange, setActiveChange])

  // Debounced save function for content
  const debouncedSaveContent = useCallback(
    (content: string) => {
      // Only proceed if content has actually changed
      if (content === lastContentRef.current) return

      // Update the last content reference
      lastContentRef.current = content
      setContentChanged(true)

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set saving indicator
      setIsSaving(true)

      // Set a new timeout
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Only save if there are actual changes
          if (contentChanged || titleChanged) {
            const updates: Partial<Document> = {}

            if (contentChanged) {
              updates.content = content
              setContentChanged(false)
            }

            if (titleChanged) {
              updates.title = title
              setTitleChanged(false)
            }

            // Wait for the API call to complete
            await onUpdateDocument(updates)
            setLastSaved(new Date())
          }
        } catch (error) {
          console.error("Failed to save document:", error)
        } finally {
          setIsSaving(false)
        }
      }, 10000) // 10 seconds debounce
    },
    [onUpdateDocument, title, contentChanged, titleChanged],
  )

  // Function to check selection and show toolbar with debounce
  const checkSelectionWithDebounce = useCallback(() => {
    if (!editor) return

    // Clear any existing debounce timeout
    if (selectionDebounceRef.current) {
      clearTimeout(selectionDebounceRef.current)
    }

    // Set a new debounce timeout
    selectionDebounceRef.current = setTimeout(() => {
      const { from, to } = editor.state.selection

      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ")
        if (text.trim()) {
          // Update editor bounds
          if (editorContentRef.current) {
            setEditorBounds(editorContentRef.current.getBoundingClientRect())
          }

          setSelectedText(text)

          // Get the position for the toolbar - use the selection's coordinates
          const view = editor.view
          const { from, to } = editor.state.selection
          const start = view.coordsAtPos(from)
          const end = view.coordsAtPos(to)

          // Position the toolbar above the middle of the selection
          const middleX = (start.left + end.left) / 2
          setSelectionPosition({
            x: middleX,
            y: start.top, // Position it right at the top of the selection
          })

          setShowSelectionToolbar(true)
        } else {
          setShowSelectionToolbar(false)
        }
      } else {
        setShowSelectionToolbar(false)
      }
    }, 200) // 200ms debounce
  }, [editor])

  // Add mouseup listener to detect selections made by dragging
  useEffect(() => {
    const handleMouseUp = () => {
      checkSelectionWithDebounce()
    }

    const editorContent = editorContentRef.current
    if (editorContent) {
      editorContent.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      if (editorContent) {
        editorContent.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [checkSelectionWithDebounce, editor])

  // Handle title changes with debounce
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)

    // Only proceed if title has actually changed
    if (newTitle === lastTitleRef.current) return

    // Update the last title reference
    lastTitleRef.current = newTitle
    setTitleChanged(true)

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set saving indicator
    setIsSaving(true)

    // Set a new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Only save if there are actual changes
        if (contentChanged || titleChanged) {
          const updates: Partial<Document> = {}

          if (titleChanged) {
            updates.title = newTitle
            setTitleChanged(false)
          }

          if (contentChanged && editor) {
            updates.content = editor.getHTML()
            setContentChanged(false)
          }

          // Wait for the API call to complete
          await onUpdateDocument(updates)
          setLastSaved(new Date())
        }
      } catch (error) {
        console.error("Failed to save document:", error)
      } finally {
        setIsSaving(false)
      }
    }, 10000) // 10 seconds debounce
  }

  // Handle document download
  const handleDownloadDocument = async () => {
    if (!editor) return

    setIsDownloading(true)

    try {
      // Get the HTML content from the editor
      const content = editor.getHTML()
      const fileName = `${title || "Untitled"}.docx`

      // Use our custom export function
      exportHtmlAsDocx(content, fileName)

      toast({
        title: "Download started",
        description: `Your document "${fileName}" is being downloaded.`,
      })
    } catch (error) {
      console.error("Failed to download document:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle document copy
  const handleCopyDocument = async () => {
    if (!editor) return

    try {
      const content = editor.getText() || ""
      await navigator.clipboard.writeText(content)

      toast({
        title: "Copied to clipboard",
        description: "Document content has been copied to your clipboard",
      })
    } catch (err) {
      console.error("Failed to copy document content:", err)

      toast({
        title: "Copy failed",
        description: "Failed to copy document content to clipboard",
        variant: "destructive",
      })
    }
  }

  // Handle text transformation
  const handleTransformText = async (text: string, prompt: string) => {
    if (!editor) return

    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, prompt }),
      })

      if (!response.ok) {
        const error = await response.json()

        // Check if this is a limit reached error
        if (error.limitReached) {
          setTransformLimitReached(true)
          throw new Error(`Feature limit reached: ${error.message}`)
        }

        throw new Error(error.error || "Failed to transform text")
      }

      const data = await response.json()

      // Replace the selected text with the transformed text
      const { from, to } = editor.state.selection
      editor.chain().focus().deleteRange({ from, to }).insertContent(data.transformedText).run()

      toast({
        title: "Text transformed",
        description: "The selected text has been transformed successfully",
      })
    } catch (error) {
      console.error("Failed to transform text:", error)
      toast({
        title: "Transform failed",
        description: error instanceof Error ? error.message : "Failed to transform text",
        variant: "destructive",
      })
    }
  }

  // Handle adding selected text to chat
  const handleAddToChat = (text: string) => {
    // Get the assistant sidebar and find the chat input
    const assistantSidebar = document.querySelector(".assistant-sidebar")
    if (assistantSidebar) {
      const chatInput = assistantSidebar.querySelector(".assistant-input-field") as HTMLInputElement
      if (chatInput) {
        // If there's already text in the input, add a space
        if (chatInput.value && !chatInput.value.endsWith(" ")) {
          chatInput.value += " "
        }
        // Add the selected text to the input
        chatInput.value += text
        // Focus the input
        chatInput.focus()
      }
    }
    setShowSelectionToolbar(false)
  }

  // Add this effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if editor is focused
      if (!editor || !editor.isFocused) return

      // Transform selection shortcut (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()

        const { from, to } = editor.state.selection
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, " ")
          if (text.trim()) {
            // Update editor bounds
            if (editorContentRef.current) {
              setEditorBounds(editorContentRef.current.getBoundingClientRect())
            }

            setSelectedText(text)

            // Get the position for the toolbar - use the selection's coordinates
            const view = editor.view
            const start = view.coordsAtPos(from)
            const end = view.coordsAtPos(to)

            // Position the toolbar above the middle of the selection
            const middleX = (start.left + end.left) / 2
            setSelectionPosition({
              x: middleX,
              y: start.top - 10, // Position it slightly above the top of the selection
            })

            // Show the selection toolbar and immediately activate transform mode
            setShowSelectionToolbar(true)

            // Use a small timeout to ensure the toolbar is rendered before we try to interact with it
            setTimeout(() => {
              const transformButton = document.querySelector(".selection-toolbar button")
              if (transformButton) {
                ;(transformButton as HTMLButtonElement).click()
              }
            }, 10)
          }
        }
      }

      // Add selection to chat shortcut (Ctrl/Cmd + L)
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault()

        const { from, to } = editor.state.selection
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, " ")
          if (text.trim()) {
            handleAddToChat(text)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editor])

  // Add a function to handle transform input submission
  const handleTransformInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editor || !transformInput.trim()) {
      setShowTransformInput(false)
      return
    }

    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, " ")

    if (text.trim()) {
      handleTransformText(text, transformInput)
    }

    setTransformInput("")
    setShowTransformInput(false)
  }

  if (!editor) {
    return <div className="flex items-center justify-center h-full">Loading editor...</div>
  }

  return (
    <div className="editor-main">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] h-[52px]">
        <div className="flex items-center">
          {!showDocumentSidebar && (
            <button
              className="p-2 rounded hover:bg-[#1a1a1a] transition-colors mr-2"
              onClick={onToggleDocumentSidebar}
              title="Show document sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="bg-transparent border-none outline-none text-base font-normal"
              placeholder="Untitled"
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false)
                }
              }}
            />
          ) : (
            <div className="flex items-center">
              <span className="text-base font-normal">{title || "Untitled"}</span>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="ml-2 p-1 rounded hover:bg-[#1a1a1a] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded hover:bg-[#1a1a1a] transition-colors"
            onClick={handleDownloadDocument}
            disabled={isDownloading}
            title="Download document as DOCX"
          >
            {isDownloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
          <button
            className="p-2 rounded hover:bg-[#1a1a1a] transition-colors"
            onClick={handleCopyDocument}
            title="Copy document content"
          >
            <Copy className="h-4 w-4" />
          </button>
          {!showAssistantSidebar && (
            <button
              className="p-2 rounded hover:bg-[#1a1a1a] transition-colors"
              onClick={onToggleAssistantSidebar}
              title="Show assistant sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-[#2a2a2a] px-4 py-2">
        <div className="flex items-center">
          <button
            className={`toolbar-button ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button
            className={`toolbar-button ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            className={`toolbar-button ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            className={`toolbar-button ${editor.isActive("heading", { level: 4 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          >
            H4
          </button>

          <div className="toolbar-divider"></div>

          <button
            className={`toolbar-button ${editor.isActive("bold") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            className={`toolbar-button ${editor.isActive("italic") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            className={`toolbar-button ${editor.isActive("strike") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            className={`toolbar-button ${editor.isActive("underline") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>

          <div className="toolbar-divider"></div>

          <button
            className={`toolbar-button ${editor.isActive("link") ? "active" : ""}`}
            onClick={() => {
              const url = prompt("Enter URL")
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>

          <div className="toolbar-divider"></div>

          <button
            className={`toolbar-button ${editor.isActive("bulletList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            className={`toolbar-button ${editor.isActive("orderedList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <div className="toolbar-divider"></div>

          <button
            className={`toolbar-button ${editor.isActive("codeBlock") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="editor-content" ref={editorContentRef}>
        <EditorContent
          editor={editor}
          className="prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none"
        />

        {transformLimitReached && (
          <div className="absolute bottom-4 right-4 left-4 z-50">
            <LimitWarning feature="ai_transforms" onClose={() => setTransformLimitReached(false)} />
          </div>
        )}

        {showSelectionToolbar && (
          <SelectionToolbar
            selectedText={selectedText}
            onTransform={handleTransformText}
            onAddToChat={handleAddToChat}
            onClose={() => setShowSelectionToolbar(false)}
            position={selectionPosition}
            editorBounds={editorBounds || new DOMRect(0, 0, 0, 0)}
          />
        )}
      </div>
    </div>
  )
}
