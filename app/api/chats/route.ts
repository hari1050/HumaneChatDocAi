import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fetchRecentChats, createChat, updateChat, fetchChat } from "@/lib/chat-service-server"

// GET all chats for the current user
export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "10")
    const chats = await fetchRecentChats(limit)
    return NextResponse.json(chats)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

// POST create a new chat
export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { document_id, title, messages } = body

    if (!document_id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Allow creating a chat with an array of messages or a single message
    const initialMessages = Array.isArray(messages) ? messages : messages ? [messages] : []

    const chat = await createChat(
      userId,
      document_id,
      title || "New Chat",
      initialMessages.length > 0 ? initialMessages[0] : null,
    )

    // If we have more than one message, update the chat with all messages
    if (initialMessages.length > 1) {
      await updateChat(chat.id, userId, { messages: initialMessages })

      // Fetch the updated chat to return
      const updatedChat = await fetchChat(chat.id)
      return NextResponse.json(updatedChat)
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}

