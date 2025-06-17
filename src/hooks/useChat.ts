import { useState, useCallback, useRef } from 'react'
import { chatService, type ChatMessage, type ConversationWithMessages, ChatServiceError } from '../lib/chat-service'
import { sendChatMessage, type DeepSeekModel } from '../lib/supabase-chat'

export interface UseChatState {
  // Current conversation
  currentConversation: ConversationWithMessages | null
  messages: ChatMessage[]
  
  // UI state
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  
  // Actions
  createNewConversation: () => void
  loadConversation: (conversationId: string) => Promise<void>
  sendMessage: (content: string, model: DeepSeekModel) => Promise<void>
  clearError: () => void
}

export function useChat(): UseChatState {
  // State
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs to track current operation
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentConversationIdRef = useRef<string | null>(null)

  /**
   * Clear any error state
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
   * Create a new conversation and clear current state
   */
  const createNewConversation = useCallback(() => {
    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Clear state
    setCurrentConversation(null)
    setMessages([])
    setIsLoading(false)
    setIsGenerating(false)
    setError(null)
    currentConversationIdRef.current = null
    
    console.log('✅ New conversation started')
  }, [])

  /**
   * Load an existing conversation
   */
  const loadConversation = useCallback(async (conversationId: string) => {
    if (currentConversationIdRef.current === conversationId) {
      // Already loaded, just refresh
      console.log('🔄 Refreshing current conversation')
    }

    setIsLoading(true)
    setError(null)
    currentConversationIdRef.current = conversationId

    try {
      const conversation = await chatService.getConversation(conversationId)
      const frontendMessages = chatService.convertToFrontendMessages(conversation.messages)
      
      setCurrentConversation(conversation)
      setMessages(frontendMessages)
      
      console.log('✅ Conversation loaded:', conversationId, 'with', frontendMessages.length, 'messages')
    } catch (error) {
      handleError(error, 'Kon conversatie niet laden')
      // Reset state on error
      setCurrentConversation(null)
      setMessages([])
      currentConversationIdRef.current = null
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  /**
   * Send a message and handle AI response
   */
  const sendMessage = useCallback(async (content: string, model: DeepSeekModel) => {
    if (isGenerating) {
      console.warn('⚠️ Already generating, ignoring new message')
      return
    }

    if (!content.trim()) {
      setError('Bericht mag niet leeg zijn')
      return
    }

    // Cancel any previous operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsGenerating(true)
    setError(null)

    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: content.trim(),
        timestamp: new Date()
      }

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date()
      }

      // Add both messages to UI immediately
      setMessages(prev => [...prev, userMessage, aiMessage])

      // Create or get conversation
      let conversationId = currentConversationIdRef.current
      let conversation = currentConversation

             if (!conversationId) {
         console.log('🆕 Creating new conversation')
         const title = chatService.generateConversationTitle(content.trim())
         const newConversation = await chatService.createConversation({ title, model })
         conversationId = newConversation.id
         currentConversationIdRef.current = conversationId
         
         // Create conversation with empty messages array
         conversation = {
           ...newConversation,
           messages: []
         }
         setCurrentConversation(conversation)
       }

      // Save user message to database
      await chatService.addMessage(conversationId, {
        content: content.trim(),
        type: 'user',
        model
      })

      // Prepare messages for AI
      const chatMessages = [...messages, userMessage].map(msg => ({
        type: msg.type,
        content: msg.content
      }))

      // Stream AI response
      let fullResponse = ''
      const response = await sendChatMessage(
        chatMessages,
        model,
        (chunk: string) => {
          if (abortControllerRef.current?.signal.aborted) {
            return
          }

          fullResponse += chunk
          
          // Update AI message in real-time
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ))
        },
        conversationId
      )

      // Save final AI response to database
      if (response && !abortControllerRef.current?.signal.aborted) {
        await chatService.addMessage(conversationId, {
          content: response,
          type: 'ai',
          model
        })

        // Update final message
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: response }
            : msg
        ))

        console.log('✅ Message exchange completed')
      }

    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🛑 Message sending was cancelled')
        return
      }

      handleError(error, 'Kon bericht niet verzenden')
      
      // Remove AI message on error
      setMessages(prev => prev.filter(msg => msg.id !== `ai-${Date.now()}`))
      
      // Add error message instead
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Er is een fout opgetreden bij het verwerken van je bericht. Probeer het opnieuw.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [isGenerating, messages, currentConversation, handleError])

  return {
    // State
    currentConversation,
    messages,
    isLoading,
    isGenerating,
    error,
    
    // Actions
    createNewConversation,
    loadConversation,
    sendMessage,
    clearError
  }
} 