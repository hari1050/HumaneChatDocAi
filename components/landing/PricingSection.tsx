"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function PricingSection() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (planType: string) => {
    setIsLoading(true)

    try {
      // First, check if the user is authenticated by making a lightweight request
      const authCheckResponse = await fetch("/api/auth/check", {
        method: "GET",
      })

      // If not authenticated, redirect to sign-in
      if (!authCheckResponse.ok) {
        // Redirect to sign-up page
        router.push("/sign-up")
        return
      }

      // User is authenticated, redirect to payment page
      router.push("/payment")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Define the plans with the same structure as the subscription page
  const plans = [
    {
      name: "free",
      title: "Free",
      price: 0,
      description: "Basic features for personal use",
      features: ["5 Documents", "25 Chat Queries per month", "5 Research Queries per month", "Basic AI Models"],
    },
    {
      name: "pro",
      title: "Pro",
      price: 16.99,
      description: "Advanced features for professionals",
      highlighted: true,
      features: [
        "100 Documents",
        "150 Chat Queries per month",
        "15 Research Queries per month",
        "Priority Support",
        "Advanced AI Models",
      ],
    },
    {
      name: "advanced",
      title: "Advanced",
      price: 39.99,
      description: "Enterprise-grade features for teams",
      features: [
        "Unlimited Documents",
        "500 Chat Queries per month",
        "50 Research Queries per month",
        "Priority Support",
        "Advanced AI Models",
      ],
    },
  ]

  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 text-center text-lg mb-16">Choose the plan that's right for you</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-[#111] rounded-xl p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300 flex flex-col ${
                plan.highlighted ? "border border-primary" : ""
              }`}
            >
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                </div>
                {plan.highlighted && <Badge className="bg-primary text-primary-foreground">Popular</Badge>}
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-400 ml-1">/month</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.name === "free" ? "bg-white text-black hover:bg-white/90" : "bg-white text-black hover:bg-white/90"}`}
                onClick={() => handleSubscribe(plan.name)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : plan.name === "free" ? (
                  "Get Started"
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
