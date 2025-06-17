import { supabase } from './supabase'
import type { Database } from '../types/database'

// Types
type Conversation = Database['public']['Tables']['conversations']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' // Keep frontend type for compatibility
  content: string
  timestamp: Date
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface CreateConversationData {
  title: string
  model: string
}

export interface CreateMessageData {
  content: string
  type: 'user' | 'ai' // Frontend type
  model?: string
}

// Error types
export class ChatServiceError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'ChatServiceError'
  }
}

export class ConversationNotFoundError extends ChatServiceError {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} not found`, 'CONVERSATION_NOT_FOUND')
  }
}

export class UnauthorizedError extends ChatServiceError {
  constructor() {
    super('User not authenticated', 'UNAUTHORIZED')
  }
}

/**
 * Centralized Chat Service
 * Handles all chat-related operations with proper error handling and state management
 */
export class ChatService {
  private static instance: ChatService
  
  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  private constructor() {}

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw new ChatServiceError('Failed to get user', error.code, error)
    if (!user) throw new UnauthorizedError()
    return user
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      const user = await this.getCurrentUser()
      
      const conversationData: ConversationInsert = {
        user_id: user.id,
        title: data.title,
        model: data.model
      }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) {
        throw new ChatServiceError('Failed to create conversation', error.code, error)
      }

      console.log('✅ Conversation created:', conversation.id)
      return conversation
    } catch (error) {
      console.error('❌ Failed to create conversation:', error)
      throw error
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(): Promise<Conversation[]> {
    try {
      const user = await this.getCurrentUser()

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new ChatServiceError('Failed to fetch conversations', error.code, error)
      }

      return conversations || []
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error)
      throw error
    }
  }

  /**
   * Get conversation with messages
   */
  async getConversation(conversationId: string): Promise<ConversationWithMessages> {
    try {
      const user = await this.getCurrentUser()

      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError) {
        if (convError.code === 'PGRST116') {
          throw new ConversationNotFoundError(conversationId)
        }
        throw new ChatServiceError('Failed to fetch conversation', convError.code, convError)
      }

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        throw new ChatServiceError('Failed to fetch messages', msgError.code, msgError)
      }

      return {
        ...conversation,
        messages: messages || []
      }
    } catch (error) {
      console.error('❌ Failed to fetch conversation:', error)
      throw error
    }
  }

  /**
   * Add message to conversation (atomic operation)
   */
  async addMessage(conversationId: string, data: CreateMessageData): Promise<Message> {
    try {
      const user = await this.getCurrentUser()

      // Verify conversation ownership
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError) {
        if (convError.code === 'PGRST116') {
          throw new ConversationNotFoundError(conversationId)
        }
        throw new ChatServiceError('Failed to verify conversation', convError.code, convError)
      }

      // Insert message and update conversation timestamp in a transaction
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        role: data.type === 'ai' ? 'assistant' : 'user', // Convert frontend type to database type
        content: data.content,
        model: data.model
      }

      // Start transaction
      const { data: message, error: insertError } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (insertError) {
        throw new ChatServiceError('Failed to save message', insertError.code, insertError)
      }

      // Update conversation timestamp (this is handled by database trigger)
      // But we can also do it explicitly for reliability
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (updateError) {
        console.warn('⚠️ Failed to update conversation timestamp:', updateError.message)
        // Don't throw here, message was saved successfully
      }

      console.log('✅ Message saved successfully')
      return message
    } catch (error) {
      console.error('❌ Failed to add message:', error)
      throw error
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()

      const { error } = await supabase
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        throw new ChatServiceError('Failed to update conversation title', error.code, error)
      }

      console.log('✅ Conversation title updated')
    } catch (error) {
      console.error('❌ Failed to update conversation title:', error)
      throw error
    }
  }

  /**
   * Delete conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()

      // Delete conversation (messages will be deleted by CASCADE)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        throw new ChatServiceError('Failed to delete conversation', error.code, error)
      }

      console.log('✅ Conversation deleted successfully')
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error)
      throw error
    }
  }

  /**
   * Convert database messages to frontend format
   */
  convertToFrontendMessages(messages: Message[]): ChatMessage[] {
    return messages.map(msg => ({
      id: msg.id,
      type: msg.role === 'assistant' ? 'ai' : 'user', // Convert database type to frontend type
      content: msg.content,
      timestamp: new Date(msg.created_at)
    }))
  }

  /**
   * Generate conversation title from first message
   */
  generateConversationTitle(firstMessage: string): string {
    // Take first 50 characters and clean up
    const title = firstMessage
      .trim()
      .substring(0, 50)
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return title || 'Nieuwe Conversatie'
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance() 