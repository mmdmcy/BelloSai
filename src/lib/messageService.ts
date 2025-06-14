import { supabase } from './supabase'
import type { Database } from './supabase'

type UserMessage = Database['public']['Tables']['user_messages']['Row']
type UserMessageInsert = Database['public']['Tables']['user_messages']['Insert']

export class MessageService {
  /**
   * Track een user message in de database
   */
  static async trackMessage(message: string): Promise<UserMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          user_id: user.id,
          message: message
        })
        .select()
        .single()

      if (error) {
        console.error('Error tracking message:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to track message:', error)
      return null
    }
  }

  /**
   * Haal alle berichten van een user op
   */
  static async getUserMessages(limit: number = 50): Promise<UserMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user messages:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch user messages:', error)
      return []
    }
  }

  /**
   * Tel het aantal berichten van een user
   */
  static async getUserMessageCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { count, error } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error counting user messages:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('Failed to count user messages:', error)
      return 0
    }
  }

  /**
   * Verwijder oude berichten (voor data cleanup)
   */
  static async cleanupOldMessages(daysOld: number = 30): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase
        .from('user_messages')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error cleaning up old messages:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Failed to cleanup old messages:', error)
      return false
    }
  }

  /**
   * Zoek in berichten van een user
   */
  static async searchUserMessages(searchTerm: string, limit: number = 20): Promise<UserMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('user_id', user.id)
        .ilike('message', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching user messages:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to search user messages:', error)
      return []
    }
  }
}

// Export types voor gebruik in andere bestanden
export type { UserMessage, UserMessageInsert } 