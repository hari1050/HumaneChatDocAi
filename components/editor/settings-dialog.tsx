"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ShortcutItem {
  id: string
  title: string
  description: string
  defaultShortcut: string
  currentShortcut: string
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([
    {
      id: "transform",
      title: "Transform Selection",
      description: "Transform selected text with AI",
      defaultShortcut: "Ctrl+K",
      currentShortcut: "Ctrl+K",
    },
    {
      id: "openChat",
      title: "Open Chat",
      description: "Open chat panel with optional current selection",
      defaultShortcut: "Ctrl+L",
      currentShortcut: "Ctrl+L",
    },
    {
      id: "addToChat",
      title: "Add Selection to Chat",
      description: "Add current selection to existing chat",
      defaultShortcut: "Ctrl+Shift+L",
      currentShortcut: "Ctrl+Shift+L",
    },
  ])

  // Format shortcut for display
  const formatShortcut = (shortcut: string) => {
    // Replace ⌘ with Cmd for Mac users
    if (typeof navigator !== "undefined" && navigator.platform.includes("Mac")) {
      return shortcut.replace("Ctrl+", "⌘+")
    }
    return shortcut
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-lg font-medium mb-4">Keyboard Shortcuts</h3>

          <div className="space-y-6">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="space-y-2">
                <div className="font-medium">{shortcut.title}</div>
                <div className="text-sm text-gray-400">{shortcut.description}</div>
                <div className="flex gap-2">
                  <div className="border border-[#333] rounded px-4 py-2 text-center min-w-[120px]">
                    {formatShortcut(shortcut.currentShortcut)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
