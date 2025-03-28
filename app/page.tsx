"use client"

import Header from "@/components/landing/Header"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import ComparisonSection from "@/components/landing/ComparisonSection"
import UseCasesSection from "@/components/landing/UseCasesSection"
import DepartmentSection from "@/components/landing/DepartmentSection"
import PricingSection from "@/components/landing/PricingSection"
import CTASection from "@/components/landing/CTASection"
import Footer from "@/components/landing/Footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ComparisonSection />
      <UseCasesSection />
      <DepartmentSection />
      <PricingSection />
      <Footer />
    </main>
  )
}

