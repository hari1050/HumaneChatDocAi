import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"

// GET all documents for the current user
export async function GET(req: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST create a new document
export async function POST(req: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title = "Untitled Document", content = "" } = body

    const { data, error } = await supabase
      .from("documents")
      .insert([{ title, content, user_id: userId }])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}

