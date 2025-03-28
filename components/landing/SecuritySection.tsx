import type React from "react"

type SecurityFeatureProps = {
  icon: React.ReactNode
  title: string
  description: string
}

function SecurityFeature({ icon, title, description }: SecurityFeatureProps) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mr-3 mt-1">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  )
}

export default function SecuritySection() {
  const securityFeatures = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-500"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: "SOC 2 Type II Compliant",
      description: "Your data is protected by industry-leading security practices",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-500"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="m9 16 2 2 4-4"></path>
        </svg>
      ),
      title: "End-to-End Encryption",
      description: "All documents and communications are encrypted at rest and in transit",
    },
  ]

  const complianceFeatures = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
      ),
      title: "GDPR Compliant",
      description: "Meet European data protection requirements",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M16 13H8"></path>
          <path d="M16 17H8"></path>
          <path d="M10 9H8"></path>
        </svg>
      ),
      title: "Audit Logs",
      description: "Complete visibility into document access and changes",
    },
  ]

  return (
    <section className="py-20 px-6 md:px-10 lg:px-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Enterprise-Grade Security</h2>
          <div className="space-y-8">
            {securityFeatures.map((feature, index) => (
              <SecurityFeature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Compliance Ready</h2>
          <div className="space-y-8">
            {complianceFeatures.map((feature, index) => (
              <SecurityFeature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

