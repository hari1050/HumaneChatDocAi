import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("Missing CLERK_WEBHOOK_SECRET")
    return new NextResponse("Webhook secret not provided", { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new NextResponse("Error verifying webhook", { status: 400 })
  }

  // Handle the webhook event
  const eventType = evt.type

  if (eventType === "user.created") {
    const { id, email_addresses } = evt.data
    const userId = id
    const email = email_addresses?.[0]?.email_address

    if (!userId) {
      return new NextResponse("Missing user ID", { status: 400 })
    }

    try {
      // Check if a subscription already exists for this user
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single()

      // If no subscription exists, create one with the free plan
      if (!existingSubscription) {
        const { error } = await supabase.from("subscriptions").insert([
          {
            user_id: userId,
            plan_type: "free",
            status: "active",
            cancel_at_period_end: false,
          },
        ])

        if (error) {
          console.error("Error creating subscription:", error)
          return new NextResponse("Error creating subscription", { status: 500 })
        }

        console.log(`Created free subscription for user ${userId}`)
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error handling user.created webhook:", error)
      return new NextResponse("Error handling webhook", { status: 500 })
    }
  }

  // Return a response for other event types
  return NextResponse.json({ success: true })
}
