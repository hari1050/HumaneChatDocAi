import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

export default function PricingSection() {
  const features = [
    "Full access to all features",
    "Priority onboarding support",
    "Unlimited team members",
    "Early adopter benefits",
  ]

  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 text-center text-xl mb-16">Choose the plan that's right for you</p>

        <div className="flex justify-center">
          <div className="bg-[#111] rounded-2xl p-8 md:p-12 w-full max-w-lg border border-white/10">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Beta Access</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 mb-6">3-day free trial, cancel anytime</p>

              <Button className="w-full mb-8 bg-gradient-to-r from-[#ff4444] via-[#ff8f44] to-[#ffcd44] hover:opacity-90 text-white">
                Get Started
              </Button>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <CheckIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

