export default function ComparisonSection() {
    return (
      <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4">Before vs. After</h2>
          <p className="text-gray-400 text-center text-lg mb-16">
            See how Humane transforms your writing experience from fragmented to flowing.
          </p>
  
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before Column */}
            <div className="bg-[#111] rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-500 text-xl mb-6">Before Humane</div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">Multiple Applications</h3>
                  <p className="text-gray-400">Constantly switching between your document, browser tabs, and AI tools.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Lost Context</h3>
                  <p className="text-gray-400">Copying and pasting between tools, losing your train of thought.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Frustration & Delays</h3>
                  <p className="text-gray-400">Projects take longer, quality suffers, and creativity is stifled.</p>
                </div>
              </div>
            </div>
  
            {/* After Column */}
            <div className="bg-[#111] rounded-2xl p-8 border border-green-500/20">
              <div className="text-green-500 text-xl mb-6">After Humane</div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">Single Workspace</h3>
                  <p className="text-gray-400">
                    Everything you need in one seamless environment - writing, research, and AI assistance.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Maintained Flow</h3>
                  <p className="text-gray-400">
                    Stay in your creative zone with contextual assistance that doesn't interrupt your process.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Better Results, Faster</h3>
                  <p className="text-gray-400">
                    Complete projects in less time with higher quality and less frustration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  