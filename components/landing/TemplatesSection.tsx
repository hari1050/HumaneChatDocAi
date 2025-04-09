"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

type TemplateCardProps = {
  category: string
  title: string
  description: string
  index: number
}

function TemplateCard({ category, title, description, index }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className="transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] border-0 bg-[#111] h-full flex flex-col">
        <CardHeader className="pb-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded inline-block ${
              category === "Finance"
                ? "bg-green-500/10 text-green-500"
                : category === "Legal"
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-purple-500/10 text-purple-500"
            }`}
          >
            {category}
          </span>
        </CardHeader>
        <CardContent className="pb-4 flex-1">
          <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full bg-white text-black hover:bg-white/90 border-0">
            Try Template
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default function TemplatesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const templates = [
    {
      category: "Finance",
      title: "Quarterly Report Generator",
      description: "Generate a quarterly report based on our financial metrics and previous reports",
    },
    {
      category: "Legal",
      title: "Contract Analyzer",
      description: "Review this contract and highlight key terms, risks, and suggested changes",
    },
    {
      category: "Technical",
      title: "API Documentation",
      description: "Create comprehensive API documentation from our codebase",
    },
  ]

  return (
    <section ref={ref} className="py-20 px-6 md:px-8 bg-black relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready-to-Use AI Templates</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            Start with our curated collection of industry-specific prompts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <TemplateCard
              key={index}
              index={index}
              category={template.category}
              title={template.title}
              description={template.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
