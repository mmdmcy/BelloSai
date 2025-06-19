/**
 * ChatSharing Component
 * 
 * Allows users to share conversations publicly
 * Features:
 * - Generate shareable links // not implemented yet, WIP
 * - Set expiration dates
 * - View share statistics
 * - Copy links to clipboard
 */

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Eye, Calendar, Link, X, Check, ExternalLink } from 'lucide-react';
import { chatFeaturesService } from '../lib/chat-features';

interface ChatSharingProps {
  conversationId: string;
  conversationTitle: string;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareSettings {
  expiresInDays?: number;
  isPublic: boolean;
}

export default function ChatSharing({
  conversationId,
  conversationTitle,
  isDark,
  isOpen,
  onClose
}: ChatSharingProps) {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    expiresInDays: 7,
    isPublic: false
  });
  const [shareData, setShareData] = useState<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkExistingShare();
    }
  }, [isOpen, conversationId]);

  const checkExistingShare = async () => {
    try {
      // Check if conversation is already shared
      // This would require an API endpoint to check share status
      // For now, we'll assume it's not shared
      setShareData(null);
    } catch (error) {
      console.error('Error checking share status:', error);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);

    try {
      const shared = await chatFeaturesService.shareConversation(
        conversationId,
        shareSettings.expiresInDays
      );
      
      setShareData(shared);
      setShareSettings(prev => ({ ...prev, isPublic: true }));
    } catch (error: any) {
      setError(error.message || 'An error occurred while sharing');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async () => {
    setIsSharing(true);
    setError(null);

    try {
      await chatFeaturesService.unshareConversation(conversationId);
      setShareData(null);
      setShareSettings(prev => ({ ...prev, isPublic: false }));
    } catch (error: any) {
      setError(error.message || 'An error occurred while stopping sharing');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareData?.share_id) return;

    const shareUrl = `${window.location.origin}/shared/${shareData.share_id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openSharedLink = () => {
    if (!shareData?.share_id) return;
    const shareUrl = `${window.location.origin}/shared/${shareData.share_id}`;
    window.open(shareUrl, '_blank');
  };

  const formatExpiryDate = (expiresAt: string) => {
    return new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`
        w-full max-w-md rounded-lg shadow-xl
        ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Share Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conversation Info */}
          <div>
            <h4 className="font-medium mb-2">Conversation:</h4>
            <p className={`text-sm p-3 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {conversationTitle}
            </p>
          </div>

          {/* Share Settings */}
          {!shareData && (
            <div className="space-y-4">
              <h4 className="font-medium">Share Settings:</h4>
              
              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Expires after:
                </label>
                <select
                  value={shareSettings.expiresInDays || ''}
                  onChange={(e) => setShareSettings(prev => ({
                    ...prev,
                    expiresInDays: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  <option value="">Never</option>
                  <option value="1">1 day</option>
                  <option value="7">1 week</option>
                  <option value="30">1 month</option>
                  <option value="90">3 months</option>
                </select>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                                    {isSharing ? 'Sharing...' : 'Share Conversation'}
              </button>
            </div>
          )}

          {/* Shared Link */}
          {shareData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="w-5 h-5" />
                <span className="font-medium">Gesprek wordt gedeeld!</span>
              </div>

              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Link className="w-4 h-4 inline mr-2" />
                  Deel Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/shared/${shareData.share_id}`}
                    readOnly
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-900'
                    } focus:outline-none`}
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-3 rounded-lg border transition-colors ${
                      copied
                        ? 'bg-green-500 text-white border-green-500'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Copy link"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={openSharedLink}
                    className={`p-3 rounded-lg border transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Share Info */}
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="space-y-2 text-sm">
                  {shareData.expires_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Expires on: {formatExpiryDate(shareData.expires_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Viewed: {shareData.view_count || 0} times</span>
                  </div>
                </div>
              </div>

              {/* Unshare Button */}
              <button
                onClick={handleUnshare}
                disabled={isSharing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSharing ? 'Stopping...' : 'Stop Sharing'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Info */}
          <div className={`text-xs p-3 rounded-lg ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <p>
              ℹ️ Shared conversations are publicly accessible via the link. 
              Make sure you don't share any sensitive information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
