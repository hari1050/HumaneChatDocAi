import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { hasActiveSubscription } from "./lib/subscription-service"

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])

// Define auth routes to prevent redirect loops
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

// Define payment route to prevent redirect loops
const isPaymentRoute = createRouteMatcher(["/payment(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // If user is not authenticated and trying to access a protected route
  if (!userId && isProtectedRoute(req)) {
    // Redirect to sign-in
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // If user is authenticated and trying to access an auth route (sign-in, sign-up)
  if (userId && isAuthRoute(req)) {
    // Check if they have an active subscription
    const hasSubscription = await hasActiveSubscription(userId)

    // If they don't have a subscription, redirect to payment page
    if (!hasSubscription) {
      return NextResponse.redirect(new URL("/payment", req.url))
    }

    // If they have a subscription, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If user is authenticated and trying to access a protected route
  if (userId && isProtectedRoute(req)) {
    // Check if they have an active subscription
    const hasSubscription = await hasActiveSubscription(userId)

    // If they don't have a subscription, redirect to payment page
    if (!hasSubscription && !isPaymentRoute(req)) {
      return NextResponse.redirect(new URL("/payment", req.url))
    }
  }

  // For all other cases, continue with the default behavior
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

