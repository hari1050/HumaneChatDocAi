"use client"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import Link from "next/link"

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-purple-500"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-purple-500"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

export default function HeroSection() {
  const [isApplied, setIsApplied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [displayText, setDisplayText] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const words = ["Write", "Edit", "Research"]
  const typingSpeed = 150
  const deletingSpeed = 100
  const pauseBeforeDelete = 1500
  const pauseBeforeNextWord = 500

  // Typewriter effect
  useEffect(() => {
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
  }, [displayText, isDeleting, wordIndex, words])

  const handleApply = () => {
    setIsApplied(true)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 2000)
  }

  const originalText =
    "The future of content creation is here. Humane enables writers to produce high-quality content faster than ever before."
  const improvedText =
    "The revolution in content creation has arrived! Humane empowers writers to craft compelling, high-quality content with unprecedented speed and efficiency."

  return (
    <section className="gradient-bg py-16 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex flex-col items-center mb-4 w-full">
            <div className="h-24 md:h-28 lg:h-32 flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-[#e62e2e] via-[#e62e2e] to-[#222] bg-clip-text text-transparent">
                {displayText}
                <span className="animate-blink">|</span>
              </h1>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-6">with AI</h1>
          </div>

          <p className="text-white/90 max-w-2xl mx-auto mb-6 text-lg font-inter font-bold">
            Tired of juggling between Google, Word, and AI tools? Humane brings everything under one easy to use,
            intuitive space.
          </p>

          <p className="text-white/80 text-lg font-inter font-bold mb-4 text-center">make writing great again</p>

          <Link href="/sign-up">
            <Button className="bg-gradient-to-br from-[#e83f2f] via-[#e83f2f] to-[#222] hover:opacity-90 text-white text-base px-6 py-6 h-auto">
              Try Humane
            </Button>
          </Link>

          {/* Editor showcase image */}
          <div className="relative rounded-xl overflow-hidden shadow-xl mx-auto max-w-4xl mt-12 bg-[#1a1a1a]">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="flex-1 text-center text-sm text-gray-400">✍️ My Document</div>
            </div>
            <div className="p-6">
              <div className="text-white/90 text-lg mb-6 text-center">{isApplied ? improvedText : originalText}</div>
              {!isApplied && (
                <div className="bg-[#1e1e1e] rounded-lg p-4 mb-4 text-gray-300">
                  ✨ Make this paragraph more engaging
                </div>
              )}
              {!isApplied && (
                <div className="border-l-2 border-red-500 bg-[#1e1e1e]/50 rounded-lg p-4 mb-4">
                  <div className="text-gray-400">{originalText}</div>
                </div>
              )}
              {!isApplied && (
                <div className="border-l-2 border-green-500 bg-[#1e1e1e]/50 rounded-lg p-4">
                  <div className="text-gray-300">{improvedText}</div>
                </div>
              )}
              {showSuccess && (
                <div className="flex items-center justify-center gap-2 text-green-500 mt-4">
                  <Check size={16} />
                  <span>Changes applied successfully</span>
                </div>
              )}
              {!isApplied && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleApply}
                    className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

