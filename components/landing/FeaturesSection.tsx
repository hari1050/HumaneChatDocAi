"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { MessageSquare, Sparkles, Search } from "lucide-react"

export default function FeaturesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "The Tab Dance",
      description:
        "ChatGPT in one tab. Google Docs in another. Research scattered across browsers. Your attention split between a dozen windows.",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Without Control",
      description:
        "AI tools generate content, but you can't edit or refine it in real-time. Copy-paste becomes your unwanted best friend.",
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Creativity Interrupted",
      description:
        "Every tool switch is a mental switch. Every context change breaks your flow. Your best ideas get lost in transition.",
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
    <section className="w-full py-20 bg-black relative">
      <div className="container px-6 md:px-8 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white">
              Writing doesn't have to hard, make it easier with WriticaAI
            </h2>
          </motion.div>
        </div>
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col p-8 rounded-xl bg-[#111] shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              <div className="rounded-full p-3 bg-[#222] w-12 h-12 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-gray-400 text-center mt-12 italic text-sm">
        WriticaAI brings AI generation and authoring into one seamless space. No more switching. No more interruptions.
          Just you and your flow.
        </p>
      </div>
    </section>
  )
}
