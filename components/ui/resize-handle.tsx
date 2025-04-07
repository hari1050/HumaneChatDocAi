"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useRef } from "react"

interface ResizeHandleProps {
  className?: string
  onResize: (delta: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function ResizeHandle({ className, onResize, onDragStart, onDragEnd }: ResizeHandleProps) {
  const startXRef = useRef<number>(0)
  const lastDeltaRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()

    startXRef.current = e.clientX
    lastDeltaRef.current = 0

    // Call drag start callback
    onDragStart?.()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Cancel any existing animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }

      // Use requestAnimationFrame for smoother updates
      rafIdRef.current = requestAnimationFrame(() => {
        const currentDelta = moveEvent.clientX - startXRef.current
        const deltaDiff = currentDelta - lastDeltaRef.current

        // Only update if there's a meaningful change
        if (Math.abs(deltaDiff) >= 1) {
          onResize(deltaDiff)
          lastDeltaRef.current = currentDelta
        }
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)

      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      // Call drag end callback
      onDragEnd?.()
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className={cn("absolute left-0 top-0 w-1 h-full cursor-col-resize group z-10", className)}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-8 bg-[#222] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-rows-3 grid-cols-2 gap-[2px]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[2px] h-[2px] bg-gray-400 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

