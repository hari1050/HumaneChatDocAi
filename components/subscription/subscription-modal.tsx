"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Subscription, PlanDetails } from "@/types/subscription"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchSubscription()
    }
  }, [open])

  async function fetchSubscription() {
    try {
      setLoading(true)
      const response = await fetch("/api/subscription")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (planType: string) => {
    setCheckoutLoading(true)
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/dashboard?subscription=canceled`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating portal:", error)
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      })
    } finally {
      setPortalLoading(false)
    }
  }

  // Define plan details
  const plans: PlanDetails[] = [
    {
      name: "free",
      title: "Free",
      price: 0,
      description: "Basic features for personal use",
      features: [
        { name: "Documents", free: "5", pro: "100", advanced: "Unlimited" },
        { name: "Chat Queries", free: "25/month", pro: "150/month", advanced: "500/month" },
        { name: "Research Queries", free: "5/month", pro: "15/month", advanced: "50/month" },
        { name: "Priority Support", free: false, pro: true, advanced: true },
        { name: "Advanced AI Models", free: false, pro: true, advanced: true },
      ],
    },
    {
      name: "pro",
      title: "Pro",
      price: 29,
      description: "Advanced features for professionals",
      highlighted: true,
      features: [
        { name: "Documents", free: "5", pro: "100", advanced: "Unlimited" },
        { name: "Chat Queries", free: "25/month", pro: "150/month", advanced: "500/month" },
        { name: "Research Queries", free: "5/month", pro: "15/month", advanced: "50/month" },
        { name: "Priority Support", free: false, pro: true, advanced: true },
        { name: "Advanced AI Models", free: false, pro: true, advanced: true },
      ],
    },
    {
      name: "advanced",
      title: "Advanced",
      price: 79,
      description: "Enterprise-grade features for teams",
      features: [
        { name: "Documents", free: "5", pro: "100", advanced: "Unlimited" },
        { name: "Chat Queries", free: "25/month", pro: "150/month", advanced: "500/month" },
        { name: "Research Queries", free: "5/month", pro: "15/month", advanced: "50/month" },
        { name: "Priority Support", free: false, pro: true, advanced: true },
        { name: "Advanced AI Models", free: false, pro: true, advanced: true },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Subscription</DialogTitle>
          <DialogDescription>Manage your subscription and usage limits</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`flex flex-col ${plan.highlighted ? "border-primary shadow-lg" : "border-border"}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{plan.title}</CardTitle>
                          <CardDescription className="mt-1.5">{plan.description}</CardDescription>
                        </div>
                        {plan.highlighted && <Badge className="bg-primary text-primary-foreground">Popular</Badge>}
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        {plan.price > 0 && <span className="text-muted-foreground ml-1">/month</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <div className="mr-2 mt-1">
                              {feature[plan.name] === true ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : feature[plan.name] === false ? (
                                <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm">
                                {feature.name}
                                {typeof feature[plan.name] !== "boolean" && (
                                  <span className="font-medium">: {feature[plan.name]}</span>
                                )}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-4">
                      {subscription?.plan_type === plan.name ? (
                        <Button className="w-full" variant="outline" disabled>
                          Current Plan
                        </Button>
                      ) : plan.name === "free" ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleManageSubscription()}
                          disabled={portalLoading}
                        >
                          {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Downgrade
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => handleCheckout(plan.name)} disabled={checkoutLoading}>
                          {checkoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Upgrade
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>Track your feature usage against your plan limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageStats subscription={subscription} />
                </CardContent>
                {subscription && subscription.plan_type !== "free" && (
                  <CardFooter>
                    <Button onClick={handleManageSubscription} disabled={portalLoading}>
                      {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Manage Subscription
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function UsageStats({ subscription }: { subscription: Subscription | null }) {
  const [usageData, setUsageData] = useState<Record<string, number>>({
    documents: 0,
    chat_queries: 0,
    research_queries: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const response = await fetch("/api/subscription/usage")
        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }
        const data = await response.json()
        setUsageData(data)
      } catch (error) {
        console.error("Error fetching usage data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  // Define limits based on subscription plan
  const getLimits = () => {
    const plan = subscription?.plan_type || "free"
    switch (plan) {
      case "advanced":
        return {
          documents: Number.POSITIVE_INFINITY,
          chat_queries: 500,
          research_queries: 50,
        }
      case "pro":
        return {
          documents: 100,
          chat_queries: 150,
          research_queries: 15,
        }
      case "free":
      default:
        return {
          documents: 5,
          chat_queries: 25,
          research_queries: 5,
        }
    }
  }

  const limits = getLimits()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(usageData).map(([feature, count]) => {
        const limit = limits[feature as keyof typeof limits]
        const percentage = limit === Number.POSITIVE_INFINITY ? 0 : (count / limit) * 100
        const isNearLimit = percentage > 80
        const isOverLimit = percentage >= 100

        return (
          <div key={feature} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium capitalize">{feature.replace(/_/g, " ")}</h3>
              <span className="text-sm">
                {count} / {limit === Number.POSITIVE_INFINITY ? "∞" : limit}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isOverLimit ? "bg-destructive" : isNearLimit ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
