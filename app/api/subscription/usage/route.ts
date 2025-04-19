import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get the current billing period
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch the usage record for the current period
    const { data, error } = await supabase
      .from("usage")
      .select("*")
      .eq("user_id", userId)
      .gte("period_start", startOfMonth.toISOString())
      .lte("period_end", endOfMonth.toISOString())
      .single()

    if (error) {
      // If no record found, return zero counts
      if (error.code === "PGRST116") {
        return NextResponse.json({
          documents: 0,
          chat_queries: 0,
          research_queries: 0,
        })
      }
      throw error
    }

    // Return the counts from the usage record
    return NextResponse.json({
      documents: data.documents_count || 0,
      chat_queries: data.chat_queries_count || 0,
      research_queries: data.research_queries_count || 0,
    })
  } catch (error) {
    console.error("Error fetching usage data:", error)
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 })
  }
}
