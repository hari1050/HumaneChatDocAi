"use client"

import type React from "react"

import { Button } from "@/components/ui/button"

interface TransformPreset {
  name: string
  prompt: string
  icon?: React.ReactNode
}

interface TransformPresetsProps {
  onSelectPreset: (prompt: string) => void
  onClose: () => void
}

export function TransformPresets({ onSelectPreset, onClose }: TransformPresetsProps) {
  const presets: TransformPreset[] = [
    { name: "Make it formal", prompt: "Rewrite this in a formal, professional tone" },
    { name: "Make it casual", prompt: "Rewrite this in a casual, conversational tone" },
    { name: "Make it concise", prompt: "Rewrite this to be more concise and direct" },
    { name: "Expand", prompt: "Expand this with more details and examples" },
    { name: "Fix grammar", prompt: "Fix any grammar or spelling errors in this text" },
    { name: "Simplify", prompt: "Simplify this text to make it easier to understand" },
    { name: "Academic style", prompt: "Rewrite this in an academic style" },
    { name: "Creative style", prompt: "Rewrite this in a more creative, engaging style" },
  ]

  return (
    <div className="bg-[#111]/95 backdrop-blur-sm border border-[#333] rounded-lg shadow-xl p-3 w-[280px]">
      <h3 className="text-white text-xs font-medium mb-3 px-2">AI Transform Presets</h3>
      <div className="grid grid-cols-1 gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.name}
            variant="ghost"
            className="justify-start text-white hover:bg-white/10 py-1.5 px-3 h-auto text-xs rounded-md w-full text-left"
            onClick={() => {
              onSelectPreset(preset.prompt)
              onClose()
            }}
          >
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
