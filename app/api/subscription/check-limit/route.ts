import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { hasReachedFeatureLimit, PLAN_LIMITS, getUserPlanType } from "@/lib/subscription-service"
import type { FeatureType } from "@/lib/subscription-service"

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { feature, currentCount } = body

    if (!feature) {
      return NextResponse.json({ error: "Feature name is required" }, { status: 400 })
    }

    // Validate that the feature is a valid FeatureType
    if (!["documents", "chat_queries", "research_queries"].includes(feature)) {
      return NextResponse.json({ error: "Invalid feature type" }, { status: 400 })
    }

    // Check if user has reached the limit
    const hasReachedLimit = await hasReachedFeatureLimit(userId, feature as FeatureType)

    // If currentCount is provided, also check if adding one more would exceed the limit
    if (currentCount !== undefined && !hasReachedLimit) {
      const planType = await getUserPlanType(userId)
      const limit = PLAN_LIMITS[planType][feature as FeatureType]

      if (limit !== Number.POSITIVE_INFINITY && currentCount + 1 > limit) {
        return NextResponse.json(
          {
            error: "Feature limit reached",
            message: `You have reached your ${feature.replace(/_/g, " ")} limit. Please upgrade your plan to continue.`,
            limitReached: true,
          },
          { status: 403 },
        )
      }
    }

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

    return NextResponse.json({ limitReached: false })
  } catch (error) {
    console.error("Error checking feature limit:", error)
    return NextResponse.json({ error: "Failed to check feature limit" }, { status: 500 })
  }
}
