"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { FileText, BookOpen, FileCode, Send, LayoutList, Presentation } from "lucide-react"

export default function UseCasesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const useCases = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Essays",
      description: "Save hours writing your essays with AI",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Literature reviews",
      description: "Discover, write, and cite relevant research.",
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      title: "Research Papers",
      description: "Polish your writing to increase submission success.",
    },
    {
      icon: <Send className="w-6 h-6" />,
      title: "Personal statements",
      description: "Create a compelling college motivation letter.",
    },
    {
      icon: <LayoutList className="w-6 h-6" />,
      title: "Blog posts",
      description: "Write blogs & articles faster with the help of AI.",
    },
    {
      icon: <Presentation className="w-6 h-6" />,
      title: "Speeches",
      description: "Write your next compelling speech in less time.",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section className="py-20 px-6 md:px-8 bg-black relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-4">
          <span className="text-blue-500 font-semibold uppercase tracking-wider text-sm">USE CASES</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">You're in control</h2>
        <p className="text-gray-400 text-center text-lg mb-16">Types of content WriticaAI can help you with</p>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-[#111] rounded-xl p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              <div className="rounded-full p-3 bg-[#222] w-12 h-12 flex items-center justify-center mb-4">
                {useCase.icon}
              </div>
              <h3 className="text-white text-xl font-semibold mb-3">{useCase.title}</h3>
              <p className="text-gray-400 text-sm">{useCase.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
