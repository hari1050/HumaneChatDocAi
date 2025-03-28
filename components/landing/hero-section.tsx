"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden relative bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70 pointer-events-none" />
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm text-primary mb-4">
              <Sparkles className="h-4 w-4 inline mr-2" />
              Powered by AI
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white glow-text">
              Your Intelligent Writing Assistant
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
              Create, refine, and enhance your content with the power of AI. Get started with Lucid today.
            </p>
          </motion.div>
          <motion.div
            className="space-x-4 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/dashboard">
              <Button size="lg" className="group bg-primary hover:bg-primary/90">
                Start Writing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="border-primary/50 hover:border-primary">
                Learn More
              </Button>
            </Link>
          </motion.div>
          <motion.div
            className="pt-12 w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl glow-primary">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/10 animate-gradient" />
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-70" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

