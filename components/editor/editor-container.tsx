"use client"

import { useState, useEffect } from "react"
import { DocumentSidebar } from "./document-sidebar"
import { TextEditor } from "./text-editor"
import { AssistantSidebar } from "./assistant-sidebar"
import { Loader2 } from "lucide-react"
import { fetchDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/document-service"
import { useToast } from "@/hooks/use-toast"
import { EditorProvider } from "@/context/editor-context"

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

  const toggleDocumentSidebar = () => {
    setShowDocumentSidebar(!showDocumentSidebar)
  }

  const toggleAssistantSidebar = () => {
    setShowAssistantSidebar(!showAssistantSidebar)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <EditorProvider>
      <div className="editor-container">
        {/* Document Sidebar */}
        {showDocumentSidebar && (
          <DocumentSidebar
            documents={documents}
            activeDocumentId={activeDocumentId || ""}
            onSelectDocument={setActiveDocumentId}
            onCreateDocument={handleCreateDocument}
            onDeleteDocument={handleDeleteDocument}
            onToggleSidebar={toggleDocumentSidebar}
          />
        )}

        {/* Main Editor Area */}
        {activeDocument ? (
          <TextEditor
            document={activeDocument}
            onUpdateDocument={(updates) => handleUpdateDocument(activeDocument.id, updates)}
            onToggleDocumentSidebar={toggleDocumentSidebar}
            onToggleAssistantSidebar={toggleAssistantSidebar}
            showDocumentSidebar={showDocumentSidebar}
            showAssistantSidebar={showAssistantSidebar}
          />
        ) : (
          <div className="editor-main flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-4">No Document Selected</h2>
              <button
                onClick={handleCreateDocument}
                className="px-4 py-2 bg-white text-black rounded hover:bg-white/90 transition-colors"
              >
                Create New Document
              </button>
            </div>
          </div>
        )}

        {/* Assistant Sidebar */}
        {showAssistantSidebar && activeDocument && (
          <AssistantSidebar
            document={activeDocument}
            allDocuments={documents}
            onToggleSidebar={toggleAssistantSidebar}
          />
        )}
      </div>
    </EditorProvider>
  )
}

