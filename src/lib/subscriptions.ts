import { supabase } from './supabase'
import type { Database } from './supabase'

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']

export interface SubscriptionPlanWithFeatures extends SubscriptionPlan {
  features: string[]
}

export interface CreateSubscriptionData {
  user_id: string
  plan_id: string
  stripe_subscription_id?: string
  current_period_start: string
  current_period_end: string
  status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
}

class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get a specific subscription plan
   */
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      // No active subscription found
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<UserSubscription> {
    // First, cancel any existing active subscriptions
    await this.cancelUserSubscriptions(data.user_id)

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    // Update user's subscription tier and message limit
    await this.updateUserSubscriptionTier(data.user_id, data.plan_id)

    return subscription
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    subscriptionId: string, 
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  ): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    // If subscription is cancelled or inactive, revert user to free tier
    if (status === 'cancelled' || status === 'inactive') {
      const subscription = await this.getUserSubscriptionById(subscriptionId)
      if (subscription) {
        await this.revertToFreeTier(subscription.user_id)
      }
    }

    return data
  }

  /**
   * Cancel user's active subscriptions
   */
  async cancelUserSubscriptions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error

    // Revert user to free tier
    await this.revertToFreeTier(userId)
  }

  /**
   * Update user's subscription tier based on plan
   */
  private async updateUserSubscriptionTier(userId: string, planId: string): Promise<void> {
    // Get plan details
    const plan = await this.getSubscriptionPlan(planId)
    if (!plan) throw new Error('Plan not found')

    // Determine subscription tier based on plan
    let tier: 'free' | 'pro' | 'enterprise' = 'free'
    if (plan.price > 0 && plan.price < 50) {
      tier = 'pro'
    } else if (plan.price >= 50) {
      tier = 'enterprise'
    }

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        message_limit: plan.message_limit,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Revert user to free tier
   */
  private async revertToFreeTier(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        message_limit: 100, // Free tier limit
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Get subscription by ID
   */
  async getUserSubscriptionById(id: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Check if user has access to a feature
   */
  async userHasFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    
    if (!subscription) {
      // Free tier features
      const freeFeatures = ['Access to basic models', 'Standard support']
      return freeFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()))
    }

    // Check if subscription plan includes the feature
    const plan = await this.getSubscriptionPlan(subscription.plan_id)
    if (!plan) return false

    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('message_count, message_limit, subscription_tier')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    const { data: conversationCount, error: convError } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (convError) throw convError

    const { data: attachmentStats, error: attachError } = await supabase
      .from('attachments')
      .select('file_size')
      .eq('user_id', userId)

    if (attachError) throw attachError

    const totalStorageUsed = attachmentStats?.reduce((total, att) => total + att.file_size, 0) || 0

    return {
      message_count: user.message_count,
      message_limit: user.message_limit,
      message_usage_percentage: Math.round((user.message_count / user.message_limit) * 100),
      subscription_tier: user.subscription_tier,
      conversation_count: conversationCount || 0,
      storage_used: totalStorageUsed,
      storage_used_mb: Math.round(totalStorageUsed / 1024 / 1024 * 100) / 100
    }
  }

  /**
   * Reset monthly usage (for subscription renewals)
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        message_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Extend subscription period
   */
  async extendSubscription(
    subscriptionId: string, 
    newEndDate: string
  ): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        current_period_end: newEndDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Check if subscription is about to expire (within 7 days)
   */
  async checkSubscriptionExpiry(userId: string): Promise<{
    isExpiring: boolean
    daysUntilExpiry: number
    subscription?: UserSubscription
  }> {
    const subscription = await this.getUserSubscription(userId)
    
    if (!subscription) {
      return { isExpiring: false, daysUntilExpiry: 0 }
    }

    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      isExpiring: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      daysUntilExpiry,
      subscription
    }
  }
}

export const subscriptionService = new SubscriptionService() 
