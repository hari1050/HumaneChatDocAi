import type { ChatMessage } from "@/app/api/chat/route"

export type Chat = {
  id: string
  title: string
  messages: ChatMessage[]
  document_id: string
  created_at: string
  updated_at: string
}

// Fetch recent chats for the current user
export async function fetchRecentChats(limit = 10): Promise<Chat[]> {
  const response = await fetch(`/api/chats?limit=${limit}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch chats")
  }

  return response.json()
}

// Fetch a specific chat by ID
export async function fetchChat(id: string): Promise<Chat> {
  const response = await fetch(`/api/chats/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch chat")
  }

  return response.json()
}

// Create a new chat
export async function createChat(
  documentId: string,
  title: string,
  messages: ChatMessage | ChatMessage[],
): Promise<Chat> {
  const messageArray = Array.isArray(messages) ? messages : [messages]

  const response = await fetch("/api/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document_id: documentId,
      title,
      messages: messageArray,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create chat")
  }

  return response.json()
}

// Update an existing chat
export async function updateChat(
  id: string,
  updates: Partial<{ title: string; messages: ChatMessage[] }>,
): Promise<Chat> {
  const response = await fetch(`/api/chats/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update chat")
  }

  return response.json()
}

// Delete a chat
export async function deleteChat(id: string): Promise<void> {
  const response = await fetch(`/api/chats/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete chat")
  }
}

// Generate a title for a chat based on the first user message
export function generateChatTitle(message: string): string {
  // Truncate and clean up the message to create a title
  const maxLength = 30
  let title = message.trim().substring(0, maxLength)

  // If the title was truncated, add ellipsis
  if (message.length > maxLength) {
    title += "..."
  }

  return title || "New Chat"
}

