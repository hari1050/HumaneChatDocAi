"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface LimitWarningProps {
  feature: string
  onClose?: () => void
}

export function LimitWarning({ feature, onClose }: LimitWarningProps) {
  const featureName = feature.replace(/_/g, " ")

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Subscription Limit Reached</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">You've reached your {featureName} limit on your current plan.</p>
        <div className="flex gap-2 mt-4">
          <Link href="/dashboard/subscription">
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
