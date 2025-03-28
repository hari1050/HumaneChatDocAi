"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { PlusIcon, FileIcon, Settings, LogOut, Trash2 } from "lucide-react"
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
}

export function DocumentSidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
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
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="p-4 border-b border-border/40">
        <h2 className="font-semibold text-lg">Documents</h2>
      </div>

      <div className="p-2">
        <Button
          onClick={onCreateDocument}
          variant="outline"
          className="w-full justify-start border-border/40 hover:bg-secondary/80"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> New Document
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center group">
              <Button
                variant={activeDocumentId === doc.id ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeDocumentId === doc.id ? "bg-secondary/80 text-secondary-foreground" : "hover:bg-secondary/40"}`}
                onClick={() => onSelectDocument(doc.id)}
              >
                <FileIcon className="mr-2 h-4 w-4" />
                <span className="truncate">{doc.title}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteClick(e, doc.id)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 border-t border-border/40 mt-auto">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start hover:bg-secondary/40">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <SignOutButton>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </div>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open: boolean) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

