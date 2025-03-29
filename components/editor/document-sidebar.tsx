"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, Settings, LogOut, Plus, ChevronLeft, X } from "lucide-react"
import type { Document } from "./editor-container"
import { SignOutButton } from "@clerk/nextjs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

interface DocumentSidebarProps {
  documents: Document[]
  activeDocumentId: string
  onSelectDocument: (id: string) => void
  onCreateDocument: () => void
  onDeleteDocument: (id: string) => void
  onToggleSidebar: () => void
}

export function DocumentSidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  onToggleSidebar,
}: DocumentSidebarProps) {
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  const handleDeleteClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    setDocumentToDelete(docId)
  }

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete)
      setDocumentToDelete(null)
    }
  }

  return (
    <div className="document-sidebar">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-base font-normal">Documents</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={onToggleSidebar}
            title="Hide document sidebar"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2">
        <button
          onClick={onCreateDocument}
          className="w-full flex items-center justify-center gap-1 text-white py-2 px-3 rounded-md border border-dashed border-gray-600 hover:bg-[#1a1a1a] transition-colors"
        >
          <Plus className="h-3 w-3" /> <span className="text-xs">New Document</span>
        </button>
      </div>

      <div className="document-list px-3 py-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors mb-1 ${
              activeDocumentId === doc.id ? "bg-[#222]" : "hover:bg-[#1a1a1a]"
            }`}
            onClick={() => onSelectDocument(doc.id)}
          >
            <div className="flex items-center">
              {activeDocumentId === doc.id && <div className="w-1 h-4 bg-white rounded-full absolute -ml-4"></div>}
              <FileIcon className="h-3 w-3 mr-2 text-white" />
              <span className="text-xs">{doc.title}</span>
            </div>
            <button
              onClick={(e) => handleDeleteClick(e, doc.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-[#2a2a2a] py-2">
        <button className="flex items-center px-3 py-2 w-full text-gray-400 hover:text-white transition-colors">
          <Settings className="h-3 w-3 mr-2" />
          <span className="text-xs">Settings</span>
        </button>
        <SignOutButton>
          <button className="flex items-center px-3 py-2 w-full text-gray-400 hover:text-white transition-colors">
            <LogOut className="h-3 w-3 mr-2" />
            <span className="text-xs">Sign out</span>
          </button>
        </SignOutButton>
      </div>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent className="bg-background border border-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background text-foreground border border-[#1a1a1a] hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

