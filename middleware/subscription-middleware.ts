import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
  hasReachedFeatureLimit,
  incrementFeatureUsage,
  decrementFeatureUsage as decrementUsage,
  type FeatureType,
} from "@/lib/subscription-service"

// Middleware to check if a user has reached their feature limit
export async function checkFeatureLimit(req: NextRequest, feature: FeatureType): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hasReachedLimit = await hasReachedFeatureLimit(userId, feature)
  if (hasReachedLimit) {
    return NextResponse.json(
      {
        error: "Feature limit reached",
        message: `You have reached your ${feature.replace(/_/g, " ")} limit. Please upgrade your plan to continue.`,
        limitReached: true,
      },
      { status: 403 },
    )
  }

  return null
}

// Middleware to increment feature usage
export async function trackFeatureUsage(req: NextRequest, feature: FeatureType): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  await incrementFeatureUsage(userId, feature)
}

// Middleware to decrement feature usage
export async function decrementFeatureUsage(req: NextRequest, feature: FeatureType): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  await decrementUsage(userId, feature)
}
