import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTASection() {
  return (
    <section className="bg-black py-16 px-6 md:px-10 lg:px-20 text-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Documentation?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Join thousands of writers who are already using Humane to streamline their documentation process.
        </p>
        <Link href="/sign-up">
          <Button className="bg-gradient-to-r from-[#ff6b6b] to-[#444] hover:opacity-90 text-white px-6 py-6 h-auto font-medium">
            Get Started Free
          </Button>
        </Link>
      </div>
    </section>
  )
}

