import { type NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createCheckoutSession } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 })
    }

    // Get the return URL from the request or use a default
    const { returnUrl = `${req.nextUrl.origin}/dashboard` } = await req.json()

    // Create a checkout session
    const session = await createCheckoutSession({
      userId,
      email,
      returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

