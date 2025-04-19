import Stripe from "stripe"
import { auth, currentUser} from "@clerk/nextjs/server"
import { getUserSubscription, upsertSubscription } from "./subscription-service"
import type { PlanType } from "@/types/subscription"
import { supabase } from "./supabase"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

// Get or create a Stripe customer for the user
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Check if the user already has a Stripe customer ID
  const subscription = await getUserSubscription(userId)

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  // Save the Stripe customer ID to the user's subscription
  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: customer.id,
  })

  return customer.id
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  planType: PlanType,
  successUrl: string,
  cancelUrl: string,
): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("User not authenticated")
  }

  // Get the user's email from Clerk
  const user = await currentUser()
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    throw new Error("User email not found")
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId, user.emailAddresses[0].emailAddress)

  // Get the price ID based on the plan type
  let priceId: string
  switch (planType) {
    case "pro":
      priceId = process.env.STRIPE_PRO_PRICE_ID!
      break
    case "advanced":
      priceId = process.env.STRIPE_ADVANCED_PRICE_ID!
      break
    default:
      throw new Error("Invalid plan type")
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planType,
    },
  })

  return session.url
}

// Create a portal session for managing subscription
export async function createPortalSession(returnUrl: string): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("User not authenticated")
  }

  // Get the user's subscription
  const subscription = await getUserSubscription(userId)
  if (!subscription?.stripe_customer_id) {
    throw new Error("No Stripe customer found")
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  })

  return session.url
}

// Handle webhook events from Stripe
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const planType = session.metadata?.planType as PlanType

      if (userId && planType) {
        await upsertSubscription({
          user_id: userId,
          plan_type: planType,
          status: "active",
          stripe_subscription_id: session.subscription as string,
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const stripeCustomerId = subscription.customer as string

      // Find the user by Stripe customer ID
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single()

      if (data?.user_id) {
        await upsertSubscription({
          user_id: data.user_id,
          status: subscription.status as any,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const stripeCustomerId = subscription.customer as string

      // Find the user by Stripe customer ID
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single()

      if (data?.user_id) {
        await upsertSubscription({
          user_id: data.user_id,
          plan_type: "free",
          status: "canceled",
          stripe_subscription_id: null,
        })
      }
      break
    }
  }
}
