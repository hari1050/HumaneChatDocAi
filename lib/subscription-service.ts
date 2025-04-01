import { supabase } from "./supabase"

export type SubscriptionStatus = {
  isActive: boolean
  isTrialing: boolean
  willExpire: boolean
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, cancel_at_period_end, trial_ends_at, current_period_end")
      .eq("user_id", userId)
      .single()

    if (!subscription) {
      return {
        isActive: false,
        isTrialing: false,
        willExpire: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
      }
    }

    const now = new Date()
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null

    const isActive = subscription.status === "active"
    const isTrialing = trialEndsAt ? trialEndsAt > now : false
    const willExpire = subscription.status === "active" && subscription.cancel_at_period_end

    return {
      isActive,
      isTrialing,
      willExpire,
      trialEndsAt,
      currentPeriodEnd,
    }
  } catch (error) {
    console.error("Error getting subscription status:", error)
    return {
      isActive: false,
      isTrialing: false,
      willExpire: false,
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isActive || status.isTrialing
}

