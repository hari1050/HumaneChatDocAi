import { supabase } from "./supabase"
import { auth } from "@clerk/nextjs/server"
import type { PlanType, Subscription } from "@/types/subscription"

// Define feature types
export type FeatureType = "documents" | "chat_queries" | "research_queries"

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    documents: 5,
    chat_queries: 25,
    research_queries: 5,
  },
  pro: {
    documents: 100,
    chat_queries: 150,
    research_queries: 15,
  },
  advanced: {
    documents: Number.POSITIVE_INFINITY,
    chat_queries: 500,
    research_queries: 50,
  },
}

// Get the current user's subscription
export async function getUserSubscription(userId?: string): Promise<Subscription | null> {
  // If userId is not provided, get it from auth
  if (!userId) {
    const { userId: authUserId } = await auth()
    if (!authUserId) return null
    userId = authUserId
  }

  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single()

  if (error) {
    // If no subscription found, create a free subscription
    if (error.code === "PGRST116") {
      try {
        const newSubscription = await upsertSubscription({
          user_id: userId,
          plan_type: "free",
          status: "active",
          cancel_at_period_end: false,
        })
        return newSubscription
      } catch (createError) {
        console.error("Error creating default subscription:", createError)
        return null
      }
    }

    console.error("Error fetching subscription:", error)
    return null
  }

  return data as Subscription
}

// Create or update a user's subscription
export async function upsertSubscription(
  subscription: Partial<Subscription> & { user_id: string },
): Promise<Subscription | null> {
  const { data, error } = await supabase.from("subscriptions").upsert(subscription).select().single()

  if (error) {
    console.error("Error upserting subscription:", error)
    return null
  }

  return data as Subscription
}

// Get the current billing period
function getCurrentBillingPeriod() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { startOfMonth, endOfMonth }
}

// Get or create usage record for the current period
async function getOrCreateUsageRecord(userId: string) {
  const { startOfMonth, endOfMonth } = getCurrentBillingPeriod()

  // Try to get existing record
  const { data, error } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .gte("period_start", startOfMonth.toISOString())
    .lte("period_end", endOfMonth.toISOString())
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No record found, create a new one
      const { data: newData, error: insertError } = await supabase
        .from("usage")
        .insert({
          user_id: userId,
          period_start: startOfMonth.toISOString(),
          period_end: endOfMonth.toISOString(),
          documents_count: 0,
          chat_queries_count: 0,
          research_queries_count: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating usage record:", insertError)
        return null
      }

      return newData
    }

    console.error("Error fetching usage record:", error)
    return null
  }

  return data
}

// Get the user's feature usage for the current period
export async function getUserFeatureUsage(userId: string, feature: FeatureType): Promise<number> {
  const usageRecord = await getOrCreateUsageRecord(userId)
  if (!usageRecord) return 0

  // Return the count for the specific feature
  const countField = `${feature}_count`
  return usageRecord[countField] || 0
}

// Increment usage for a specific feature
export async function incrementFeatureUsage(userId: string, feature: FeatureType): Promise<boolean> {
  const usageRecord = await getOrCreateUsageRecord(userId)
  if (!usageRecord) return false

  const countField = `${feature}_count`
  const currentCount = usageRecord[countField] || 0

  // Update the specific feature count
  const { error } = await supabase
    .from("usage")
    .update({ [countField]: currentCount + 1, updated_at: new Date().toISOString() })
    .eq("id", usageRecord.id)

  if (error) {
    console.error(`Error incrementing ${feature} usage:`, error)
    return false
  }

  return true
}

// Decrement usage for a specific feature
export async function decrementFeatureUsage(userId: string, feature: FeatureType): Promise<boolean> {
  const usageRecord = await getOrCreateUsageRecord(userId)
  if (!usageRecord) return false

  const countField = `${feature}_count`
  const currentCount = usageRecord[countField] || 0

  // Don't allow negative counts
  const newCount = Math.max(0, currentCount - 1)

  // Update the specific feature count
  const { error } = await supabase
    .from("usage")
    .update({ [countField]: newCount, updated_at: new Date().toISOString() })
    .eq("id", usageRecord.id)

  if (error) {
    console.error(`Error decrementing ${feature} usage:`, error)
    return false
  }

  return true
}

// Check if a user has reached their limit for a specific feature
export async function hasReachedFeatureLimit(userId: string, feature: FeatureType): Promise<boolean> {
  // Get the user's subscription
  const subscription = await getUserSubscription(userId)
  if (!subscription) return true // No subscription means no access

  const planType = subscription.plan_type as keyof typeof PLAN_LIMITS

  // Get the limit for the user's plan
  const limit = PLAN_LIMITS[planType][feature]

  // If the limit is Infinity, the user has unlimited access
  if (limit === Number.POSITIVE_INFINITY) return false

  // Get the user's current usage
  const usage = await getUserFeatureUsage(userId, feature)

  // Check if usage has reached the limit
  return usage >= limit
}

// Update the hasActiveSubscription function to create a free subscription if none exists
export async function hasActiveSubscription(userId?: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    // If no subscription exists, create a free subscription for the user
    if (userId) {
      try {
        await upsertSubscription({
          user_id: userId,
          plan_type: "free",
          status: "active",
          cancel_at_period_end: false,
        })
        return true // Free plan is active
      } catch (error) {
        console.error("Error creating default subscription:", error)
        return false
      }
    }
    return false
  }

  // Free plan is always considered active
  if (subscription.plan_type === "free") return true

  // Check if the subscription is active and not expired
  return (
    subscription.status === "active" &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
  )
}

// Get the user's current plan type
export async function getUserPlanType(userId?: string): Promise<PlanType> {
  const subscription = await getUserSubscription(userId)
  return subscription?.plan_type || "free"
}
