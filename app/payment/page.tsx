"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false)

  // Check if user already has a subscription
  useEffect(() => {
    if (!isLoaded) return

    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/check")
        const data = await response.json()

        if (data.hasActiveSubscription) {
          router.push("/dashboard")
        } else {
          setHasCheckedSubscription(true)
        }
      } catch (error) {
        console.error("Error checking subscription:", error)
        setHasCheckedSubscription(true)
      }
    }

    checkSubscription()
  }, [isLoaded, router])

  const handleStartTrial = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
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

  if (!isLoaded || !hasCheckedSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="max-w-md w-full bg-[#111] rounded-xl p-8 border border-white/10">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Start Your 3-Day Free Trial</h1>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-white">3-Day Free Trial</h3>
              <p className="text-gray-400 text-sm">Full access to all premium features</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-white">$29/month after trial</h3>
              <p className="text-gray-400 text-sm">Automatically billed after 3 days unless canceled</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-white">Cancel anytime</h3>
              <p className="text-gray-400 text-sm">No commitment, cancel before the trial ends to avoid charges</p>
            </div>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-[#ff4444] via-[#ff8f44] to-[#ffcd44] hover:opacity-90 text-white py-6 h-auto"
          onClick={handleStartTrial}
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

        <p className="text-gray-400 text-xs text-center mt-4">
          By starting your free trial, you agree to our Terms of Service and authorize us to charge your payment method
          after the trial ends.
        </p>
      </div>
    </div>
  )
}

