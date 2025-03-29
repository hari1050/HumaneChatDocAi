"use client"

import Header from "@/components/landing/Header"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import ComparisonSection from "@/components/landing/ComparisonSection"
import UseCasesSection from "@/components/landing/UseCasesSection"
import PricingSection from "@/components/landing/PricingSection"
import Footer from "@/components/landing/Footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ComparisonSection />
      <UseCasesSection />
      <PricingSection />
      <Footer />
    </main>
  )
}

