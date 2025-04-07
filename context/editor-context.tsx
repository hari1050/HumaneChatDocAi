"use client"

import type React from "react"

import { createContext, useContext, useState, useRef } from "react"
import type { EditorRef, EditorChange } from "@/types/editor-types"

interface EditorContextType {
  editorRef: React.MutableRefObject<EditorRef | null>
  activeChange: EditorChange | null
  setActiveChange: (change: EditorChange | null) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const editorRef = useRef<EditorRef | null>(null)
  const [activeChange, setActiveChange] = useState<EditorChange | null>(null)

  return (
    <EditorContext.Provider value={{ editorRef, activeChange, setActiveChange }}>{children}</EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider")
  }
  return context
}

