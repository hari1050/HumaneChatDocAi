"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Wand2, MessageSquare, PlusCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Portal } from "@/components/ui/portal"

interface SelectionToolbarProps {
  selectedText: string
  onTransform: (text: string, prompt: string) => Promise<void>
  onAddToChat: (text: string) => void
  onClose: () => void
  position: { x: number; y: number }
  editorBounds: DOMRect
}

export function SelectionToolbar({
  selectedText,
  onTransform,
  onAddToChat,
  onClose,
  position,
  editorBounds,
}: SelectionToolbarProps) {
  const [showTransformInput, setShowTransformInput] = useState(false)
  const [transformPrompt, setTransformPrompt] = useState("")
  const [isTransforming, setIsTransforming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Focus the input when transform mode is activated
  useEffect(() => {
    if (showTransformInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showTransformInput])

  // Handle clicks outside the toolbar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleTransformClick = () => {
    setShowTransformInput(true)
  }

  const handleBackClick = () => {
    setShowTransformInput(false)
    setTransformPrompt("")
  }

  const handleTransformSubmit = async () => {
    if (!transformPrompt.trim() || isTransforming) return

    setIsTransforming(true)
    try {
      await onTransform(selectedText, transformPrompt)
    } finally {
      setIsTransforming(false)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTransformSubmit()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  // Calculate position to ensure toolbar stays within editor bounds
  const calculatePosition = () => {
    // Position directly above the selection without bounds checking
    return {
      top: position.y - 35, // Fixed offset above the selection
      left: position.x - 50,
    }
  }

  const { top, left } = calculatePosition()

  return (
    <Portal>
      <div
        ref={toolbarRef}
        className="fixed bg-[#111] border border-[#444] rounded-full shadow-lg"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 9999, // Very high z-index to ensure it's above everything
        }}
      >
        {!showTransformInput ? (
          <div className="flex items-center p-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#222] rounded-full px-3 py-1 flex items-center gap-1 h-7 text-xs"
              onClick={handleTransformClick}
            >
              <Wand2 className="h-3 w-3" />
              <span>Transform</span>
            </Button>
            <div className="w-px h-4 bg-[#333]" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#222] rounded-full px-3 py-1 flex items-center gap-1 h-7 text-xs"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Chat</span>
            </Button>
            <div className="w-px h-4 bg-[#333]" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#222] rounded-full px-3 py-1 flex items-center gap-1 h-7 text-xs"
              onClick={() => onAddToChat(selectedText)}
            >
              <PlusCircle className="h-3 w-3" />
              <span>Add to Chat</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center p-1 gap-1 w-[450px]">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#222] rounded-full p-1 h-6 w-6"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <input
              ref={inputRef}
              type="text"
              value={transformPrompt}
              onChange={(e) => setTransformPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Rewrite this in formal style..."
              className="flex-1 bg-transparent border-none outline-none text-white px-2 py-1 text-xs h-7"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#222] rounded-full p-1 bg-[#333] h-6 w-6"
              onClick={handleTransformSubmit}
              disabled={!transformPrompt.trim() || isTransforming}
            >
              {isTransforming ? (
                <div className="h-3 w-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-black bg-white hover:bg-white/90 rounded-full px-3 py-1 ml-1 h-7 text-xs"
            >
              AI Presets
            </Button>
          </div>
        )}
      </div>
    </Portal>
  )
}

