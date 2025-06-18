/**
 * Integration Example for BelloSai Database Services
 * 
 * This file shows how to integrate the Supabase backend with your existing React application.
 * Copy and modify these examples to implement real authentication and chat functionality.
 */

import { authService } from './auth'
import { conversationService } from './conversations'
import { attachmentService } from './attachments'
import { subscriptionService } from './subscriptions'

// Example 1: User Authentication
export async function handleUserSignUp(email: string, password: string, fullName: string) {
  try {
    const result = await authService.signUp({ email, password, full_name: fullName })
    console.log('User signed up:', result)
    return result
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export async function handleUserSignIn(email: string, password: string) {
  try {
    const result = await authService.signIn({ email, password })
    console.log('User signed in:', result)
    return result
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Example 2: Chat Functionality
export async function createNewConversation(title: string, model: string) {
  try {
    const conversation = await conversationService.createConversation({ title, model })
    console.log('New conversation created:', conversation)
    return conversation
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw error
  }
}

export async function sendMessageToConversation(conversationId: string, content: string, model: string) {
  try {
    // Check message limit first
    const canSend = await authService.checkMessageLimit()
    if (!canSend) {
      throw new Error('Message limit reached. Please upgrade your subscription.')
    }

    // Add user message
    const userMessage = await conversationService.addMessage({
      conversation_id: conversationId,
      type: 'user',
      content,
      model
    })

    // Increment message count
    await authService.incrementMessageCount()

    // Here you would call your AI service to get a response
    // For now, we'll add a placeholder AI message
    const aiResponse = await conversationService.addMessage({
      conversation_id: conversationId,
      type: 'ai',
      content: 'This is a placeholder AI response. Integrate with your AI service here.',
      model
    })

    return { userMessage, aiResponse }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Example 3: File Upload
export async function uploadFileAttachment(file: File, userId: string) {
  try {
    // Prepare file (resize images, etc.)
    const processedFile = await attachmentService.prepareFile(file)
    
    // Upload to storage
    const attachment = await attachmentService.uploadAttachment({
      file: processedFile,
      userId
    })

    console.log('File uploaded:', attachment)
    return attachment
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Example 4: Subscription Management
export async function getUserSubscriptionInfo(userId: string) {
  try {
    const subscription = await subscriptionService.getUserSubscription(userId)
    const plans = await subscriptionService.getSubscriptionPlans()
    const usage = await subscriptionService.getUserUsageStats(userId)

    return { subscription, plans, usage }
  } catch (error) {
    console.error('Error fetching subscription info:', error)
    throw error
  }
}

// Example 5: Real-time Conversation Loading
export async function loadConversationWithMessages(conversationId: string) {
  try {
    const conversation = await conversationService.getConversation(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    return conversation
  } catch (error) {
    console.error('Error loading conversation:', error)
    throw error
  }
}

// Example 6: Share Conversation
export async function shareConversation(conversationId: string) {
  try {
    const shareId = await conversationService.shareConversation(conversationId)
    const shareUrl = `${window.location.origin}/shared/${shareId}`
    
    console.log('Conversation shared:', shareUrl)
    return shareUrl
  } catch (error) {
    console.error('Error sharing conversation:', error)
    throw error
  }
}

// Example 7: Check Feature Access
export async function checkUserFeatureAccess(userId: string, feature: string) {
  try {
    const hasAccess = await subscriptionService.userHasFeature(userId, feature)
    return hasAccess
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Integration with existing App.tsx
 * 
 * To integrate these services with your existing app, you would:
 * 
 * 1. Replace the mock messages array with real data from the database
 * 2. Update the sendMessage function to use sendMessageToConversation
 * 3. Add authentication state management
 * 4. Load user's conversations on app start
 * 5. Implement file upload in the chat interface
 * 6. Add subscription management UI
 * 
 * Example integration in your App component:
 * 
 * ```typescript
 * // Add state for authentication
 * const [user, setUser] = useState<AuthUser | null>(null)
 * const [conversations, setConversations] = useState<Conversation[]>([])
 * const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
 * 
 * // Load user data on mount
 * useEffect(() => {
 *   const initializeApp = async () => {
 *     try {
 *       const session = await authService.getSession()
 *       if (session?.user) {
 *         const userProfile = await authService.getUserProfile()
 *         setUser(userProfile)
 *         
 *         const userConversations = await conversationService.getUserConversations()
 *         setConversations(userConversations)
 *       }
 *     } catch (error) {
 *       console.error('Error initializing app:', error)
 *     }
 *   }
 *   
 *   initializeApp()
 * }, [])
 * 
 * // Update sendMessage function
 * const sendMessage = async (content: string) => {
 *   if (!user || !currentConversationId) return
 *   
 *   try {
 *     const { userMessage, aiResponse } = await sendMessageToConversation(
 *       currentConversationId, 
 *       content, 
 *       selectedModel
 *     )
 *     
 *     // Update local state with new messages
 *     setMessages(prev => [...prev, userMessage, aiResponse])
 *   } catch (error) {
 *     console.error('Error sending message:', error)
 *   }
 * }
 * ```
 */

export const integrationExamples = {
  handleUserSignUp,
  handleUserSignIn,
  createNewConversation,
  sendMessageToConversation,
  uploadFileAttachment,
  getUserSubscriptionInfo,
  loadConversationWithMessages,
  shareConversation,
  checkUserFeatureAccess
} 
