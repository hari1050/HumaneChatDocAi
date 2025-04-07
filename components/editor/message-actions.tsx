"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Copy, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEditor } from "@/context/editor-context"

interface MessageActionsProps {
  messageId: string
  content: string
}

export function MessageActions({ messageId, content }: MessageActionsProps) {
  const { toast } = useToast()
  const { editorRef, activeChange } = useEditor()
  const [isApplied, setIsApplied] = useState(false)
  const [currentChangeId, setCurrentChangeId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  // Check if this message has an active change
  const hasActiveChange = activeChange?.appliedMessageId === messageId

  // Handle applying the message to the editor
  const handleApply = async () => {
    if (!editorRef.current?.editor) {
      toast({
        title: "Error",
        description: "Editor not available",
        variant: "destructive",
      })
      return
    }

    // Check if there's already an active change
    if (editorRef.current.hasActiveChange) {
      toast({
        title: "Active Change",
        description: "Please accept or reject the current change before applying a new one",
        variant: "destructive",
      })
      return
    }

    setIsApplying(true)
    try {
      const change = await editorRef.current.applyText(content, messageId)
      if (change) {
        setIsApplied(true)
        setCurrentChangeId(change.id)
      }
    } catch (error) {
      console.error("Error applying text:", error)
      toast({
        title: "Error",
        description: "Failed to apply text to editor",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Handle accepting the change
  const handleAccept = () => {
    if (!currentChangeId || !editorRef.current) return

    editorRef.current.acceptChange(currentChangeId)
    setIsApplied(false)
    setCurrentChangeId(null)

    toast({
      title: "Changes Accepted",
      description: "The changes have been applied to your document",
    })
  }

  // Handle rejecting the change
  const handleReject = () => {
    if (!currentChangeId || !editorRef.current) return

    editorRef.current.rejectChange(currentChangeId)
    setIsApplied(false)
    setCurrentChangeId(null)

    toast({
      title: "Changes Rejected",
      description: "The changes have been reverted",
    })
  }

  // Handle copying the message to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // If this message has an active change, show accept/reject buttons
  if (hasActiveChange || isApplied) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border-green-500/30"
          onClick={handleAccept}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/30"
          onClick={handleReject}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Reject
        </Button>
      </div>
    )
  }

  // Otherwise, show apply/copy buttons
  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border-blue-500/30"
        onClick={handleApply}
        disabled={isApplying}
      >
        <Wand2 className="h-3.5 w-3.5 mr-1" />
        {isApplying ? "Applying..." : "Apply"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 hover:text-gray-300 border-gray-500/30"
        onClick={handleCopy}
      >
        <Copy className="h-3.5 w-3.5 mr-1" />
        Copy
      </Button>
    </div>
  )
}

