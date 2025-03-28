"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { FileText, BookOpen, FileCode, Send, LayoutList, Presentation } from "lucide-react"

export function UseCasesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const useCases = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Essays",
      description: "Save hours writing your essays with AI",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Literature reviews",
      description: "Discover, write, and cite relevant research.",
    },
    {
      icon: <FileCode className="w-8 h-8" />,
      title: "Research Papers",
      description: "Polish your writing to increase submission success.",
    },
    {
      icon: <Send className="w-8 h-8" />,
      title: "Personal statements",
      description: "Create a compelling college motivation letter.",
    },
    {
      icon: <LayoutList className="w-8 h-8" />,
      title: "Blog posts",
      description: "Write blogs & articles faster with the help of AI.",
    },
    {
      icon: <Presentation className="w-8 h-8" />,
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
    <section className="bg-gradient-to-b from-gray-950 to-gray-900 py-20 px-6 md:px-10 lg:px-20 text-white relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-primary font-semibold uppercase tracking-wider">USE CASES</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-white glow-text">
          You're in control
        </h2>
        <p className="text-gray-400 text-center text-xl mb-16">Types of content WriteX can help you with</p>

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
              className="bg-gray-900 rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:translate-y-[-5px] duration-300"
            >
              <div className="text-primary mb-6">{useCase.icon}</div>
              <h3 className="text-white text-xl font-semibold mb-3">{useCase.title}</h3>
              <p className="text-gray-400 mb-4">{useCase.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

