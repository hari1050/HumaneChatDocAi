import type React from "react"

const UseCaseCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-[#111] rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
    <div className="text-blue-500 mb-6">{icon}</div>
    <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400 mb-4">{description}</p>
  </div>
)

export default function UseCasesSection() {
  const useCases = [
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h16v2H4v-2z" fill="currentColor" />
        </svg>
      ),
      title: "Essays",
      description: "Save hours writing your essays with AI",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Literature reviews",
      description: "Discover, write, and cite relevant research.",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 14l9-5-9-5-9 5 9 5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 14l9-5-9-5-9 5 9 5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Research Papers",
      description: "Polish your writing to increase submission success.",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Personal statements",
      description: "Create a compelling college motivation letter.",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 20h9M3 20h3m3 0h3M3 12h18M3 4h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Blog posts",
      description: "Write blogs & articles faster with the help of AI.",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 18.5v-3m0-3v3m0 0h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Speeches",
      description: "Write your next compelling speech in less time.",
    },
  ]

  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-blue-500 font-semibold uppercase tracking-wider">USE CASES</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">You're in control</h2>
        <p className="text-gray-400 text-center text-xl mb-16">Types of content Humane can help you with</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} icon={useCase.icon} title={useCase.title} description={useCase.description} />
          ))}
        </div>
      </div>
    </section>
  )
}

