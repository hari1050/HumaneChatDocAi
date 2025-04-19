import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createCheckoutSession } from "@/lib/stripe-service"
import type { PlanType } from "@/types/subscription"

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { planType, successUrl, cancelUrl } = body

    if (!planType || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const checkoutUrl = await createCheckoutSession(planType as PlanType, successUrl, cancelUrl)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
