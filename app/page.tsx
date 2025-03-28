"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UseCasesSection } from "@/components/landing/use-cases-section"
import { TemplatesSection } from "@/components/landing/templates-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HeroSection } from "@/components/landing/hero-section"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur transition-all duration-300 ${
          scrolled
            ? "bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl text-white">WriteX</span>
            </Link>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center space-x-8">
            <Link
              href="#features"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#use-cases"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-white"
            >
              Use Cases
            </Link>
            <Link
              href="#templates"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-white"
            >
              Templates
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="outline" className="border-primary/50 hover:border-primary">
                  Sign Up
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="use-cases">
          <UseCasesSection />
        </div>
        <div id="templates">
          <TemplatesSection />
        </div>
        <section className="w-full py-12 md:py-24 bg-gradient-to-b from-background to-background/60">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white glow-text">
                  Ready to transform your writing experience?
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Join thousands of writers, researchers, and professionals who use WriteX to enhance their content.
                </p>
              </div>
              <div className="space-x-4 pt-6">
                <Link href="/dashboard">
                  <Button size="lg" className="group bg-primary hover:bg-primary/90">
                    Start Writing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 WriteX. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

