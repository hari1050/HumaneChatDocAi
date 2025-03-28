"use client"

import type React from "react"

import { useState } from "react"
import type { Document } from "./editor-container"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, UnderlineIcon, List, ListOrdered, Code, LinkIcon, Download, Share, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TextEditorProps {
  document: Document
  onUpdateDocument: (updates: Partial<Document>) => void
}

export function TextEditor({ document, onUpdateDocument }: TextEditorProps) {
  const [title, setTitle] = useState(document.title)

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
        placeholder: "Write something...",
      }),
    ],
    content: document.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdateDocument({ content: html })
    },
  })

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    onUpdateDocument({ title: newTitle })
  }

  if (!editor) {
    return <div className="max-w-4xl mx-auto p-8 w-full">Loading editor...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8 w-full">
      <div className="mb-8 flex justify-between items-center">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-2xl font-bold border-none outline-none w-full bg-transparent text-foreground"
          placeholder="Untitled Document"
        />
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary/40">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary/40">
                  <Share className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary/40">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Document Info</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="border border-border/40 rounded-md mb-4 bg-background/80">
        <div className="flex items-center p-2 border-b border-border/40 overflow-x-auto">
          <div className="flex space-x-1 mr-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 text-xs ${editor.isActive("heading", { level: 1 }) ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 text-xs ${editor.isActive("heading", { level: 2 }) ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 text-xs ${editor.isActive("heading", { level: 3 }) ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </Button>
          </div>

          <div className="h-6 w-px bg-border/40 mx-2" />

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("bold") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("italic") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("underline") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border/40 mx-2" />

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("bulletList") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("orderedList") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border/40 mx-2" />

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("link") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => {
                const url = prompt("Enter link URL:")
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${editor.isActive("codeBlock") ? "bg-secondary/80" : "hover:bg-secondary/40"}`}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] text-foreground"
      />
    </div>
  )
}

