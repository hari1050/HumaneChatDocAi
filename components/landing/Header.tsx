import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="flex items-center justify-between py-6 px-8 md:px-12 lg:px-24 w-full bg-black">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-xl text-white">Humane</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/sign-in">
          <Button variant="ghost" className="text-white hover:text-white/80">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button className="bg-gradient-to-br from-[#e83f2f] via-[#e83f2f] to-[#222] hover:opacity-90 text-white text-base px-6 py-2">
            Sign Up
          </Button>
        </Link>
      </div>
    </header>
  )
}

