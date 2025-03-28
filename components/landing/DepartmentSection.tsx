import type React from "react"

const StatCard = ({
  icon,
  title,
  description,
  stat,
}: { icon: React.ReactNode; title: string; description: string; stat: string }) => (
  <div className="bg-[#111] rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
    <div className="text-blue-500 mb-6">{icon}</div>
    <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400 mb-4">{description}</p>
    <div
      className={`inline-block px-4 py-1 rounded-full text-sm ${
        stat.includes("80%")
          ? "bg-green-500/10 text-green-500"
          : stat.includes("90%")
            ? "bg-blue-500/10 text-blue-500"
            : stat.includes("Real-time")
              ? "bg-indigo-500/10 text-indigo-500"
              : "bg-yellow-500/10 text-yellow-500"
      }`}
    >
      {stat}
    </div>
  </div>
)

export default function DepartmentSection() {
  const departments = [
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 4h16v16H4V4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Transform quarterly reports",
      description: "Transform quarterly reports and investor communications from months to days",
      stat: "80% faster reporting cycles",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Automate compliance",
      description: "Automate compliance documentation and legal contract reviews",
      stat: "90% reduction in review time",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 12h-4l-3 9L9 3l-3 9H2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Keep technical docs in sync",
      description: "Keep technical docs in sync with your product development",
      stat: "Real-time documentation updates",
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-4.97 0-9-4.03-9-9m9-9a9 9 0 00-9 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Turn scattered knowledge",
      description: "Turn scattered knowledge into searchable, structured content",
      stat: "Unified knowledge base",
    },
  ]

  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">Workflow Automation</h2>
        <p className="text-gray-400 text-center text-xl mb-16">
          See how Humane revolutionizes document workflows across your organization
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {departments.map((dept, index) => (
            <StatCard key={index} icon={dept.icon} title={dept.title} description={dept.description} stat={dept.stat} />
          ))}
        </div>
      </div>
    </section>
  )
}

