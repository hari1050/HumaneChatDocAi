import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"

// This extension helps maintain block independence
export const BlockIndependence = Extension.create({
  name: "blockIndependence",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockIndependence"),
        appendTransaction: (transactions, oldState, newState) => {
          // Only proceed if there were actual changes
          if (!transactions.some((tr) => tr.docChanged)) return null

          const tr = newState.tr
          const modified = false

          // Check if we need to fix any formatting issues
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "paragraph" || node.type.name.startsWith("heading")) {
              // Logic to ensure block independence
              // This is a simplified version - in a real implementation,
              // you would check for specific formatting issues

              return false // Don't descend into children
            }
            return true
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})

// This extension handles backspace behavior at block boundaries
export const ImprovedBackspace = Extension.create({
  name: "improvedBackspace",

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state, view } = this.editor
        const { selection } = state
        const { empty, $anchor } = selection

        // Only handle special cases
        if (!empty) return false

        // Check if we're at the beginning of a block
        if ($anchor.parentOffset === 0) {
          // Logic to prevent formatting propagation
          // In a real implementation, you would need more complex logic here

          // For now, just let the default behavior happen
          return false
        }

        return false // Let the default behavior happen
      },
    }
  },
})
