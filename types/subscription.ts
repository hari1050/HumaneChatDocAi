export type PlanType = "free" | "pro" | "advanced"
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing"
export type FeatureType = "documents" | "chat_queries" | "research_queries"

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string|null
  plan_type: PlanType
  status: SubscriptionStatus
  current_period_start?: Date
  current_period_end?: Date
  cancel_at_period_end: boolean
  created_at: Date
  updated_at: Date
}

export interface Usage {
  id: string
  user_id: string
  period_start: Date
  period_end: Date
  documents_count: number
  chat_queries_count: number
  research_queries_count: number
  created_at: Date
  updated_at: Date
}

export interface PlanFeature {
  name: string
  free: string | number | boolean
  pro: string | number | boolean
  advanced: string | number | boolean
  description?: string
}

export interface PlanDetails {
  name: PlanType
  title: string
  price: number
  description: string
  features: PlanFeature[]
  highlighted?: boolean
}
