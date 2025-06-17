import { useState, useCallback, useEffect } from 'react'
import { chatService, ChatServiceError } from '../lib/chat-service'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../types/database'

type Conversation = Database['public']['Tables']['conversations']['Row']

export interface UseConversationsState {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadConversations: () => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
  clearError: () => void
}

export function useConversations(): UseConversationsState {
  const { user, isAuthReady } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Handle errors with user-friendly messages
   */
  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error(defaultMessage, error)
    
    if (error instanceof ChatServiceError) {
      setError(error.message)
    } else if (error?.message) {
      setError(error.message)
    } else {
      setError(defaultMessage)
    }
  }, [])

  /**
   * Load user's conversations
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const userConversations = await chatService.getUserConversations()
      setConversations(userConversations)
      console.log('✅ Loaded', userConversations.length, 'conversations')
    } catch (error) {
      handleError(error, 'Kon conversaties niet laden')
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }, [user, handleError])

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    setError(null)

    try {
      await chatService.deleteConversation(conversationId)
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      console.log('✅ Conversation deleted:', conversationId)
    } catch (error) {
      handleError(error, 'Kon conversatie niet verwijderen')
      throw error // Re-throw so caller can handle UI feedback
    }
  }, [handleError])

  /**
   * Update conversation title
   */
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    setError(null)

    try {
      await chatService.updateConversationTitle(conversationId, title)
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title, updated_at: new Date().toISOString() }
          : conv
      ))
      
      console.log('✅ Conversation title updated:', conversationId)
    } catch (error) {
      handleError(error, 'Kon titel niet bijwerken')
      throw error // Re-throw so caller can handle UI feedback
    }
  }, [handleError])

  /**
   * Load conversations when user changes or becomes ready
   */
  useEffect(() => {
    if (isAuthReady) {
      loadConversations()
    }
  }, [isAuthReady, loadConversations])

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    deleteConversation,
    updateConversationTitle,
    clearError
  }
} 