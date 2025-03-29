"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import type { Document } from "./editor-container"
import { useEditor, EditorContent } from "@tiptap/react"
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
  Share,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

interface TextEditorProps {
  document: Document
  onUpdateDocument: (updates: Partial<Document>) => void
  onToggleDocumentSidebar: () => void
  onToggleAssistantSidebar: () => void
  showDocumentSidebar: boolean
  showAssistantSidebar: boolean
}

export function TextEditor({
  document,
  onUpdateDocument,
  onToggleDocumentSidebar,
  onToggleAssistantSidebar,
  showDocumentSidebar,
  showAssistantSidebar,
}: TextEditorProps) {
  const [title, setTitle] = useState(document.title)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [contentChanged, setContentChanged] = useState(false)
  const [titleChanged, setTitleChanged] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef(document.content)
  const lastTitleRef = useRef(document.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      Placeholder.configure({
        placeholder: "New document",
      }),
    ],
    content: document.content,
    onUpdate: ({ editor, transaction }) => {
      // Only trigger save if this is a user input transaction (typing)
      if (transaction.docChanged) {
        const html = editor.getHTML()
        debouncedSaveContent(html)
      }
    },
  })

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
          <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
            <Share className="h-4 w-4" />
          </button>
          <button className="p-2 rounded hover:bg-[#1a1a1a] transition-colors">
            <RotateCcw className="h-4 w-4" />
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

      <div className="editor-content">
        <EditorContent
          editor={editor}
          className="prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none"
        />
      </div>
    </div>
  )
}

