import { authMiddleware } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/webhooks/clerk"],
  afterAuth(auth, req) {
    // If the user is authenticated and trying to access a public route (except home page)
    if (auth.userId && auth.isPublicRoute && req.nextUrl.pathname !== "/") {
      const dashboardUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // If the user is authenticated and on the home page, let them stay there
    // This allows users to view the landing page even when logged in

    return NextResponse.next()
  },
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

