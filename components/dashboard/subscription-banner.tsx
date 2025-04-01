"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { SubscriptionStatus } from "@/lib/subscription-service"

interface SubscriptionBannerProps {
  subscriptionStatus: SubscriptionStatus
  userId: string
}

export function SubscriptionBanner({ subscriptionStatus, userId }: SubscriptionBannerProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create portal session")
      }

      const { url } = await response.json()

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error("Error creating portal session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to manage subscription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create checkout session")
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start trial",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (subscriptionStatus.isActive || subscriptionStatus.isTrialing) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-white font-medium">
              {subscriptionStatus.isTrialing
                ? "Trial Active"
                : subscriptionStatus.willExpire
                  ? "Subscription Ending"
                  : "Subscription Active"}
            </h3>
            <p className="text-gray-400 text-sm">
              {subscriptionStatus.isTrialing
                ? `Your trial ends on ${formatDate(subscriptionStatus.trialEndsAt)}`
                : subscriptionStatus.willExpire
                  ? `Your subscription will end on ${formatDate(subscriptionStatus.currentPeriodEnd)}`
                  : `Your next billing date is ${formatDate(subscriptionStatus.currentPeriodEnd)}`}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/20 hover:bg-[#222]"
            onClick={handleManageSubscription}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Manage Subscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-white font-medium">Start Your Free Trial</h3>
          <p className="text-gray-400 text-sm">Get full access to all features for 3 days, then $29/month</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#ff4444] via-[#ff8f44] to-[#ffcd44] hover:opacity-90 text-white"
          onClick={handleStartTrial}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Start Free Trial
        </Button>
      </div>
    </div>
  )
}

