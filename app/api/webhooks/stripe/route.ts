import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = (await headers()).get("stripe-signature") || ""

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error("Webhook signature verification failed:", error)
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0].price.id
  const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  const cancelAtPeriodEnd = subscription.cancel_at_period_end

  // Find the user ID from the customer ID
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!existingSubscription) {
    console.error("No subscription found for customer:", customerId)
    return
  }

  // Update the subscription in the database
  await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      status,
      cancel_at_period_end: cancelAtPeriodEnd,
      trial_ends_at: trialEndDate,
      current_period_end: currentPeriodEnd,
    })
    .eq("stripe_customer_id", customerId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Update the subscription status to canceled
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
    })
    .eq("stripe_customer_id", customerId)
}

