import type { Document } from "@/components/editor/editor-container"

// Fetch all documents for the current user
export async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch("/api/documents")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch documents")
  }

  return response.json()
}

// Fetch a specific document
export async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch document")
  }

  return response.json()
}

// Create a new document
export async function createDocument(title?: string, content?: string): Promise<Document> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create document")
  }

  return response.json()
}

// Update a document
export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update document")
  }

  return response.json()
}

// Delete a document
export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete document")
  }
}

