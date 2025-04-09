"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [displayText, setDisplayText] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const words = ["Write", "Edit", "Research"]
  const typingSpeed = 150
  const deletingSpeed = 100
  const pauseBeforeDelete = 1500
  const pauseBeforeNextWord = 500

  useEffect(() => {
    setMounted(true)
  }, [])

  // Typewriter effect
  useEffect(() => {
    if (!mounted) return

    let timer: NodeJS.Timeout

    if (isDeleting) {
      // Deleting text
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, deletingSpeed)
      } else {
        // Finished deleting, move to next word
        setIsDeleting(false)
        setWordIndex((prev) => (prev + 1) % words.length)
        timer = setTimeout(() => {}, pauseBeforeNextWord)
      }
    } else {
      // Typing text
      const currentWord = words[wordIndex]
      if (displayText.length < currentWord.length) {
        timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1))
        }, typingSpeed)
      } else {
        // Finished typing, pause before deleting
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, pauseBeforeDelete)
      }
    }

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, wordIndex, words, mounted])

  const handleApply = () => {
    setIsApplying(true)
    
    // Simulate processing time
    setTimeout(() => {
      setIsApplying(false)
      setIsApplied(true)
      
      // Show success message
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    }, 1500)
  }

  const originalText =
    "The future of writing is here. Lucid enables writers to produce high-quality content faster than ever before."
  const improvedText =
    "The revolution in writing has arrived! Lucid empowers writers to craft compelling, high-quality content with unprecedented speed and efficiency."

  if (!mounted) return null

  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black"></div>

      <div className="container relative z-10 px-6 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Left side - Text and CTA */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#ff7e93] via-[#d580ff] to-[#6c7dff] bg-clip-text text-transparent">
                  {displayText} in Flow.
                </span>
                <br />
                <span className="text-white">AI by Your Side.</span>
              </h1>

              <p className="text-zinc-500 text-base md:text-lg max-w-xl mt-6">
                The constant switching between research, AI tools, and your document is killing your flow.{" "}
                <span className="text-white font-medium">Lucid brings everything into one seamless space.</span> When
                writing is uninterrupted, creativity flourishes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="group bg-white hover:bg-white/90 text-black rounded-full px-6 py-3 h-auto text-base font-medium relative z-10"
                >
                  Start Writing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              {/* Rainbow glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff7e93] via-[#d580ff] to-[#6c7dff] rounded-md blur opacity-10 group-hover:opacity-20 transition duration-1000 -z-10"></div>

              <div className="mt-4 text-sm flex items-center justify-center md:justify-start">
                <span className="inline-flex items-center text-[#4ade80]">
                  <span className="mr-2">✨</span>
                  Free to use, no credit card
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right side - Editor showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="w-full md:w-1/2 mt-8 md:mt-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-zinc-800 bg-[#121212]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#111]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                </div>
                <div className="flex-1 text-right text-sm text-zinc-400">
                  <span className="mr-1">✎</span> My Document
                </div>
              </div>
              <div className="border-t border-zinc-800 my-0"></div>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {isApplied ? (
                    <motion.div
                      key="improved"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-white text-xl mb-8"
                    >
                      {improvedText}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="original"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-white text-xl mb-8"
                    >
                      {originalText}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!isApplied && !isApplying && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#1a1a1a] rounded-lg p-4 mb-6 text-zinc-300 border border-zinc-800"
                    >
                      <span className="mr-2">✨</span> Make this paragraph more engaging
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!isApplied && !isApplying && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-red-500/10 rounded-lg p-4 mb-6 border-l-2 border-red-500"
                      >
                        <div className="text-zinc-400">{originalText}</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-green-500/10 rounded-lg p-4 border-l-2 border-green-500"
                      >
                        <div className="text-zinc-300">{improvedText}</div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center gap-2 text-green-500 mt-4 bg-green-500/10 p-3 rounded-lg"
                    >
                      <Check size={16} />
                      <span>Changes applied successfully</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-6 right-6">
                  <AnimatePresence mode="wait">
                    {!isApplied && !isApplying && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApply}
                        className="bg-white text-black rounded-full px-6 py-2 text-base font-medium hover:bg-zinc-100 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                      >
                        Apply
                      </motion.button>
                    )}

                    {isApplying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white text-black rounded-full px-6 py-2 text-base font-medium flex items-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
