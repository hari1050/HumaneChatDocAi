import type { Editor } from "@tiptap/react"

export interface EditorChange {
  id: string
  appliedMessageId: string
  originalText: string
  newText: string
  from: number
  to: number
}

export interface EditorRef {
  editor: Editor | null
  applyText: (text: string, messageId: string) => Promise<EditorChange | null>
  acceptChange: (changeId: string) => void
  rejectChange: (changeId: string) => void
  hasActiveChange: boolean
}

