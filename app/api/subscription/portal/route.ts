import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createPortalSession } from "@/lib/stripe-service"

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { returnUrl } = body

    if (!returnUrl) {
      return NextResponse.json({ error: "Missing returnUrl" }, { status: 400 })
    }

    const portalUrl = await createPortalSession(returnUrl)

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
