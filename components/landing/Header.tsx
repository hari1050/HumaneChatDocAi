import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-4 px-6 md:px-8 lg:px-12 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-xl text-white">WriticaAI</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/sign-in">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button className="bg-white text-black">Sign Up</Button>
        </Link>
      </div>
    </header>
  )
}
