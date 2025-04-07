import { supabase } from "./supabase"
import type { ChatMessage } from "@/app/api/chat/route"
import { auth } from "@clerk/nextjs/server"

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
  const { userId } = await auth()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching chats:", error)
    throw new Error(error.message)
  }

  return data as Chat[]
}

// Fetch a specific chat by ID
export async function fetchChat(id: string): Promise<Chat> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase.from("chats").select("*").eq("id", id).eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching chat:", error)
    throw new Error(error.message)
  }

  return data as Chat
}

// Create a new chat
export async function createChat(documentId: string, title: string, initialMessage: ChatMessage): Promise<Chat> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("chats")
    .insert([
      {
        user_id: userId,
        document_id: documentId,
        title,
        messages: [initialMessage],
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating chat:", error)
    throw new Error(error.message)
  }

  return data as Chat
}

// Update an existing chat
export async function updateChat(
  id: string,
  updates: Partial<{ title: string; messages: ChatMessage[] }>,
): Promise<Chat> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("chats")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating chat:", error)
    throw new Error(error.message)
  }

  return data as Chat
}

// Delete a chat
export async function deleteChat(id: string): Promise<void> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("chats").delete().eq("id", id).eq("user_id", userId)

  if (error) {
    console.error("Error deleting chat:", error)
    throw new Error(error.message)
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

