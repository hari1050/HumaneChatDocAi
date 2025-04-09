import Link from "next/link"

export default function Footer() {
  return (
    <section className="bg-black py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">Ready to Experience WriticaAI?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of writers who are already experiencing the power of AI-assisted writing at getwritica.app.
          </p>

          <Link
            href="/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-opacity"
          >
            Start Writing <span className="ml-2">→</span>
          </Link>
        </div>

        <div className="mt-20 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>© 2025 WriticaAI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
