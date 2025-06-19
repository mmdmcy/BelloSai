import React, { useState } from 'react'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../contexts/AuthContext'

export function MessageTracker() {
  const { user } = useAuth()
  const { 
    messages, 
    messageCount, 
    loading, 
    error, 
    trackMessage, 
    searchMessages,
    refreshMessages,
    cleanupOldMessages 
  } = useMessages(20)
  
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleTrackMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsTracking(true)
    try {
      const success = await trackMessage(newMessage.trim())
      if (success) {
        setNewMessage('')
        console.log('Message tracked successfully!')
      } else {
        console.error('Failed to track message')
      }
    } catch (err) {
      console.error('Error tracking message:', err)
    } finally {
      setIsTracking(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const results = await searchMessages(searchTerm.trim())
      setSearchResults(results)
    } catch (err) {
      console.error('Error searching messages:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCleanup = async () => {
    const confirmed = window.confirm('Are you sure you want to delete messages older than 30 days?')
    if (!confirmed) return

    try {
      const success = await cleanupOldMessages(30)
      if (success) {
        console.log('Old messages cleaned up successfully!')
      } else {
        console.error('Failed to cleanup old messages')
      }
    } catch (err) {
      console.error('Error cleaning up messages:', err)
    }
  }

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">You must be logged in to track messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Message System</h2>
        
        {/* Stats */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800">
            <strong>Total number of messages:</strong> {messageCount}
          </p>
          <p className="text-blue-800">
            <strong>User:</strong> {user.email}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Track New Message */}
        <form onSubmit={handleTrackMessage} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter a message to track..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTracking}
            />
            <button
              type="submit"
              disabled={isTracking || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTracking ? 'Tracking...' : 'Track Message'}
            </button>
          </div>
        </form>

        {/* Search Messages */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={refreshMessages}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={handleCleanup}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clean Up Old Messages
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Results ({searchResults.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((message) => (
                <div key={message.id} className="bg-green-50 p-3 rounded border">
                  <p className="text-gray-800">{message.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleString('en-US')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Messages {loading && '(Loading...)'}
          </h3>
          
          {messages.length === 0 && !loading ? (
            <p className="text-gray-500 italic">No messages found yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="bg-gray-50 p-3 rounded border">
                  <p className="text-gray-800">{message.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleString('en-US')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
