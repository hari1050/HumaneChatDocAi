import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { hasActiveSubscription } from "@/lib/subscription-service"

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hasSubscription = await hasActiveSubscription(userId)

  return NextResponse.json({ hasActiveSubscription: hasSubscription })
}

