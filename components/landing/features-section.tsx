"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { MessageSquare, Sparkles, Search, Zap, FileText, RefreshCw } from "lucide-react"

export function FeaturesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const features = [
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: "AI-Powered Writing",
      description: "Transform your ideas into polished content with our advanced AI writing assistant.",
    },
    {
      icon: <MessageSquare className="h-10 w-10" />,
      title: "Intelligent Chat",
      description: "Get real-time assistance and suggestions as you write with our contextual AI chat.",
    },
    {
      icon: <Search className="h-10 w-10" />,
      title: "Research Assistant",
      description: "Search the web and explore topics without leaving your document editor.",
    },
    {
      icon: <RefreshCw className="h-10 w-10" />,
      title: "Content Transformation",
      description: "Rewrite, summarize, expand, or change the tone of your content with a single click.",
    },
    {
      icon: <FileText className="h-10 w-10" />,
      title: "Document Management",
      description: "Organize and manage all your documents in one place with our intuitive interface.",
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "Instant Formatting",
      description: "Format your documents instantly with our powerful editing tools and templates.",
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
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background/90 to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm text-primary mb-4">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white glow-text">
              Powerful Tools for Every Writer
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              WriteX combines cutting-edge AI with intuitive design to enhance your writing experience.
            </p>
          </div>
        </div>
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-secondary/10 border border-white/10 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="rounded-full p-3 bg-primary/20 text-primary mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

