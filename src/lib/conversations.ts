import { supabase } from './supabase'
import type { Database } from './supabase'

type Conversation = Database['public']['Tables']['conversations']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface CreateConversationData {
  title: string
  model: string
}

export interface CreateMessageData {
  conversation_id: string
  type: 'user' | 'ai'
  content: string
  model?: string
  parent_message_id?: string
  attachments?: string[]
  metadata?: Record<string, any>
}

class ConversationService {
  /**
   * Get all conversations for the current user
   */
  async getUserConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get a specific conversation with its messages
   */
  async getConversation(id: string): Promise<ConversationWithMessages | null> {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (convError) throw convError
    if (!conversation) return null

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    return {
      ...conversation,
      messages: messages || []
    }
  }

  /**
   * Get a shared conversation by share_id
   */
  async getSharedConversation(shareId: string): Promise<ConversationWithMessages | null> {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('share_id', shareId)
      .eq('is_shared', true)
      .single()

    if (convError) throw convError
    if (!conversation) return null

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    return {
      ...conversation,
      messages: messages || []
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return conversation
  }

  /**
   * Update a conversation
   */
  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Share a conversation
   */
  async shareConversation(id: string): Promise<string> {
    // Generate a unique share ID
    const { data: shareId, error: shareError } = await supabase
      .rpc('generate_share_id')

    if (shareError) throw shareError

    const { data, error } = await supabase
      .from('conversations')
      .update({
        is_shared: true,
        share_id: shareId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return shareId
  }

  /**
   * Unshare a conversation
   */
  async unshareConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        is_shared: false,
        share_id: null
      })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(data: CreateMessageData): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.conversation_id)

    return message
  }

  /**
   * Get messages for a conversation with optional parent filtering (for branching)
   */
  async getMessages(conversationId: string, parentId?: string): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)

    if (parentId !== undefined) {
      query = query.eq('parent_message_id', parentId)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Update a message
   */
  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get conversation branches (alternative conversation paths)
   */
  async getConversationBranches(conversationId: string, fromMessageId?: string): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)

    if (fromMessageId) {
      query = query.eq('parent_message_id', fromMessageId)
    } else {
      query = query.is('parent_message_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Search conversations by title or content
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get recent conversations
   */
  async getRecentConversations(limit: number = 10): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

export const conversationService = new ConversationService() 
