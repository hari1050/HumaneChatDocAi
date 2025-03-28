const AnimatedBorderCard = ({ title, description }: { title: string; description: string }) => (
    <div className="relative p-[1px] rounded-xl overflow-hidden bg-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#ff4444] animate-border-rotate" />
      </div>
      <div className="relative bg-white p-6 rounded-xl h-full">
        <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
  
  export default function FeaturesSection() {
    const features = [
      {
        title: "The Tab Dance",
        description:
          "ChatGPT in one tab. Google Docs in another. Research scattered across browsers. Your attention split between a dozen windows.",
      },
      {
        title: "AI Without Control",
        description:
          "AI tools generate content, but you can't edit or refine it in real-time. Copy-paste becomes your unwanted best friend.",
      },
      {
        title: "Creativity Interrupted",
        description:
          "Every tool switch is a mental switch. Every context change breaks your flow. Your best ideas get lost in transition.",
      },
    ]
  
    return (
      <section className="py-20 px-6 md:px-10 lg:px-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-16">
            Writing doesn't have to hard, make it easier with Humane
          </h2>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedBorderCard key={index} title={feature.title} description={feature.description} />
            ))}
          </div>
  
          <p className="text-gray-400 text-center mt-12 italic">
            Humane brings AI generation and authoring into one seamless space. No more switching. No more interruptions.
            Just you and your flow.
          </p>
        </div>
      </section>
    )
  }
  
  