import React, { useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useConversations } from '../hooks/useConversations'
import { useAuth } from '../contexts/AuthContext'
import type { DeepSeekModel } from '../lib/supabase-chat'

interface CleanChatViewProps {
  isDark: boolean
  onToggleTheme: () => void
  selectedModel: DeepSeekModel
  onModelChange: (model: DeepSeekModel) => void
}

export function CleanChatView({ 
  isDark, 
  onToggleTheme, 
  selectedModel, 
  onModelChange 
}: CleanChatViewProps) {
  const { user, signOut } = useAuth()
  const [inputValue, setInputValue] = useState('')
  
  // Chat state
  const {
    currentConversation,
    messages,
    isLoading,
    isGenerating,
    error: chatError,
    createNewConversation,
    loadConversation,
    sendMessage,
    clearError: clearChatError
  } = useChat()
  
  // Conversations state
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    deleteConversation,
    updateConversationTitle,
    clearError: clearConversationsError
  } = useConversations()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isGenerating) return
    
    const message = inputValue.trim()
    setInputValue('')
    
    try {
      await sendMessage(message, selectedModel)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleConversationSelect = async (conversationId: string) => {
    try {
      await loadConversation(conversationId)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Weet je zeker dat je deze conversatie wilt verwijderen?')) {
      return
    }

    try {
      await deleteConversation(conversationId)
      
      // If we deleted the current conversation, start a new one
      if (currentConversation?.id === conversationId) {
        createNewConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleNewChat = () => {
    createNewConversation()
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">BelloSai</h1>
          <p className="mb-4">Je moet ingelogd zijn om te chatten</p>
          <button
            onClick={onToggleTheme}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Wissel Thema
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">BelloSai</h1>
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + Nieuwe Chat
          </button>
        </div>

        {/* Model Selector */}
        <div className="p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
          <label className="block text-sm font-medium mb-2">Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as DeepSeekModel)}
            className={`w-full px-3 py-2 rounded border ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="DeepSeek-V3">DeepSeek-V3</option>
            <option value="DeepSeek-R1">DeepSeek-R1</option>
          </select>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-medium mb-3">Conversaties</h2>
            
            {conversationsLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            
            {conversationsError && (
              <div className="text-red-500 text-sm mb-3">
                {conversationsError}
                <button
                  onClick={clearConversationsError}
                  className="ml-2 underline"
                >
                  Verberg
                </button>
              </div>
            )}
            
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded cursor-pointer transition-colors ${
                    currentConversation?.id === conversation.id
                      ? isDark ? 'bg-gray-700' : 'bg-blue-50'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="pr-8">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs opacity-60">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conversation.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500 hover:text-white transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center text-sm font-medium`}>
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm truncate">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Uitloggen"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg font-semibold">
            {currentConversation?.title || 'Nieuwe Conversatie'}
          </h2>
          {isLoading && (
            <p className="text-sm opacity-60">Conversatie laden...</p>
          )}
        </div>

        {/* Error Display */}
        {chatError && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
            <div className="flex items-center justify-between">
              <span>{chatError}</span>
              <button
                onClick={clearChatError}
                className="underline text-sm"
              >
                Verberg
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <p>Start een conversatie door een bericht te typen!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.type === 'ai' && isGenerating && message.content === '' && (
                  <div className="flex items-center space-x-1">
                    <div className="animate-bounce w-2 h-2 bg-current rounded-full"></div>
                    <div className="animate-bounce w-2 h-2 bg-current rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce w-2 h-2 bg-current rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Typ je bericht..."
              disabled={isGenerating}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? '...' : 'Verzend'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 