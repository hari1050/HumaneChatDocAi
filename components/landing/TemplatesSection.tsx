import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

type TemplateCardProps = {
  category: string
  title: string
  description: string
  buttonVariant: "default" | "secondary" | "outline"
}

function TemplateCard({ category, title, description, buttonVariant }: TemplateCardProps) {
  return (
    <Card className="transition-all hover:shadow-md border border-gray-200">
      <CardHeader className="pb-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            category === "Finance"
              ? "bg-green-100 text-green-800"
              : category === "Legal"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
          }`}
        >
          {category}
        </span>
      </CardHeader>
      <CardContent className="pb-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
      <CardFooter>
        <Button variant={buttonVariant} className={buttonVariant === "default" ? "primary-button w-full" : "w-full"}>
          Try Template
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function TemplatesSection() {
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
    <section className="py-20 px-6 md:px-10 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready-to-Use AI Templates</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start with our curated collection of industry-specific prompts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <TemplateCard
              key={index}
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

