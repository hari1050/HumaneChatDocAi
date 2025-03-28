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
  buttonVariant: "default" | "secondary" | "outline"
  index: number
}

function TemplateCard({ category, title, description, buttonVariant, index }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className="transition-all hover:shadow-md border border-white/10 bg-secondary/10 h-full flex flex-col">
        <CardHeader className="pb-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded inline-block ${
              category === "Finance"
                ? "bg-green-900/50 text-green-400"
                : category === "Legal"
                  ? "bg-blue-900/50 text-blue-400"
                  : "bg-purple-900/50 text-purple-400"
            }`}
          >
            {category}
          </span>
        </CardHeader>
        <CardContent className="pb-4 flex-1">
          <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
        <CardFooter>
          <Button
            variant={buttonVariant}
            className={`w-full ${buttonVariant === "default" ? "bg-primary hover:bg-primary/90 hover:translate-y-[-2px] transition-transform" : "border-primary/50 hover:border-primary"}`}
          >
            Try Template
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export function TemplatesSection() {
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
      buttonVariant: "outline" as const,
    },
    {
      category: "Legal",
      title: "Contract Analyzer",
      description: "Review this contract and highlight key terms, risks, and suggested changes",
      buttonVariant: "default" as const,
    },
    {
      category: "Technical",
      title: "API Documentation",
      description: "Create comprehensive API documentation from our codebase",
      buttonVariant: "outline" as const,
    },
  ]

  return (
    <section ref={ref} className="py-20 px-6 md:px-10 lg:px-20 bg-background relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white glow-text">Ready-to-Use AI Templates</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
              buttonVariant={template.buttonVariant}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

