"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function PricingSection() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const features = [
    "Full access to all features",
    "Priority onboarding support",
    "Unlimited team members",
    "Early adopter benefits",
  ]

  const handleSubscribe = async () => {
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

  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 text-center text-lg mb-16">Choose the plan that's right for you</p>

        <div className="flex justify-center">
          <div className="bg-[#111] rounded-xl p-8 md:p-12 w-full max-w-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Beta Access</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 mb-6 text-sm">3-day free trial, cancel anytime</p>

              <Button
                className="w-full mb-8 bg-white text-black hover:bg-white/90 border-0"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <CheckIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
