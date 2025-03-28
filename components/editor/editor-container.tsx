"use client"

import { useState, useEffect } from "react"
import { DocumentSidebar } from "./document-sidebar"
import { TextEditor } from "./text-editor"
import { AssistantSidebar } from "./assistant-sidebar"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { fetchDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/document-service"
import { useToast } from "@/hooks/use-toast"

export type Document = {
  id: string
  title: string
  content: string
  created_at?: string
  updated_at?: string
  user_id?: string
}

export function EditorContainer() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(true)
  const [showAssistantSidebar, setShowAssistantSidebar] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const docs = await fetchDocuments()
        setDocuments(docs)

        // Set the first document as active if there are documents and no active document
        if (docs.length > 0 && !activeDocumentId) {
          setActiveDocumentId(docs[0].id)
        }
      } catch (error) {
        console.error("Error loading documents:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load documents",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [activeDocumentId, toast])

  const activeDocument = activeDocumentId ? documents.find((doc) => doc.id === activeDocumentId) : documents[0]

  const handleCreateDocument = async () => {
    try {
      const newDoc = await createDocument("Untitled Document", "<p></p>")
      setDocuments([newDoc, ...documents])
      setActiveDocumentId(newDoc.id)

      toast({
        title: "Success",
        description: "New document created",
      })
    } catch (error) {
      console.error("Error creating document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create document",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const updatedDoc = await updateDocument(id, updates)

      setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, ...updatedDoc } : doc)))
    } catch (error) {
      console.error("Error updating document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id)

      const newDocs = documents.filter((doc) => doc.id !== id)
      setDocuments(newDocs)

      // If the active document was deleted, set the first document as active
      if (activeDocumentId === id && newDocs.length > 0) {
        setActiveDocumentId(newDocs[0].id)
      } else if (newDocs.length === 0) {
        setActiveDocumentId(null)
      }

      toast({
        title: "Success",
        description: "Document deleted",
      })
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Document Sidebar */}
      <div
        className={`border-r border-border/40 ${showDocumentSidebar ? "w-60" : "w-0"} transition-all duration-200 overflow-hidden bg-background/95`}
      >
        {showDocumentSidebar && (
          <DocumentSidebar
            documents={documents}
            activeDocumentId={activeDocumentId || ""}
            onSelectDocument={setActiveDocumentId}
            onCreateDocument={handleCreateDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border/40 flex items-center px-4 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}>
              {showDocumentSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <h1 className="ml-2 text-lg font-medium">
              {activeDocument ? activeDocument.title : "No Document Selected"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {activeDocument ? (
            <>
              <div className="flex-1 overflow-auto bg-background">
                <TextEditor
                  document={activeDocument}
                  onUpdateDocument={(updates) => handleUpdateDocument(activeDocument.id, updates)}
                />
              </div>

              {/* Assistant Sidebar */}
              <div
                className={`border-l border-border/40 ${showAssistantSidebar ? "w-80" : "w-0"} transition-all duration-200 overflow-hidden bg-background/95`}
              >
                {showAssistantSidebar && <AssistantSidebar document={activeDocument} allDocuments={documents} />}
              </div>

              {/* Toggle Assistant Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
                onClick={() => setShowAssistantSidebar(!showAssistantSidebar)}
              >
                {showAssistantSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-medium mb-4">No Document Selected</h2>
                <Button onClick={handleCreateDocument}>Create New Document</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

