import Stripe from "stripe"
import { supabase } from "./supabase"

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

// Price ID for the monthly subscription
export const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || ""

// Get or create a Stripe customer for a user
export async function getOrCreateCustomer(userId: string, email: string) {
  // Check if the user already has a customer ID
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single()

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  // Store the customer ID in the database
  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: customer.id,
    status: "inactive",
  })

  return customer.id
}

// Create a checkout session for a new subscription
export async function createCheckoutSession({
  userId,
  email,
  returnUrl,
}: {
  userId: string
  email: string
  returnUrl: string
}) {
  const customerId = await getOrCreateCustomer(userId, email)

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: MONTHLY_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    subscription_data: {
      trial_period_days: 3,
    },
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
  })

  return checkoutSession
}

// Create a portal session for managing the subscription
export async function createPortalSession({
  userId,
  returnUrl,
}: {
  userId: string
  returnUrl: string
}) {
  // Get the customer ID from the database
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single()

  if (!subscription?.stripe_customer_id) {
    throw new Error("Customer not found")
  }

  // Create a portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  })

  return portalSession
}

// Check if a user has an active subscription
export async function hasActiveSubscription(userId: string) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("user_id", userId)
    .single()

  if (!subscription) {
    return false
  }

  // Check if the subscription is active or in trial
  if (subscription.status === "active") {
    return true
  }

  // Check if the trial is still valid
  if (subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()) {
    return true
  }

  return false
}

