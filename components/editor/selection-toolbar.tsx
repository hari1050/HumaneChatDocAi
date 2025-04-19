"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Wand2, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Portal } from "@/components/ui/portal"
import { TransformPresets } from "./transform-presets"

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
  const [showPresets, setShowPresets] = useState(false)
  const [transformPrompt, setTransformPrompt] = useState("")
  const [isTransforming, setIsTransforming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarWidth, setToolbarWidth] = useState(showTransformInput ? 450 : 280)

  // Measure toolbar width after render
  useEffect(() => {
    if (toolbarRef.current) {
      const width = toolbarRef.current.offsetWidth
      setToolbarWidth(width)
    }
  }, [showTransformInput])

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

  // Calculate position to ensure toolbar stays within editor bounds and above the selection
  const calculatePosition = () => {
    // Get window dimensions
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Calculate initial position (centered above selection)
    let left = position.x - toolbarWidth / 2
    let top = position.y - 45 // Position above the selection with some margin

    // Ensure the toolbar doesn't go off-screen horizontally
    if (left < 20) left = 20
    if (left + toolbarWidth > windowWidth - 20) left = windowWidth - toolbarWidth - 20

    // Ensure the toolbar doesn't go off-screen vertically
    if (top < 20) top = 20

    // If showing presets, make sure there's room below
    if (showPresets && top < 200) top = 200

    return { top, left }
  }

  const { top, left } = calculatePosition()

  return (
    <Portal>
      <div
        ref={toolbarRef}
        className="fixed shadow-lg selection-toolbar z-[9999]"
        style={{
          top: `${top}px`,
          left: `${left}px`,
        }}
      >
        {!showTransformInput ? (
          <div className="flex items-center bg-[#111]/90 backdrop-blur-sm border border-[#333] rounded-full p-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 h-8 text-xs font-medium"
              onClick={() => setShowTransformInput(true)}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Transform</span>
              <span className="ml-1 text-xs opacity-60">(⌘K)</span>
            </Button>
            <div className="w-px h-4 bg-[#444]" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 h-8 text-xs font-medium"
              onClick={() => {
                onAddToChat(selectedText)
                onClose()
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Add to Chat</span>
              <span className="ml-1 text-xs opacity-60">(⌘L)</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center bg-[#111]/90 backdrop-blur-sm border border-[#333] rounded-full p-1 gap-1 w-[450px]">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 rounded-full p-1 h-8 w-8 flex items-center justify-center"
                onClick={() => {
                  setShowTransformInput(false)
                  setShowPresets(false)
                  setTransformPrompt("")
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <input
                ref={inputRef}
                type="text"
                value={transformPrompt}
                onChange={(e) => setTransformPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Rewrite this in formal style..."
                className="flex-1 bg-transparent border-none outline-none text-white px-2 py-1 text-sm h-8"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-white/10 hover:bg-white/20 rounded-full p-1 h-8 w-8 flex items-center justify-center"
                onClick={handleTransformSubmit}
                disabled={!transformPrompt.trim() || isTransforming}
              >
                {isTransforming ? (
                  <div className="h-3.5 w-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-black bg-white hover:bg-white/90 rounded-full px-3 py-1 ml-1 h-8 text-xs font-medium"
                onClick={() => setShowPresets(!showPresets)}
              >
                AI Presets
              </Button>
            </div>

            {showPresets && (
              <div className="mt-2 transform-origin-top">
                <TransformPresets
                  onSelectPreset={(prompt) => {
                    setTransformPrompt(prompt)
                    setShowPresets(false)
                    setTimeout(() => inputRef.current?.focus(), 10)
                  }}
                  onClose={() => setShowPresets(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Portal>
  )
}
