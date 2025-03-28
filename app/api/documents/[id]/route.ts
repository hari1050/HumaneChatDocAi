import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"

// GET a specific document
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

// PATCH update a document
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, content } = body

    // Only update fields that are provided
    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()

    if (error) throw error

    if (data.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

// DELETE a document
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { error } = await supabase.from("documents").delete().eq("id", params.id).eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}

