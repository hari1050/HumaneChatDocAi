import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fetchChat, updateChat, deleteChat } from "@/lib/chat-service-server"

// GET a specific chat
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const chat = await fetchChat(params.id)
    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error fetching chat:", error)

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

// PATCH update a chat
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, messages } = body

    // Only update fields that are provided
    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (messages !== undefined) updates.messages = messages

    const chat = await updateChat(params.id, userId, updates)
    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error updating chat:", error)

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to update chat" }, { status: 500 })
  }
}

// DELETE a chat
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await deleteChat(params.id, userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}

