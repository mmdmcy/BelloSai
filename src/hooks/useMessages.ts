import { useState, useEffect, useCallback } from 'react'
import { MessageService, type UserMessage } from '../lib/messageService'
import { useAuth } from '../contexts/AuthContext'

interface UseMessagesReturn {
  messages: UserMessage[]
  messageCount: number
  loading: boolean
  error: string | null
  trackMessage: (message: string) => Promise<boolean>
  searchMessages: (searchTerm: string) => Promise<UserMessage[]>
  refreshMessages: () => Promise<void>
  cleanupOldMessages: (daysOld?: number) => Promise<boolean>
}

export function useMessages(limit: number = 50): UseMessagesReturn {
  const { user, isAuthReady } = useAuth()
  const [messages, setMessages] = useState<UserMessage[]>([])
  const [messageCount, setMessageCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch messages from the database
  const fetchMessages = useCallback(async () => {
    if (!user || !isAuthReady) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [messagesData, countData] = await Promise.all([
        MessageService.getUserMessages(limit),
        MessageService.getUserMessageCount()
      ])

      setMessages(messagesData)
      setMessageCount(countData)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [user, isAuthReady, limit])

  // Track a new message
  const trackMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)
      const newMessage = await MessageService.trackMessage(message)
      
      if (newMessage) {
        // Add the new message to the beginning of the list
        setMessages(prev => [newMessage, ...prev.slice(0, limit - 1)])
        setMessageCount(prev => prev + 1)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error tracking message:', err)
      setError(err instanceof Error ? err.message : 'Failed to track message')
      return false
    }
  }, [user, limit])

  // Search messages
  const searchMessages = useCallback(async (searchTerm: string): Promise<UserMessage[]> => {
    if (!user) {
      setError('User not authenticated')
      return []
    }

    try {
      setError(null)
      const searchResults = await MessageService.searchUserMessages(searchTerm, 20)
      return searchResults
    } catch (err) {
      console.error('Error searching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to search messages')
      return []
    }
  }, [user])

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await fetchMessages()
  }, [fetchMessages])

  // Cleanup old messages
  const cleanupOldMessages = useCallback(async (daysOld: number = 30): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)
      const success = await MessageService.cleanupOldMessages(daysOld)
      
      if (success) {
        // Refresh messages after cleanup
        await fetchMessages()
      }
      
      return success
    } catch (err) {
      console.error('Error cleaning up messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to cleanup messages')
      return false
    }
  }, [user, fetchMessages])

  // Fetch messages when component mounts or user changes
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    messageCount,
    loading,
    error,
    trackMessage,
    searchMessages,
    refreshMessages,
    cleanupOldMessages,
  }
} 